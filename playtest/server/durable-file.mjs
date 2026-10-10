import fs from 'node:fs';
import asyncFs from 'node:fs/promises';
import {setTimeout as pause} from 'node:timers/promises';
import {measuredAsync} from './beta-metrics.mjs';
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

// Same atomic replacement/retry contract, without blocking the request event loop.
export async function durableReplaceAsync(file,text){
 const retry=async(operation,fn)=>{for(let attempt=0;;attempt++)try{return await fn();}catch(error){
  if(!transient.has(error.code)||attempt===4){error.persistenceOperation=operation;error.persistenceFile=path.basename(file);error.persistenceAttempts=attempt+1;throw error;}
  await pause(10*2**attempt);
 }};
 const temp=file+'.tmp';
 await retry('write-fsync',async()=>{const fd=await asyncFs.open(temp,'w',0o600);try{await fd.writeFile(text);await measuredAsync('atomic-file-fsync',()=>fd.sync());}finally{await fd.close();}});
 await retry('rename',()=>asyncFs.rename(temp,file));
}
