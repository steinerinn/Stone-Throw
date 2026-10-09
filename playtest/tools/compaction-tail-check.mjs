import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {openStore} from '../server/store.mjs';
import {journalRecords} from '../server/journal-reader.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'cs-compact-tail-'));let checks=0;
async function setup(name){
 const dir=path.join(root,name),store=openStore(dir,'original','production',{journalMaxBytes:1000000});
 const retained={token:'retained',checkpoint:'x'.repeat(510000)};
 let value={local:[retained,{token:'changing',checkpoint:'before'}],rng:[1,2],history:['first']};
 store.write(value);
 value={...value,local:[retained,{token:'changing',checkpoint:'after'},{token:'new',checkpoint:'new'}],rng:[3,4],history:['first','second']};store.write(value);
 value={...value,local:[retained,{token:'new',checkpoint:'newer'}],rng:[5,6],history:['first','second','third']};store.write(value);
 await store.maintenanceReady();return {dir,store,value};
}
{
 const {dir,store,value}=await setup('roundtrip');
 store.write(value);assert.equal(store.diagnostics.backgroundCompactions,1);assert.equal(store.diagnostics.carriedCompactionRecords,2);checks+=2;
 await store.cacheReady();store.release();fs.renameSync(path.join(dir,'recovery-cache.json'),path.join(dir,'cache-evidence'));
 const recovered=openStore(dir,'rollback','production');assert.deepEqual(recovered.value,value);recovered.release();checks++;
}
// The carried tail includes real archive deltas: append, replacement and pruning,
// not only scalar metadata or checkpoint strings.
{
 const dir=path.join(root,'archive-tail');let store=openStore(dir,'original','production',{journalMaxBytes:1000000});
 const host={contract:'stone-throw-host-v1',state:{match:{history:[],knowledge:{}}},rng:{draws:[{value:1}]},events:[{value:{n:1}}],history:[],initial:{},initialRng:{},pendingRoot:null};
 const value={local:[{token:'retained',checkpoint:'x'.repeat(510000)}],host};store.write(value);
 host.events.push({value:{n:2}});host.rng.draws.push({value:2});store.write(value);
 host.events[0].value.n=99;host.events.length=1;host.history.push({command:'next'});store.write(value);
 await store.maintenanceReady();store.write(value);assert.equal(store.diagnostics.carriedCompactionRecords,2);checks++;
 await store.cacheReady();store.release();fs.renameSync(path.join(dir,'recovery-cache.json'),path.join(dir,'cache-evidence'));
 store=openStore(dir,'rollback','production');assert.deepEqual(store.value,value);checks++;store.release();
}
for(const fault of ['source-truncated','source-payload','source-sequence','candidate-truncated','candidate-readback']){
 const {dir,store}=await setup(fault),journal=path.join(dir,'checkpoint.journal'),candidate=path.join(dir,fs.readdirSync(dir).find(n=>n.includes('.compact.prepared.')));
 if(fault==='source-truncated')fs.truncateSync(journal,fs.statSync(journal).size-1);
 if(fault==='source-payload'||fault==='source-sequence'){
  const records=[...journalRecords(journal)],last=records.at(-1),text=fs.readFileSync(journal);
  let line=last.line;if(fault==='source-payload')line=line.replace('newer','XXXXX');else line=line.replace('"sequence":3','"sequence":9');
  assert.notEqual(line,last.line);assert.equal(Buffer.byteLength(line),Buffer.byteLength(last.line));
  fs.writeFileSync(journal,Buffer.concat([text.subarray(0,last.start),Buffer.from(line+'\n')]));
 }
 if(fault==='candidate-truncated')fs.truncateSync(candidate,fs.statSync(candidate).size-1);
 const source=fs.readFileSync(journal),originalWrite=fs.writevSync;
 if(fault==='candidate-readback')fs.writevSync=(fd,buffers,...rest)=>{const changed=buffers.map(b=>Buffer.from(b));const b=changed.find(b=>b.includes(Buffer.from('"sequence":2')));if(b){const offset=b.indexOf(Buffer.from('"sequence":2'));b[offset+11]=57;}return originalWrite(fd,changed,...rest);};
 try{assert.throws(()=>store.write({ignored:true}),/Compact/);assert.deepEqual(fs.readFileSync(journal),source);checks+=2;}finally{fs.writevSync=originalWrite;store.release();}
}
console.log(JSON.stringify({passed:true,checks,tailSnapshotsAddedChangedReleased:true,rngHistoryPreserved:true,cachelessRollbackRecovery:true,corruptionRejectedWithoutPublication:true,evidence:root}));
