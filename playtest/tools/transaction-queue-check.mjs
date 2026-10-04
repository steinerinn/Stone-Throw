import assert from 'node:assert/strict';
import {transactionQueue,serialDurableQueue} from '../server/transaction-queue.mjs';
const queue=transactionQueue(),events=[];
let releaseA,releaseB;
const a=queue.run(async()=>{events.push('a');await new Promise(r=>releaseA=r);events.push('a-end');},'a');
const a2=queue.run(()=>events.push('a2'),'a');
const b=queue.run(async()=>{events.push('b');await new Promise(r=>releaseB=r);events.push('b-end');},'b');
const exclusive=queue.run(()=>events.push('exclusive'));
const c=queue.run(()=>events.push('c'),'c');
await new Promise(r=>setImmediate(r));assert.deepEqual(events,['a','b']);assert.equal(queue.busy('a'),true);
releaseB();await b;await new Promise(r=>setImmediate(r));assert.deepEqual(events,['a','b','b-end']);
releaseA();await Promise.all([a,a2,exclusive,c]);await queue.idle();
assert.deepEqual(events,['a','b','b-end','a-end','a2','exclusive','c']);
assert.equal(queue.pending,0);assert.equal(queue.busy('a'),false);
await assert.rejects(queue.run(()=>{throw Error('fixture');},'a'),/fixture/);
await queue.run(()=>events.push('recovered'));await queue.idle();assert.equal(queue.pending,0);
console.log('PASS: independent room concurrency, same-room FIFO, exclusive barriers, idle and failure recovery.');

const bounded=transactionQueue(2);let running=0,peak=0;
await Promise.all(Array.from({length:8},(_,i)=>bounded.run(async()=>{running++;peak=Math.max(peak,running);await new Promise(r=>setTimeout(r,5));running--;},i)));
await bounded.idle();assert.equal(peak,2);assert.equal(bounded.pending,0);console.log('PASS: room computation concurrency bounded.');

const durable=serialDurableQueue(),order=[];
const first=durable(()=>{order.push('save-1');setImmediate(()=>order.push('io'));});
const second=durable(()=>order.push('save-2'));await Promise.all([first,second]);
assert.deepEqual(order,['save-1','io','save-2']);await assert.rejects(durable(()=>{throw Error('write-test');}));await durable(()=>order.push('save-3'));assert.equal(order.at(-1),'save-3');
console.log('PASS: serialized saves yield to I/O and recover their queue after failure.');
