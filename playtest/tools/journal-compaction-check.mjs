import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';
import {openStore} from '../server/store.mjs';import {compactJournal} from '../server/compact-journal.mjs';import {journalArchiveEncoder} from '../server/archive-wire.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'cs-journal-bound-'));let checks=0;
let value={local:Array.from({length:50},(_,i)=>({token:'seat-'+i,checkpoint:'retained history '.repeat(1000),round:0,slots:{}})),multiplayer:{round:0}};
const dir=root+'/load';let store=openStore(dir,'build','production',{journalMaxBytes:64*1024}),peak=0,maxWriteMs=0;
for(let n=0;n<500;n++){
 value={...value,local:value.local.map((r,i)=>i===n%50?{...r,round:r.round+1}:r),multiplayer:{round:n}};
 const start=performance.now();store.write(value);maxWriteMs=Math.max(maxWriteMs,performance.now()-start);peak=Math.max(peak,fs.statSync(dir+'/checkpoint.journal').size);
}
assert.ok(store.diagnostics.compactions>=2);assert.ok(peak<5*1024*1024);checks+=2;
store.write({...value,optional:undefined});checks++;
const diagnostics={...store.diagnostics};await store.cacheReady();const cached=fs.readFileSync(dir+'/recovery-cache.json');store.release();
store=openStore(dir,'other-build','production');assert.deepEqual(store.value,value);store.release();checks++;
// A stale cache after atomic replacement must fall back to the small journal.
store=openStore(dir,'build','production',{journalMaxBytes:1024});value={...value,another:true};store.write(value);await store.cacheReady();store.release();fs.writeFileSync(dir+'/recovery-cache.json',cached);
store=openStore(dir,'build','production');assert.deepEqual(store.value,value);assert.equal(store.diagnostics.cacheUsed,false);store.release();checks+=2;
// The production v2 reader can also restore a compacted journal (normal rollback).
const priorFile=new URL('../server/.v2-reader-compaction-check.mjs',import.meta.url);
try{fs.writeFileSync(priorFile,execFileSync('git',['show','2d4f46ed7027291aee9ddd7e7a34d7e056b73251:playtest/server/store.mjs']));const {openStore:prior}=await import(priorFile.href);const old=prior(dir,'rollback-build','production');assert.deepEqual(old.value,value);old.release();checks++;}finally{fs.unlinkSync(priorFile);}
// Missing cache and torn, unacknowledged tail after a compact journal.
fs.renameSync(dir+'/recovery-cache.json',dir+'/old-cache-evidence');fs.appendFileSync(dir+'/checkpoint.journal','{"torn":');store=openStore(dir,'build','production');assert.deepEqual(store.value,value);store.release();checks++;
// Refuse publication when the replacement does not reconstruct the expected state.
const before=fs.readFileSync(dir+'/checkpoint.journal'),encoder=journalArchiveEncoder();encoder(value);
assert.throws(()=>compactJournal(dir+'/checkpoint.journal',{format:'controlled-playtest-v1',stateVersion:'chainsiege-state-v2',build:'build',mode:'production',reset:true,packet:encoder.checkpoint()},{wrong:true},()=>{}),/recovery mismatch/);assert.deepEqual(fs.readFileSync(dir+'/checkpoint.journal'),before);checks+=2;
// Process interruption immediately before/after the atomic publish keeps the
// latest durable action recoverable; no valid state is replaced by an empty file.
for(const phase of ['before','after']){
 const child=path.join(root,'crash-'+phase+'.mjs'),state=path.join(root,phase);
 fs.writeFileSync(child,`import fs from 'node:fs';import {openStore} from ${JSON.stringify(new URL('../server/store.mjs',import.meta.url).href)};
const s=openStore(${JSON.stringify(state)},'build','production',{journalMaxBytes:1024});
const rename=fs.renameSync;fs.renameSync=(a,b)=>{if(String(a).endsWith('.compact.tmp')){if(${JSON.stringify(phase)}==='before')process.exit(72);rename(a,b);process.exit(73);}return rename(a,b);};
s.write({local:[{token:'active',checkpoint:'x'.repeat(4000),rng:[4,5,6],history:[1,2,3]}],round:9});`);
 let code;try{execFileSync(process.execPath,[child]);}catch(e){code=e.status;}assert.equal(code,phase==='before'?72:73);
 const restored=openStore(state,'build','production');assert.equal(restored.value.round,9);assert.deepEqual(restored.value.local[0].rng,[4,5,6]);assert.deepEqual(restored.value.local[0].history,[1,2,3]);restored.release();checks+=4;
}
console.log(JSON.stringify({passed:true,checks,simulatedActiveSessions:50,writes:500,peakJournalBytes:peak,maxWriteMs:Math.round(maxWriteMs),...diagnostics,evidence:root}));
