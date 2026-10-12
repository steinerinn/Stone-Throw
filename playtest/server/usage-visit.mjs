import {Worker} from 'node:worker_threads';

export function usageVisits(file,{now=Date.now}={}){
 let worker,closed=false,failure,sequence=0;
 const pending=new Map();
 const fail=error=>{failure=error;for(const {reject} of pending.values())reject(error);pending.clear();worker?.unref();};
 return {
  visit(body,{token,browser,ip}){
   if(closed||failure)return Promise.reject(failure||Error('Registry closed.'));
   if(!worker){
    worker=new Worker(new URL('./usage-visit-worker.mjs',import.meta.url),{workerData:{file}});
    worker.on('message',({id,result,error})=>{const task=pending.get(id);if(!task)return;pending.delete(id);if(error)task.reject(Object.assign(Error(error.message),{status:error.status}));else task.resolve(result);if(!pending.size)worker.unref();});
    worker.on('error',fail);
    worker.on('exit',code=>{if(!closed||pending.size)fail(Error('Usage worker exited ('+code+').'));});
   }
   return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});worker.ref();try{worker.postMessage({id,body,token,browser,ip,at:now===Date.now?null:now()});}catch(error){pending.delete(id);reject(error);if(!pending.size)worker.unref();}});
  },
  close(){closed=true;if(worker){worker.ref();worker.postMessage({close:true});}}
 };
}
