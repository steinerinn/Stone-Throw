import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {openStore} from '../server/store.mjs';import {journalRecords} from '../server/journal-reader.mjs';import {archiveEncoder,archiveDecoder} from '../server/archive-wire.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'cs-state-version-')),hash=s=>createHash('sha256').update(s).digest('hex');let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const dir=root+'/state';let s=openStore(dir,'build-A','production');
const host=n=>({contract:'stone-throw-host-v1',state:{match:{history:Array.from({length:n},(_,i)=>({i})),knowledge:{}}},rng:{draws:Array.from({length:n},(_,i)=>i)},events:[{n}],history:[{n}],initial:{seed:1},initialRng:{seed:1},pendingRoot:null});
let value={host:host(3),seats:new Map([['a',{shots:2,round:8}]])};s.write(value);await s.cacheReady();s.release();
const checkpoint=fs.readFileSync(dir+'/checkpoint.json'),journal=fs.readFileSync(dir+'/checkpoint.journal');
s=openStore(dir,'build-B','production');eq(s.value,value);eq(s.diagnostics.cacheUsed,true);eq(s.diagnostics.replayedRecords,0);eq(fs.readFileSync(dir+'/checkpoint.json'),checkpoint);eq(fs.readFileSync(dir+'/checkpoint.journal'),journal);
value={...value,host:host(8)};s.write(value);await s.cacheReady();s.release();
s=openStore(dir,'build-A','production');eq(s.value,value);s.release();
// A v1-only reader must refuse v2 state, rather than silently losing references.
const legacyPath=new URL('../server/.legacy-store-check.mjs',import.meta.url);
try{let legacy=execFileSync('git',['show','1acceeee77ad4c3d4db8bb719fa5cbc86d7cce80:playtest/server/store.mjs'],{encoding:'utf8'});legacy=legacy.replace("import {stateVersion} from './persistence-contract.mjs';","const stateVersion='chainsiege-state-v1';");fs.writeFileSync(legacyPath,legacy);const {openStore:old}=await import(legacyPath.href);assert.throws(()=>old(dir,'build-A','production'),/incompatible/);checks++;}finally{fs.unlinkSync(legacyPath);}
// Cache plus archive deltas, replacements, removals and reset packets.
const enc=archiveEncoder({prune:true}),dec=archiveDecoder();enc({host:host(4)});eq(dec(enc.checkpoint()),{host:host(4)});eq(dec(enc({host:host(7)})),{host:host(7)});eq(dec(enc({host:host(2)})),{host:host(2)});eq(dec(enc({gone:true})),{gone:true});
const cached=fs.readFileSync(dir+'/recovery-cache.json');s=openStore(dir,'C','production');value={host:host(10)};s.write(value);s.release();fs.writeFileSync(dir+'/recovery-cache.json',cached);s=openStore(dir,'D','production');eq(s.value,value);eq(s.diagnostics.replayedRecords,1);s.release();
fs.writeFileSync(dir+'/recovery-cache.json','broken');s=openStore(dir,'D','production');eq(s.value,value);eq(s.diagnostics.cacheUsed,false);eq(s.diagnostics.replayedRecords,3);s.release();
fs.writeFileSync(dir+'/recovery-cache.json',cached);fs.appendFileSync(dir+'/checkpoint.journal','{"torn":');s=openStore(dir,'D','production');eq(s.value,value);s.release();eq(fs.readFileSync(dir+'/checkpoint.journal','utf8').endsWith('\n'),true);
// A valid checksum cannot bypass an incompatible explicit schema version.
const saved=JSON.parse(fs.readFileSync(dir+'/checkpoint.json'));fs.writeFileSync(dir+'/checkpoint.json',JSON.stringify({...saved,stateVersion:'future'}));assert.throws(()=>openStore(dir,'D','production'),/incompatible/);checks++;fs.writeFileSync(dir+'/checkpoint.json',JSON.stringify(saved));
const lines=[...journalRecords(dir+'/checkpoint.journal')];const last=JSON.parse(lines.at(-1).line);last.payload+='x';fs.writeFileSync(dir+'/checkpoint.journal',lines.slice(0,-1).map(r=>r.line+'\n').join('')+JSON.stringify(last)+'\n');assert.throws(()=>openStore(dir,'D','production'),/unavailable/);checks++;
// Over 512MiB total (V8 string ceiling), bounded per-record Unicode reads.
const large=root+'/large.journal',fd=fs.openSync(large,'w'),row=JSON.stringify({text:'í'.repeat(32768)})+'\n';for(let i=0;i<8200;i++)fs.writeSync(fd,row);fs.closeSync(fd);let count=0;for(const record of journalRecords(large)){assert.equal(JSON.parse(record.line).text.length,32768);count++;}eq(count,8200);fs.unlinkSync(large);
// Snapshot mode remains cross-build compatible without touching a journal.
s=openStore(root+'/snapshot','A','production',{journalEnabled:false});s.write({x:1});s.release();s=openStore(root+'/snapshot','B','production',{journalEnabled:false});eq(s.value,{x:1});s.release();
console.log(JSON.stringify({passed:true,checks,largeJournalBytes:Buffer.byteLength(row)*8200,legacyReaderFailsSafely:true,cacheAndTail:true,evidence:root}));
