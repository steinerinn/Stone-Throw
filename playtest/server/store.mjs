import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const digest=s=>createHash('sha256').update(s).digest('hex');
export const checkpointId='controlled-playtest-v1';
export function openStore(directory,build,mode){
 if(!directory)return null;
 const dir=path.resolve(directory),file=path.join(dir,'checkpoint.json'),lock=path.join(dir,'server.lock');
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 if(fs.existsSync(lock)){let pid;try{pid=JSON.parse(fs.readFileSync(lock,'utf8')).pid; if(!Number.isInteger(pid)||pid<=0)throw Error();}catch{throw Error('state-locked');}let alive=true;try{process.kill(pid,0);}catch(e){if(e.code==='ESRCH')alive=false;}if(alive)throw Error('state-locked');fs.unlinkSync(lock);}
 const fd=fs.openSync(lock,'wx',0o600);fs.writeFileSync(fd,JSON.stringify({pid:process.pid}));fs.closeSync(fd);
 const release=()=>{if(fs.existsSync(lock))fs.unlinkSync(lock);};
 try{
  let value=null,lastPayload=null;
  if(fs.existsSync(file)){let saved;try{saved=JSON.parse(fs.readFileSync(file,'utf8'));if(typeof saved.payload!=='string'||digest(saved.payload)!==saved.sha256)throw Error();}catch{throw Error('checkpoint-unavailable');}
   if(saved.format!==checkpointId||saved.build!==build||saved.mode!==mode)throw Error('incompatible-checkpoint');
   lastPayload=saved.payload;
   try{value=JSON.parse(saved.payload,(_,v)=>v&&v.$map?new Map(v.$map):v);}catch{throw Error('checkpoint-unavailable');}
  }
  return {value,release,write(value){const payload=JSON.stringify(value,(_,v)=>v instanceof Map?{$map:[...v]}:v),temp=file+'.tmp';if(payload===lastPayload)return;const fd=fs.openSync(temp,'w',0o600);try{fs.writeFileSync(fd,JSON.stringify({format:checkpointId,build,mode,sha256:digest(payload),payload}));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,file);lastPayload=payload;}};
 }catch(e){release();throw e;}
}
