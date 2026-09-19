import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {measured} from './beta-metrics.mjs';
import {archiveEncoder,archiveDecoder} from './archive-wire.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
export const checkpointId='controlled-playtest-v1';
export function openStore(directory,build,mode,{journalEnabled=true}={}){
 if(!directory)return null;
 const dir=path.resolve(directory),file=path.join(dir,'checkpoint.json'),journal=path.join(dir,'checkpoint.journal'),lock=path.join(dir,'server.lock');
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 if(fs.existsSync(lock)){let pid;try{pid=JSON.parse(fs.readFileSync(lock,'utf8')).pid;if(!Number.isInteger(pid)||pid<=0)throw Error();}catch{throw Error('state-locked');}let alive=true;try{process.kill(pid,0);}catch(e){if(e.code==='ESRCH')alive=false;}if(alive)throw Error('state-locked');fs.unlinkSync(lock);}
 const lockFd=fs.openSync(lock,'wx',0o600);fs.writeFileSync(lockFd,JSON.stringify({pid:process.pid}));fs.closeSync(lockFd);
 let journalFd=null,journalRequired=false;const release=()=>{if(journalFd!==null){fs.closeSync(journalFd);journalFd=null;}if(fs.existsSync(lock))fs.unlinkSync(lock);};
 try{
  let value=null,sequence=0,previous='',lastValue=null,reset=true,failed=false;const encode=archiveEncoder();let decode=archiveDecoder();
  if(fs.existsSync(file)){let saved;try{saved=JSON.parse(measured('checkpoint-disk-read',()=>fs.readFileSync(file,'utf8')));if(typeof saved.payload!=='string'||digest(saved.payload)!==saved.sha256)throw Error();}catch{throw Error('checkpoint-unavailable');}
   journalRequired=saved.journal===true;if(journalRequired&&!journalEnabled)throw Error('incompatible-checkpoint');if(journalRequired&&!fs.existsSync(journal))throw Error('checkpoint-unavailable');
   if(saved.format!==checkpointId||saved.build!==build||saved.mode!==mode)throw Error('incompatible-checkpoint');
   try{value=JSON.parse(saved.payload,(_,v)=>v&&v.$map?new Map(v.$map):v);}catch{throw Error('checkpoint-unavailable');}
  }else if(journalEnabled&&fs.existsSync(journal))throw Error('checkpoint-unavailable');
  // Temporary playtest containment: replace one full, self-contained snapshot.
  // No journal reads, append, replay, truncation or archive delta accumulation.
  if(!journalEnabled)return {value,release,write(next){if(failed)throw Error('checkpoint-write-failed');try{
   const payload=measured('checkpoint-serialization',()=>JSON.stringify(next,(_,v)=>v instanceof Map?{$map:[...v]}:v));
   const sha256=digest(payload);if(sha256===lastValue)return;
   measured('disk-write-fsync',()=>{const temp=file+'.tmp',fd=fs.openSync(temp,'w',0o600);try{fs.writeFileSync(fd,JSON.stringify({format:checkpointId,build,mode,sha256,payload}));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,file);});
   lastValue=sha256;
  }catch(error){failed=true;throw error;}}};
  if(fs.existsSync(journal)){
   const bytes=measured('checkpoint-disk-read',()=>fs.readFileSync(journal)),end=bytes.lastIndexOf(10)+1;
   try{for(const line of bytes.subarray(0,end).toString('utf8').split('\n')){if(!line)continue;const record=JSON.parse(line);if(record.sequence!==sequence+1||record.previous!==previous||typeof record.payload!=='string'||digest(record.payload)!==record.sha256)throw Error();const entry=JSON.parse(record.payload);if(entry.format!==checkpointId||entry.build!==build||entry.mode!==mode)throw Error();if(entry.reset)decode=archiveDecoder();value=decode(entry.packet);sequence=record.sequence;previous=record.sha256;}}catch{throw Error('checkpoint-unavailable');}
   // A non-terminated last record cannot have been acknowledged (fsync follows the newline).
   // Retain every complete verified commit, and discard only a torn trailing write.
   if(journalRequired&&sequence===0)throw Error('checkpoint-unavailable');
   if(end<bytes.length){const fd=fs.openSync(journal,'r+');try{fs.ftruncateSync(fd,end);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
  }
  return {value,release,write(next){if(failed)throw Error('checkpoint-write-failed');try{
   const packet=measured('archive-encode',()=>encode(next)),valueText=measured('checkpoint-live-serialization',()=>JSON.stringify(packet.value));
   if(!reset&&valueText===lastValue&&!packet.updates.length)return;
   const payload=measured('checkpoint-serialization',()=>JSON.stringify({format:checkpointId,build,mode,reset,packet})),sha256=digest(payload),line=JSON.stringify({sequence:sequence+1,previous,sha256,payload})+'\n';
   measured('disk-write-fsync',()=>{
    if(!fs.existsSync(file)){const temp=file+'.tmp',fd=fs.openSync(temp,'w',0o600);try{fs.writeFileSync(fd,JSON.stringify({format:checkpointId,build,mode,sha256:digest('null'),payload:'null'}));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,file);}
    if(journalFd===null)journalFd=fs.openSync(journal,'a',0o600);
    fs.writeFileSync(journalFd,line);fs.fsyncSync(journalFd);
    if(!journalRequired){const saved=JSON.parse(fs.readFileSync(file,'utf8')),temp=file+'.tmp',fd=fs.openSync(temp,'w',0o600);try{fs.writeFileSync(fd,JSON.stringify({...saved,journal:true}));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,file);journalRequired=true;}
   });
   sequence++;previous=sha256;lastValue=valueText;reset=false;
   }catch(error){failed=true;throw error;}
  }};
 }catch(e){release();throw e;}
}
