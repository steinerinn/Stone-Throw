import {parentPort,workerData} from 'node:worker_threads';
import {openStore} from './store.mjs';
import {metricsContext,measured} from './beta-metrics.mjs';
import {checkpointStringDecoder} from './checkpoint-transfer.mjs';

// This thread alone owns the journal, its lock, codec and compaction boundary.
// The on-disk store and validation are identical to the synchronous reader.
let store,failed=false;const decode=checkpointStringDecoder();
const failure=e=>({message:e.message,code:e.code,persistenceOperation:e.persistenceOperation,persistenceFile:e.persistenceFile,persistenceAttempts:e.persistenceAttempts});
try {
 store=openStore(...workerData);
 parentPort.postMessage({ready:true,value:store.value,diagnostics:store.diagnostics});
 // Recovery has been copied to the owner; do not retain a second startup graph.
 store.value=null;
} catch(e) { parentPort.postMessage({ready:false,error:failure(e)});parentPort.close(); }
if(store){
 let tail=Promise.resolve();
 parentPort.on('message',message=>{
  tail=tail.then(async()=>{
   const metrics=message.metrics?{}:undefined;
   try {
    if(message.operation==='write'){if(failed)throw Error('checkpoint-write-failed');metricsContext.run(metrics,()=>{const value=measured('persistence-decode',()=>decode(message.packet));measured('persistence-write-worker',()=>store.write(value));});}
    else if(message.operation==='release')store.release();
    else throw Error('Invalid persistence operation');
    parentPort.postMessage({id:message.id,ok:true,diagnostics:store.diagnostics,metrics});
   }catch(e){failed=true;parentPort.postMessage({id:message.id,ok:false,error:failure(e)});}
   if(message.operation==='release')parentPort.close();
  });
 });
}
