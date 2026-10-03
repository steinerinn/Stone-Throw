import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {journalArchiveEncoder,archiveDecoder,archiveEncoder} from '../server/archive-wire.mjs';
import {openStore} from '../server/store.mjs';import {stateVersion} from '../server/persistence-contract.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'cs-session-journal-'));let checks=0;
const enc=journalArchiveEncoder(),dec=archiveDecoder();
let value={local:Array.from({length:122},(_,i)=>({token:'session-'+i,checkpoint:JSON.stringify({history:'saved history '.repeat(5000),rng:[i,3,2],round:2}),slots:{},configuration:{size:15}})),multiplayer:{round:1}};
const first=enc(value);assert.deepEqual(dec(first),value);checks++;
for(let i=0;i<20;i++){value={...value,multiplayer:{round:i+2}};const packet=enc(value);assert.equal(packet.snapshotUpdates.length,0);assert.deepEqual(dec(packet),value);assert.ok(JSON.stringify(packet).length<10000);checks+=3;}
value={...value,local:value.local.map((r,i)=>i===3?{...r,checkpoint:'changed RNG/history'}:r)};const changed=enc(value);assert.equal(changed.snapshotUpdates.length,1);assert.deepEqual(dec(changed),value);checks+=2;
value={...value,local:value.local.slice(2).reverse()};const removed=enc(value);assert.equal(removed.snapshotUpdates.length,0);assert.equal(removed.snapshotReleased.length,2);assert.deepEqual(dec(removed),value);assert.deepEqual(archiveDecoder()(enc.checkpoint()),value);checks+=4;
assert.throws(()=>archiveDecoder()({...enc.checkpoint(),snapshotUpdates:[]}),/Missing session/);checks++;
// Mutation of a decoded object cannot contaminate the next reconstruction.
const restored=dec(enc(value));restored.local[0].configuration.size=99;assert.deepEqual(dec(enc(value)),value);checks++;
// Store skips identical writes, persists local-only changes, restores via cache and full journal.
let store=openStore(root+'/new','A','production');store.write(value);await store.cacheReady();const before=fs.statSync(root+'/new/checkpoint.journal').size;store.write(value);assert.equal(fs.statSync(root+'/new/checkpoint.journal').size,before);checks++;
value={...value,local:value.local.map((r,i)=>i===1?{...r,checkpoint:'only local changed'}:r)};store.write(value);await store.cacheReady();store.release();store=openStore(root+'/new','B','production');assert.deepEqual(store.value,value);store.release();checks++;
fs.renameSync(root+'/new/recovery-cache.json',root+'/new/saved-cache.json');store=openStore(root+'/new','B','production');assert.deepEqual(store.value,value);store.release();checks++;
// Existing v1 data is read unchanged. The first new write explicitly guards old readers.
const legacy=root+'/legacy';fs.mkdirSync(legacy);const payload=JSON.stringify(value),sha256=createHash('sha256').update(payload).digest('hex');fs.writeFileSync(legacy+'/checkpoint.json',JSON.stringify({format:'controlled-playtest-v1',stateVersion:'chainsiege-state-v1',build:'old',mode:'production',payload,sha256}));
store=openStore(legacy,'new','production');assert.deepEqual(store.value,value);assert.equal(JSON.parse(fs.readFileSync(legacy+'/checkpoint.json')).stateVersion,'chainsiege-state-v1');store.write(value);await store.cacheReady();store.release();assert.equal(JSON.parse(fs.readFileSync(legacy+'/checkpoint.json')).stateVersion,stateVersion);store=openStore(legacy,'new','production');assert.deepEqual(store.value,value);store.release();checks+=4;
// v1 cache permits an in-place append transition without replaying the old journal.
const cachedDir=root+'/v1-cached';fs.mkdirSync(cachedDir);const legacyEncoder=archiveEncoder({prune:true}),legacyPacket=legacyEncoder(value),hash=x=>createHash('sha256').update(x).digest('hex');
const entry=JSON.stringify({format:'controlled-playtest-v1',stateVersion:'chainsiege-state-v1',build:'old',mode:'production',reset:true,packet:legacyPacket});
const line=JSON.stringify({sequence:1,previous:'',sha256:hash(entry),payload:entry})+'\n';fs.writeFileSync(cachedDir+'/checkpoint.journal',line);
fs.writeFileSync(cachedDir+'/checkpoint.json',JSON.stringify({format:'controlled-playtest-v1',stateVersion:'chainsiege-state-v1',build:'old',mode:'production',journal:true,payload:'null',sha256:hash('null')}));
const stat=fs.statSync(cachedDir+'/checkpoint.journal'),cache=JSON.stringify({format:'chainsiege-recovery-cache-v1',stateVersion:'chainsiege-state-v1',mode:'production',journal:{dev:stat.dev,ino:stat.ino},sequence:1,previous:hash(entry),start:0,end:Buffer.byteLength(line),packet:legacyEncoder.checkpoint()});fs.writeFileSync(cachedDir+'/recovery-cache.json',JSON.stringify({payload:cache,sha256:hash(cache)}));
store=openStore(cachedDir,'new','production');assert.deepEqual(store.value,value);assert.equal(store.diagnostics.cacheUsed,true);assert.equal(store.diagnostics.replayedBytes,0);store.write(value);await store.cacheReady();store.release();
store=openStore(cachedDir,'new','production');assert.deepEqual(store.value,value);assert.equal(store.diagnostics.cacheUsed,true);store.release();checks+=5;
console.log(JSON.stringify({passed:true,checks,retainedSessions:122,firstPacketBytes:Buffer.byteLength(JSON.stringify(first)),subsequentPacketBytes:Buffer.byteLength(JSON.stringify(enc(value))),evidence:root}));
