import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {journalArchiveEncoder} from '../server/archive-wire.mjs';
import {checkpointArchiveEncoder,checkpointArchiveDecoder} from '../server/checkpoint-archives.mjs';
import {checkpointStringEncoder,checkpointStringDecoder} from '../server/checkpoint-transfer.mjs';
import {archiveSequence,archiveValue} from '../canonical/compiled/archives.js';
import {openAsyncStore} from '../server/async-store.mjs';
import {openStore} from '../server/store.mjs';

// A large immutable retained history plus a growing live history. Compare the
// private transfer against the previous full-copy path, including journal bytes.
const makeHost=()=>({contract:'stone-throw-host-v1',state:{match:{history:[],knowledge:{}}},rng:{draws:[]},events:archiveSequence(Array.from({length:20000},(_,i)=>({event:{kind:'test',index:i,cell:{x:i%15,y:i%13},text:'retained history'}}))),history:[],initial:archiveValue({seed:17}),initialRng:archiveValue({seed:17}),pendingRoot:null});
const strings=checkpointStringEncoder(),unstrings=checkpointStringDecoder(),archives=checkpointArchiveEncoder(),unarchives=checkpointArchiveDecoder();
const oldJournal=journalArchiveEncoder(),newJournal=journalArchiveEncoder();
let value={local:[{token:'test',checkpoint:{host:makeHost()},slots:{single:{checkpoint:'retained string'.repeat(2000)}}}],multiplayer:[]};
let transferredRows=0,checks=0;
for(let i=0;i<20;i++){
 if(i===5){value.local[0].checkpoint.host.events=[...value.local[0].checkpoint.host.events,{event:{index:20000}}];}
 if(i===8){value.local[0].checkpoint.host.events=structuredClone(value.local[0].checkpoint.host.events);value.local[0].checkpoint.host.events[0].event.index=-1;}
 if(i===10)value.local[0].checkpoint.host.events.length=3;
 if(i===12)value.local.reverse();
 if(i===15)value.local=[];
 const before=structuredClone(value),packet=archives(strings(value));
 transferredRows+=packet.updates.reduce((n,u)=>n+(Array.isArray(u[1])?u[1].length:1),0);
 if(i>1&&i<5)assert.equal(packet.updates.length,0,'Unchanged histories must not cross the thread again');
 const restored=unstrings(unarchives(structuredClone(packet)));
 assert.deepEqual(restored,before);
 assert.equal(JSON.stringify(newJournal(restored)),JSON.stringify(oldJournal(before)),'Disk packets must remain byte-identical');checks+=2;
}
// Reject stale/unknown references, duplicate targets, and incomplete packets.
const fixture=()=>{const encode=checkpointArchiveEncoder(),value={host:makeHost()};encode(value);return encode(value);};
for(const corrupt of [p=>p.refs.push(p.refs[0]),p=>p.refs[0][1]=999999,p=>p.refs[0][0]=999999,p=>p.released.push(p.updates[0][0]),p=>p.updates.push(p.updates[0])]){
 const packet=structuredClone(fixture());corrupt(packet);assert.throws(()=>checkpointArchiveDecoder()(packet),/Invalid archive transfer/);checks++;
}
const releaseEncoder=checkpointArchiveEncoder(),releaseDecoder=checkpointArchiveDecoder();
const releaseValue={host:makeHost()};releaseDecoder(structuredClone(releaseEncoder(releaseValue)));releaseDecoder(structuredClone(releaseEncoder(releaseValue)));
const removed=releaseEncoder({});assert.equal(removed.released.length,3);assert.deepEqual(releaseDecoder(structuredClone(removed)),{});checks++;
// Object.freeze alone does not prove nested immutability and must not be cached.
const rawHost=makeHost();rawHost.events=Object.freeze([{nested:{n:1}}]);
const rawEncode=checkpointArchiveEncoder(),rawDecode=checkpointArchiveDecoder();
rawDecode(structuredClone(rawEncode({host:rawHost})));rawHost.events[0].nested.n=2;
assert.equal(rawDecode(structuredClone(rawEncode({host:rawHost}))).host.events[0].nested.n,2);checks++;

// Actual asynchronous saves still capture mutable fields before yielding. A
// reset/truncation, slot removal and a restarted old reader must all be exact.
const root=fs.mkdtempSync(path.join(os.tmpdir(),'cs-archive-transfer-'));
let store=await openAsyncStore(root,'candidate','production');
value={local:[{token:'test',checkpoint:{host:makeHost()},slots:{}}]};
await store.write(value);
value.local[0].checkpoint.host.events=structuredClone(value.local[0].checkpoint.host.events);
value.local[0].checkpoint.host.events[0].event.index=999;
const expected=structuredClone(value),writing=store.write(value);
value.local[0].checkpoint.host.events[0].event.index=1000;
await writing;await store.release();
const recovered=openStore(root,'previous-build','production');
try{assert.deepEqual(recovered.value,expected);checks++;}finally{recovered.release();}

const bench=incremental=>{
 const encode=checkpointStringEncoder(),decode=checkpointStringDecoder(),a=checkpointArchiveEncoder(),d=checkpointArchiveDecoder(),journal=journalArchiveEncoder();
 const value={local:[{token:'bench',checkpoint:{host:makeHost()},slots:{}}]};
 const durations=[],capture=[];
 for(let i=0;i<12;i++){
  const start=performance.now(),packet=incremental?a(encode(value)):encode(value),copied=structuredClone(packet),sent=performance.now();
  journal(decode(incremental?d(copied):copied));
  if(i){capture.push(sent-start);durations.push(performance.now()-start);}
 }
 return {meanTotalMs:durations.reduce((a,b)=>a+b)/durations.length,meanCaptureAndCloneMs:capture.reduce((a,b)=>a+b)/capture.length};
};
console.log(JSON.stringify({passed:true,checks,transferredRows,byteIdenticalJournal:true,inPlaceMutationPreserved:true,baseline:bench(false),candidate:bench(true),root}));
