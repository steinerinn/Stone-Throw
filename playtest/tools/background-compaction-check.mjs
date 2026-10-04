import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {openStore} from '../server/store.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'cs-background-compact-'));
for(const stale of [false,true]){
 const dir=path.join(root,String(stale));let store=openStore(dir,'test','production',{journalMaxBytes:256*1024});
 let value={local:[{token:'test',checkpoint:'abc'.repeat(30000)}],counter:0};store.write(value);
 value={...value,extra:'x'.repeat(50000)};store.write(value);
 if(stale){value={...value,counter:1};store.write(value);}
 await store.maintenanceReady();store.write(value);
 if(stale){assert.ok(store.diagnostics.discardedCompactions>=1);for(let n=0;n<5;n++){await new Promise(r=>setTimeout(r,10));store.write(value);await store.maintenanceReady();}assert.equal(store.diagnostics.backgroundCompactions,undefined,'Busy journal must back off after a stale preparation');await new Promise(r=>setTimeout(r,30010));store.write(value);await store.maintenanceReady();store.write(value);}
 assert.equal(store.diagnostics.backgroundCompactions,1,JSON.stringify(store.diagnostics));
 const expected=structuredClone(value);await store.cacheReady();store.release();
 // Recovery must work without the derivative cache, from the published journal.
 fs.renameSync(path.join(dir,'recovery-cache.json'),path.join(dir,'cache-evidence'));
 store=openStore(dir,'different-build','production');assert.deepEqual(store.value,expected);
 store.write({...expected,counter:2});store.release();
 store=openStore(dir,'rollback-build','production');assert.equal(store.value.counter,2);store.release();
}
console.log(JSON.stringify({passed:true,preparedPublication:true,staleCandidateRejected:true,cachelessRecovery:true,continuedWrites:true,evidence:root}));
