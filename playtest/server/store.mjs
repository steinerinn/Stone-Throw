import {journalJson,journalBuffers,appendBuffers} from './journal-json.mjs';
import {stateVersion,readableStateVersion} from './persistence-contract.mjs';
import {journalRecords} from './journal-reader.mjs';
import {loadRecoveryCache,recoveryCacheWriter} from './recovery-cache.mjs';
import {durableReplace,retryFile} from './durable-file.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {measured} from './beta-metrics.mjs';
import {journalArchiveEncoder,archiveDecoder} from './archive-wire.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
export const checkpointId='controlled-playtest-v1';
export function openStore(directory,build,mode,{journalEnabled=true}={}){
 if(!directory)return null;
 const dir=path.resolve(directory),file=path.join(dir,'checkpoint.json'),journal=path.join(dir,'checkpoint.journal'),lock=path.join(dir,'server.lock');
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 if(fs.existsSync(lock)){let pid;try{pid=JSON.parse(fs.readFileSync(lock,'utf8')).pid;if(!Number.isInteger(pid)||pid<=0)throw Error();}catch{throw Error('state-locked');}let alive=true;try{process.kill(pid,0);}catch(e){if(e.code==='ESRCH')alive=false;}if(alive)throw Error('state-locked');fs.unlinkSync(lock);}
 const lockFd=fs.openSync(lock,'wx',0o600);fs.writeFileSync(lockFd,JSON.stringify({pid:process.pid}));fs.closeSync(lockFd);
 let journalFd=null,journalRequired=false,needsVersionUpgrade=false,storageBuild=build,cacheWriter=null;const diagnostics={cacheUsed:false,replayedRecords:0,replayedBytes:0};const release=()=>{cacheWriter?.close();if(journalFd!==null){fs.closeSync(journalFd);journalFd=null;}if(fs.existsSync(lock))fs.unlinkSync(lock);};
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
  const cacheFile=path.join(dir,'recovery-cache.json');let end=0;
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
  return {value,release,diagnostics,cacheReady:()=>cacheWriter?.idle(),write(next){if(failed)throw Error('checkpoint-write-failed');try{
   const packet=measured('archive-encode',()=>encode(next)),json=prepareJson(),valueText=measured('checkpoint-live-serialization',()=>json(packet.value).sha256);
   if(!reset&&valueText===lastValue&&!packet.updates.length&&!packet.snapshotUpdates.length&&!packet.snapshotReleased.length)return;
   const encoded=measured('checkpoint-serialization',()=>json({format:checkpointId,stateVersion,build:storageBuild,producerBuild:build,mode,reset,packet})),sha256=encoded.sha256,buffers=journalBuffers(sequence+1,previous,encoded);let written=0;
   measured('disk-write-fsync',()=>{
    if(needsVersionUpgrade){const base=JSON.parse(fs.readFileSync(file,'utf8'));durableReplace(file,JSON.stringify({...base,stateVersion}));needsVersionUpgrade=false;}
    if(!fs.existsSync(file)){durableReplace(file,JSON.stringify({format:checkpointId,stateVersion,build:storageBuild,producerBuild:build,mode,sha256:digest('null'),payload:'null'}));}
    if(journalFd===null)journalFd=retryFile('open-journal',journal,()=>fs.openSync(journal,'a',0o600));
    written=appendBuffers(fs,journalFd,buffers);retryFile('fsync-journal',journal,()=>fs.fsyncSync(journalFd));
    if(!journalRequired){const saved=JSON.parse(fs.readFileSync(file,'utf8'));durableReplace(file,JSON.stringify({...saved,journal:true}));journalRequired=true;}
   });
   sequence++;previous=sha256;lastValue=valueText;reset=false;const start=end;end+=written;cacheWriter.record({sequence,previous,start,end});
   }catch(error){failed=true;throw error;}
  }};
 }catch(e){release();throw e;}
}
