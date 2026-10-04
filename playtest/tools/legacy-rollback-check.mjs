import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
import {openStore} from '../server/store.mjs';import {legacyRollback} from '../ops/legacy-rollback.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'cs-legacy-rollback-')),storeModule=fileURLToPath(new URL('../server/store.mjs',import.meta.url)),legacyModule=new URL('../server/.legacy-rollback-reader-test.mjs',import.meta.url);let checks=0;
try{
 fs.writeFileSync(legacyModule,execFileSync('git',['show','e723ec5fa57d7aea72eb07c8db5db4e75952a900:playtest/server/store.mjs']));const old=(await import(legacyModule.href)).openStore;
 for(const fault of [null,'checkpoint.before.json','checkpoint.journal.before','checkpoint.json']){
  const dir=path.join(root,'case-'+checks),id='test';let s=openStore(dir,'previous','production');s.write({local:[{token:'test',n:1}],multiplayer:new Map()});s.write({local:[{token:'test',n:2}],multiplayer:new Map([['r',{shots:2}]])});await s.cacheReady();s.release();
  fs.appendFileSync(dir+'/checkpoint.journal','{unacknowledged-torn-tail');const beforeCheckpoint=fs.readFileSync(dir+'/checkpoint.json'),beforeJournal=fs.readFileSync(dir+'/checkpoint.journal'),options={storeModule,stateDir:dir,build:'previous',id},rename=fs.renameSync;
  if(fault){let fired=false;fs.renameSync=(a,b)=>{rename(a,b);if(!fired&&path.basename(b)===fault){fired=true;throw Error('Interrupted after rename');}};try{await assert.rejects(legacyRollback(options),/Interrupted/);checks++;}finally{fs.renameSync=rename;}}
  const result=await legacyRollback(options);assert.equal(result.restored,true);assert.deepEqual(fs.readFileSync(result.evidence+'/checkpoint.before.json'),beforeCheckpoint);assert.deepEqual(fs.readFileSync(result.evidence+'/checkpoint.journal.before'),beforeJournal);checks+=3;
  s=old(dir,'previous','production');assert.deepEqual(s.value,{local:[{token:'test',n:2}],multiplayer:new Map([['r',{shots:2}]])});s.write({local:[{token:'test',n:3}],multiplayer:new Map()});s.release();checks++;
  await legacyRollback(options);s=old(dir,'previous','production');assert.equal(s.value.local[0].n,3);s.release();checks++;
 }
 console.log(JSON.stringify({passed:true,checks,legacyReaderRestoredLatestState:true,originalEvidenceUnchanged:true,renameCrashResume:true,idempotent:true}));
}finally{fs.unlinkSync(legacyModule);}
