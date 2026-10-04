import {Worker} from 'node:worker_threads';
import {metric,metricsContext,measured} from './beta-metrics.mjs';
import {checkpointStringEncoder} from './checkpoint-transfer.mjs';

// Private transfer caches only immutable saved-checkpoint strings;
// unchanged retained histories are not cloned across the thread on every save.
// JSON encoding, hashing, verification and disk work remain in the worker.
// postMessage captures the packet synchronously before write() yields. No mutable
// game object is shared with the disk worker. Success means the existing store's
// fsync/validation/publication path returned, never merely that work was queued.
export async function openAsyncStore(directory,build,mode,options={}){
 if(!directory)return null;
 const worker=new Worker(new URL('./persistence-worker.mjs',import.meta.url),{workerData:[directory,build,mode,options]});
 let serial=0,failed=null,closing=false,exited=false;const pending=new Map(),diagnostics={},encode=checkpointStringEncoder();
 const errorFrom=e=>Object.assign(Error(e.message),e);
 const fail=e=>{failed??=e;for(const p of pending.values())p.reject(failed);pending.clear();};
 let readyResolve,readyReject;
 const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
 worker.on('error',e=>{fail(e);readyReject(e);});
 worker.on('exit',code=>{exited=true;if(!closing||pending.size){const e=Error('Persistence worker stopped: '+code);fail(e);readyReject(e);}});
 worker.on('message',m=>{
  if(Object.hasOwn(m,'ready')){if(m.ready){Object.assign(diagnostics,m.diagnostics);readyResolve(m.value);}else{const e=errorFrom(m.error);fail(e);readyReject(e);}return;}
  const p=pending.get(m.id);if(!p)return;pending.delete(m.id);
  Object.assign(diagnostics,m.diagnostics);
  if(m.ok)p.resolve(m);else{const e=errorFrom(m.error);p.reject(e);fail(e);}
 });
 const value=await ready;
 function request(operation,value){
  if(operation==='write'&&(failed||closing))return Promise.reject(failed||Error('checkpoint-write-failed'));
  const id=++serial;
  return new Promise((resolve,reject)=>{
   pending.set(id,{resolve,reject});
   try{const packet=operation==='write'?measured('persistence-capture',()=>encode(value)):undefined;measured('persistence-transfer',()=>worker.postMessage({id,operation,packet,metrics:!!metricsContext.getStore()}));}catch(e){pending.delete(id);reject(e);fail(e);}
  });
 }
 return {value,diagnostics,
  async write(next){const result=await request('write',next);for(const [name,v]of Object.entries(result.metrics||{}))metric(name,v.ms,v.count);},
  async release(){if(closing)return;closing=true;try{if(!exited)await request('release');}finally{await worker.terminate();}}
 };
}
