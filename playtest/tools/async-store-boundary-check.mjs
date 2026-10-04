import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {fork} from 'node:child_process';
import {openStore} from '../server/store.mjs';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'cs-async-boundary-'));
const preload=path.join(root,'hold.mjs'),childFile=path.join(root,'child.mjs');
fs.writeFileSync(preload,`import fs from 'node:fs';import {isMainThread} from 'node:worker_threads';
if(!isMainThread){const sync=fs.fsyncSync;let held=false;fs.fsyncSync=fd=>{const out=sync(fd);
 if(!held){held=true;fs.writeFileSync(process.env.CS_HOLD_ROOT+'/entered','');
 const sleeper=new Int32Array(new SharedArrayBuffer(4)),until=Date.now()+15000;
 while(!fs.existsSync(process.env.CS_HOLD_ROOT+'/release')){if(Date.now()>until)throw Error('Test hold expired');Atomics.wait(sleeper,0,0,10);}}
 return out;};}`);
fs.writeFileSync(childFile,`import {openAsyncStore} from ${JSON.stringify(new URL('../server/async-store.mjs',import.meta.url).href)};
const store=await openAsyncStore(process.env.CS_HOLD_ROOT+'/state','test','production');
let ticks=0;const timer=setInterval(()=>process.send({tick:++ticks}),20);
const value={value:1,private:{rng:[7,8,9]}};const saving=store.write(value);value.private.rng.push(10);
await saving;process.send({ack:true});process.on('message',async()=>{clearInterval(timer);await store.release();process.disconnect();});`);
const child=fork(childFile,[],{windowsHide:true,execArgv:['--import',pathToFileURL(preload).href],env:{...process.env,CS_HOLD_ROOT:root},stdio:['ignore','ignore','inherit','ipc']});
let ticks=0,acked=false,exited=false;child.on('message',m=>{if(m.tick)ticks=m.tick;if(m.ack)acked=true;});child.on('exit',()=>{exited=true;});
const wait=async predicate=>{const until=Date.now()+15000;while(!predicate()){if(exited||Date.now()>until)throw Error('Child did not reach expected boundary');await new Promise(r=>setTimeout(r,10));}};
try{
 await wait(()=>fs.existsSync(root+'/entered'));const before=ticks;
 await new Promise(r=>setTimeout(r,250));assert.ok(ticks>=before+3,'Request thread must keep processing while disk worker is blocked');assert.equal(acked,false,'No acknowledgement while durable store operation is incomplete');
 fs.writeFileSync(root+'/release','');await wait(()=>acked);child.send('close');await new Promise(resolve=>child.once('exit',resolve));
 const restored=openStore(root+'/state','previous-build','production');assert.deepEqual(restored.value,{value:1,private:{rng:[7,8,9]}});restored.release();
 console.log(JSON.stringify({passed:true,requestThreadResponsive:true,noPrematureAcknowledgement:true,snapshotCapturedBeforeYield:true,evidence:root}));
}finally{if(!exited)child.kill();}
