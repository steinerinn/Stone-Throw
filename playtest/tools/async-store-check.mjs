import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {openAsyncStore} from '../server/async-store.mjs';
import {openStore} from '../server/store.mjs';
import {journalRecords} from '../server/journal-reader.mjs';
import {archiveDecoder} from '../server/archive-wire.mjs';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-async-store-'));let checks=0;
const state=dir+'/ordered';let store=await openAsyncStore(state,'test','production');
try{
 await assert.rejects(openAsyncStore(state,'test','production'),/state-locked/);checks++;
 const jobs=[];
 for(let n=0;n<16;n++){const next={n,nested:{value:n},map:new Map([['key',n]])};jobs.push(store.write(next));next.nested.value=-1;}
 await Promise.all(jobs);
 let sequence=0,previous='',decode=archiveDecoder();
 for(const row of journalRecords(state+'/checkpoint.journal')){
  const r=JSON.parse(row.line);assert.equal(r.sequence,++sequence);assert.equal(r.previous,previous);
  assert.equal(createHash('sha256').update(r.payload).digest('hex'),r.sha256);previous=r.sha256;
  const value=decode(JSON.parse(r.payload).packet);assert.equal(value.n,sequence-1);assert.equal(value.nested.value,value.n);assert.equal(value.map.get('key'),value.n);
 }
 assert.equal(sequence,16);checks+=7;
}finally{await store.release();}
let recovered=openStore(state,'different-build','production');assert.equal(recovered.value.n,15);recovered.release();checks++;
await assert.rejects(store.write({n:17}),/checkpoint-write-failed/);checks++;

// Force real I/O failure in the worker, not a main-thread fs monkey patch.
const failedDir=dir+'/failure';store=await openAsyncStore(failedDir,'test','production',{journalEnabled:false});
await store.write({valid:1});fs.mkdirSync(failedDir+'/checkpoint.json.tmp');
await assert.rejects(store.write({valid:2}));await assert.rejects(store.write({valid:3}));checks+=2;
await store.release();recovered=openStore(failedDir,'test','production',{journalEnabled:false});assert.deepEqual(recovered.value,{valid:1});recovered.release();checks++;

const compactDir=dir+'/compact';store=await openAsyncStore(compactDir,'test','production',{journalMaxBytes:1024});
const value={local:[],rows:Array.from({length:1024},(_,i)=>({i,text:'unchanged format'}))};
await store.write(value);assert.ok(store.diagnostics.compactions>=1);checks++;
await store.release();recovered=openStore(compactDir,'older-build','production');assert.deepEqual(recovered.value,value);recovered.release();checks++;
// The private transfer cache must not hide in-place slot edits or replacements.
const localDir=dir+'/local-transfer';store=await openAsyncStore(localDir,'test','production');
const local={local:[{token:'a',checkpoint:'retained history',slots:{single:{checkpoint:'retained history',label:'old'}}}]};
await store.write(local);await store.write(local);
local.local[0].slots.single.label='changed';await store.write(local);
local.local[0].checkpoint='replacement';await store.write(local);
delete local.local[0].slots.single.label;await store.write(local);
await store.release();recovered=openStore(localDir,'previous-build','production');assert.deepEqual(recovered.value,local);recovered.release();checks++;
console.log(JSON.stringify({passed:true,checks,ordered:true,capturedBeforeYield:true,durableBeforeResolve:true,existingReaderCompatible:true,failureSticky:true,dir}));
