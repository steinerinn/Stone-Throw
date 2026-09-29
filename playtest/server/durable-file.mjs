import fs from 'node:fs';
import path from 'node:path';
const transient=new Set(['EPERM','EACCES','EBUSY','EAGAIN','EMFILE','ENFILE']);
const sleeper=new Int32Array(new SharedArrayBuffer(4));
// Existing stores are synchronous. Bound extra blocking to 150ms per operation.
// Retry only idempotent operations; never blindly repeat an append.
export function retryFile(operation,file,fn){
 for(let attempt=0;;attempt++)try{return fn();}catch(error){
  if(!transient.has(error.code)||attempt===4){error.persistenceOperation=operation;error.persistenceFile=path.basename(file);error.persistenceAttempts=attempt+1;throw error;}
  Atomics.wait(sleeper,0,0,10*2**attempt);
 }
}
export function durableReplace(file,text){
 const temp=file+'.tmp';
 // A failed temporary write can safely restart from byte zero. The published
 // file remains intact until a completely written, fsynced replacement exists.
 retryFile('write-fsync',file,()=>{const fd=fs.openSync(temp,'w',0o600);try{fs.writeFileSync(fd,text);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}});
 retryFile('rename',file,()=>fs.renameSync(temp,file));
}
export function persistenceDetails(error){return {reason:error.code||error.message,operation:error.persistenceOperation||error.syscall||'unknown',file:error.persistenceFile||(error.path?path.basename(error.path):undefined),attempts:error.persistenceAttempts||1};}
