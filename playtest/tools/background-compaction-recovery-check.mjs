import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {openStore} from '../server/store.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'cs-background-recovery-'));
for(const phase of ['before','after']){
 const directory=path.join(root,phase),child=path.join(root,phase+'.mjs');
 fs.writeFileSync(child,`import fs from 'node:fs';import {openStore} from ${JSON.stringify(new URL('../server/store.mjs',import.meta.url).href)};
 const s=openStore(${JSON.stringify(directory)},'build','production',{journalMaxBytes:200000});
 const value={local:[{token:'player',checkpoint:'x'.repeat(110000),rng:[4,5,6],history:[1,2,3]}],round:9};
 s.write(value);s.write({...value,round:10,rng:[7,8,9],history:[1,2,3,4]});await s.maintenanceReady();
 const rename=fs.renameSync;fs.renameSync=(a,b)=>{if(String(a).includes('.compact.prepared.')){if(${JSON.stringify(phase)}==='before')process.exit(72);rename(a,b);process.exit(73);}return rename(a,b);};s.write(value);throw Error('Expected publication');`);
 let code;try{execFileSync(process.execPath,[child],{windowsHide:true});}catch(e){code=e.status;}
 assert.equal(code,phase==='before'?72:73);
 const restored=openStore(directory,'rollback-build','production');assert.equal(restored.value.round,10);assert.deepEqual(restored.value.rng,[7,8,9]);assert.deepEqual(restored.value.history,[1,2,3,4]);assert.deepEqual(restored.value.local[0].rng,[4,5,6]);restored.release();
}
// Termination of an old store's preparer must never unlink a newly opened
// store's preparation. Each store owns its own temporary candidate pathname.
const directory=path.join(root,'rapid-reopen');
const old=openStore(directory,'build','production',{journalMaxBytes:1000000});
old.write({local:[{token:'player',checkpoint:'x'.repeat(600000)}],n:0});
await old.maintenanceReady();old.release();
const current=openStore(directory,'build','production',{journalMaxBytes:4000000});
let value={local:[{token:'player',checkpoint:'x'.repeat(600000)}],n:1};current.write(value);
value={...value,extra:'y'.repeat(1000000),n:11};current.write(value);
await current.maintenanceReady();current.write(value);
assert.equal(current.diagnostics.backgroundCompactions,1);current.release();
await new Promise(resolve=>setTimeout(resolve,300));
assert.equal(fs.readdirSync(directory).filter(n=>n.includes('.compact.prepared.')).length,0);
const final=openStore(directory,'rollback-build','production');assert.equal(final.value.n,11);final.release();
console.log(JSON.stringify({passed:true,crashBeforePublication:true,crashAfterPublication:true,rapidReopenIsolation:true,temporaryFilesReaped:true,evidence:root}));
