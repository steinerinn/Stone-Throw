import {compactJournal,publishCompactJournal} from './compact-journal.mjs';
import {journalJson,journalBuffers,appendBuffers} from './journal-json.mjs';
import {stateVersion,readableStateVersion} from './persistence-contract.mjs';
import {journalRecords} from './journal-reader.mjs';
import {loadRecoveryCache,recoveryCacheWriter} from './recovery-cache.mjs';
import {durableReplace,retryFile} from './durable-file.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {Worker} from 'node:worker_threads';
import {measured} from './beta-metrics.mjs';
import {journalArchiveEncoder,archiveDecoder} from './archive-wire.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
export const checkpointId='controlled-playtest-v1';
export function openStore(directory,build,mode,{journalEnabled=true,journalMaxBytes=256*1024*1024,backgroundCompaction=true}={}){
 if(!directory)return null;
 if(!Number.isSafeInteger(journalMaxBytes)||journalMaxBytes<1024)throw Error('Invalid journal size limit');
 const dir=path.resolve(directory),file=path.join(dir,'checkpoint.json'),journal=path.join(dir,'checkpoint.journal'),lock=path.join(dir,'server.lock');
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 if(fs.existsSync(lock)){let pid;try{pid=JSON.parse(fs.readFileSync(lock,'utf8')).pid;if(!Number.isInteger(pid)||pid<=0)throw Error();}catch{throw Error('state-locked');}let alive=true;try{process.kill(pid,0);}catch(e){if(e.code==='ESRCH')alive=false;}if(alive)throw Error('state-locked');fs.unlinkSync(lock);}
 const lockFd=fs.openSync(lock,'wx',0o600);fs.writeFileSync(lockFd,JSON.stringify({pid:process.pid}));fs.closeSync(lockFd);
 const preparedFile=journal+'.compact.prepared.'+randomUUID()+'.tmp';
 let pendingCompact=null,closed=false,retiringCompact=false,nextPreparationAt=0;
 const discardCompact=()=>{const pending=pendingCompact;if(!pending)return;pendingCompact=null;retiringCompact=true;nextPreparationAt=performance.now()+30000;const cleanup=()=>{try{fs.unlinkSync(pending.file);}catch{}retiringCompact=false;};void pending.worker.terminate().then(cleanup,cleanup);};
 let journalFd=null,journalRequired=false,needsVersionUpgrade=false,storageBuild=build,cacheWriter=null;const diagnostics={cacheUsed:false,replayedRecords:0,replayedBytes:0};const release=()=>{closed=true;discardCompact();cacheWriter?.close();if(journalFd!==null){fs.closeSync(journalFd);journalFd=null;}if(fs.existsSync(lock))fs.unlinkSync(lock);};
 try{
  let value=null,sequence=0,previous='',lastValue=null,reset=true,failed=false;const encode=journalArchiveEncoder(),prepareJson=journalJson();let decode=archiveDecoder();
  if(fs.existsSync(file)){let saved;try{saved=JSON.parse(measured('checkpoint-disk-read',()=>fs.readFileSync(file,'utf8')));if(typeof saved.payload!=='string'||digest(saved.payload)!==saved.sha256)throw Error();}catch{throw Error('checkpoint-unavailable');}
   journalRequired=saved.journal===true;if(journalRequired&&!journalEnabled)throw Error('incompatible-checkpoint');if(journalRequired&&!fs.existsSync(journal))throw Error('checkpoint-unavailable');
   if(saved.format!==checkpointId||!readableStateVersion(saved.stateVersion)||saved.mode!==mode)throw Error('incompatible-checkpoint');
   needsVersionUpgrade=saved.stateVersion!==stateVersion;storageBuild=saved.build; // Preserve legacy-reader rollback; producerBuild identifies the running build.
   try{value=JSON.parse(saved.payload,(_,v)=>v&&v.$map?new Map(v.$map):v);}catch{throw Error('checkpoint-unavailable');}
  }else if(journalEnabled&&fs.existsSync(journal))throw Error('checkpoint-unavailable');
  // Temporary playtest containment: replace one full, self-contained snapshot.
  // No journal reads, append, replay, truncation or archive delta accumulation.
  if(!journalEnabled)return {value,release,diagnostics,cacheReady:()=>cacheWriter?.idle(),write(next){if(failed)throw Error('checkpoint-write-failed');try{
   const payload=measured('checkpoint-serialization',()=>JSON.stringify(next,(_,v)=>v instanceof Map?{$map:[...v]}:v));
   const sha256=digest(payload);if(sha256===lastValue)return;
   measured('disk-write-fsync',()=>{durableReplace(file,JSON.stringify({format:checkpointId,stateVersion,build:storageBuild,producerBuild:build,mode,sha256,payload}));});
   lastValue=sha256;
  }catch(error){failed=true;throw error;}}};
  const cacheFile=path.join(dir,'recovery-cache.json');let end=0,compactAt=journalMaxBytes;
  if(fs.existsSync(journal)){
   const cached=loadRecoveryCache(cacheFile,journal,stateVersion,mode,storageBuild);
   if(cached)try{value=decode(cached.packet);sequence=cached.sequence;previous=cached.previous;end=cached.end;diagnostics.cacheUsed=true;}catch{decode=archiveDecoder();sequence=0;previous='';end=0;}
   const from=end;
   try{for(const row of journalRecords(journal,end)){const record=JSON.parse(row.line);if(record.sequence!==sequence+1||record.previous!==previous||typeof record.payload!=='string'||digest(record.payload)!==record.sha256)throw Error();const entry=JSON.parse(record.payload);if(entry.format!==checkpointId||entry.build!==storageBuild||entry.mode!==mode||!readableStateVersion(entry.stateVersion))throw Error();if(entry.reset)decode=archiveDecoder();value=decode(entry.packet);sequence=record.sequence;previous=record.sha256;end=row.end;diagnostics.replayedRecords++;}}catch{throw Error('checkpoint-unavailable');}
   diagnostics.replayedBytes=end-from;
   // Only discard the unacknowledged, non-newline-terminated tail.
   if(journalRequired&&sequence===0)throw Error('checkpoint-unavailable');
   if(end<fs.statSync(journal).size){const fd=fs.openSync(journal,'r+');try{fs.ftruncateSync(fd,end);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
  }
  cacheWriter=recoveryCacheWriter(cacheFile,journal,stateVersion,mode,()=>encode.checkpoint());
  const closeJournal=()=>{cacheWriter.close();if(journalFd!==null){fs.closeSync(journalFd);journalFd=null;}};
  const installAnchor=(anchor,before,started,background=false)=>{
   sequence=anchor.sequence;previous=anchor.previous;end=anchor.end;compactAt=Math.max(journalMaxBytes,end*4);
   diagnostics.compactions=(diagnostics.compactions||0)+1;diagnostics.compactedFromBytes=before;diagnostics.compactedToBytes=end;diagnostics.compactionMs=Math.round(performance.now()-started);
   if(background)diagnostics.backgroundCompactions=(diagnostics.backgroundCompactions||0)+1;
   cacheWriter=recoveryCacheWriter(cacheFile,journal,stateVersion,mode,()=>encode.checkpoint());cacheWriter.record(anchor);
  };
  // A busy journal invalidates prepared snapshots. Back off after a discard
  // instead of cloning and validating another doomed candidate on every write.
  const prepareBackground=next=>{
   if(!backgroundCompaction||pendingCompact||retiringCompact||closed||performance.now()<nextPreparationAt||end<compactAt/2)return;
   const file=preparedFile,started=performance.now();
   try{const worker=new Worker(new URL('./compaction-worker.mjs',import.meta.url),{workerData:{file,entry:{format:checkpointId,stateVersion,build:storageBuild,producerBuild:build,mode,reset:true,packet:encode.checkpoint()},expected:next}});
    const pending={file,worker,sequence,previous,end,started,result:null};pendingCompact=pending;
    pending.done=new Promise(resolve=>{worker.once('message',result=>{pending.result=result;if(!result.ok)diagnostics.backgroundPreparationFailures=(diagnostics.backgroundPreparationFailures||0)+1;resolve();});worker.once('error',()=>{diagnostics.backgroundPreparationFailures=(diagnostics.backgroundPreparationFailures||0)+1;pending.result={ok:false};resolve();});worker.once('exit',()=>{pending.result??={ok:false};resolve();});});worker.unref();
   }catch{nextPreparationAt=performance.now()+30000;diagnostics.backgroundPreparationFailures=(diagnostics.backgroundPreparationFailures||0)+1;}
  };
  return {value,release,diagnostics,cacheReady:()=>cacheWriter?.idle(),maintenanceReady:async()=>{const pending=pendingCompact;if(!pending)return;pending.worker.ref();try{await pending.done;}finally{pending.worker.unref();}},write(next){if(failed||closed)throw Error('checkpoint-write-failed');try{
   // Publication stays synchronous at the existing durable-write boundary. The
   // worker never touches the live journal; a single intervening append makes
   // its candidate ineligible. The foreground bound remains the fallback.
   if(pendingCompact?.result){const pending=pendingCompact;
    if(pending.result.ok&&pending.sequence===sequence&&pending.previous===previous&&pending.end===end){const before=end,started=performance.now();publishCompactJournal(journal,pending.file,pending.result.anchor,closeJournal);installAnchor(pending.result.anchor,before,started,true);diagnostics.backgroundPreparationMs=Math.round(pending.result.ms);pendingCompact=null;}
    else{diagnostics.discardedCompactions=(diagnostics.discardedCompactions||0)+1;discardCompact();}
   }
   const packet=measured('archive-encode',()=>encode(next)),json=prepareJson(),preparedValue=measured('checkpoint-live-serialization',()=>json(packet.value)),valueText=preparedValue.sha256;
   if(!reset&&valueText===lastValue&&!packet.updates.length&&!packet.snapshotUpdates.length&&!packet.snapshotReleased.length){prepareBackground(next);return;}
   const encoded=measured('checkpoint-serialization',()=>json({format:checkpointId,stateVersion,build:storageBuild,producerBuild:build,mode,reset,packet},{value:packet.value,parts:preparedValue.parts})),sha256=encoded.sha256,buffers=journalBuffers(sequence+1,previous,encoded);let written=0;
   measured('disk-write-fsync',()=>{
    if(needsVersionUpgrade){const base=JSON.parse(fs.readFileSync(file,'utf8'));durableReplace(file,JSON.stringify({...base,stateVersion}));needsVersionUpgrade=false;}
    if(!fs.existsSync(file)){durableReplace(file,JSON.stringify({format:checkpointId,stateVersion,build:storageBuild,producerBuild:build,mode,sha256:digest('null'),payload:'null'}));}
    if(journalFd===null)journalFd=retryFile('open-journal',journal,()=>fs.openSync(journal,'a',0o600));
    written=appendBuffers(fs,journalFd,buffers);retryFile('fsync-journal',journal,()=>fs.fsyncSync(journalFd));
    if(!journalRequired){const saved=JSON.parse(fs.readFileSync(file,'utf8'));durableReplace(file,JSON.stringify({...saved,journal:true}));journalRequired=true;}
   });
   sequence++;previous=sha256;lastValue=valueText;reset=false;const start=end;end+=written;
   if(end>=compactAt){
    discardCompact();const started=performance.now(),before=end;
    const anchor=compactJournal(journal,{format:checkpointId,stateVersion,build:storageBuild,producerBuild:build,mode,reset:true,packet:encode.checkpoint()},next,closeJournal);
    installAnchor(anchor,before,started);
   }else{cacheWriter.record({sequence,previous,start,end});prepareBackground(next);}
   }catch(error){failed=true;throw error;}
  }};
 }catch(e){release();throw e;}
}
