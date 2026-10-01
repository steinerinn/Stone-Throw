// Derivative restart cache only. The append-only fsynced journal stays authoritative.
import {parentPort} from 'node:worker_threads';
import {createHash} from 'node:crypto';
import {durableReplace} from './durable-file.mjs';
parentPort.on('message',({file,cache})=>{
 try{const payload=JSON.stringify(cache),sha256=createHash('sha256').update(payload).digest('hex');durableReplace(file,JSON.stringify({sha256,payload}));parentPort.postMessage({ok:true});}
 catch{parentPort.postMessage({ok:false});}
});
