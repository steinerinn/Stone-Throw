import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {openStore} from '../server/store.mjs';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'cs-async-crash-'));
const adapter=new URL('../server/async-store.mjs',import.meta.url).href;
// Fault injection lives solely in a child preload, inherited by its disk worker.
// Kill the entire isolated process at the real publication boundary.
const preload=path.join(root,'fault.mjs');
fs.writeFileSync(preload,`import fs from 'node:fs';import {isMainThread} from 'node:worker_threads';
if(!isMainThread){const rename=fs.renameSync;fs.renameSync=(a,b)=>{
 if(String(a).endsWith('.compact.tmp')&&fs.existsSync(process.env.CS_TEST_ARM)){
  if(process.env.CS_TEST_PHASE==='before'){process.kill(process.pid,'SIGKILL');}
  const result=rename(a,b);process.kill(process.pid,'SIGKILL');return result;
 }return rename(a,b);
};}`);
for(const phase of ['before','after','acknowledged']){
 const directory=path.join(root,phase),arm=path.join(root,phase+'.armed'),child=path.join(root,phase+'.mjs');
 fs.writeFileSync(child,`import fs from 'node:fs';import {openAsyncStore} from ${JSON.stringify(adapter)};
 const store=await openAsyncStore(${JSON.stringify(directory)},'current-build','production',{journalMaxBytes:1024,backgroundCompaction:false});
 await store.write({n:1,local:[],rng:[1,2,3],history:['acknowledged']});
 fs.writeFileSync(${JSON.stringify(arm)},'armed');
 await store.write({n:2,local:[],rng:[4,5,6],history:['acknowledged','next'],payload:'x'.repeat(5000)});
 fs.writeFileSync(${JSON.stringify(arm+'.ack')},'durable');
 process.kill(process.pid,'SIGKILL');`);
 const result=spawnSync(process.execPath,['--import',pathToFileURL(preload).href,child],{windowsHide:true,timeout:30000,env:{...process.env,CS_TEST_ARM:phase==='acknowledged'?arm+'.unused':arm,CS_TEST_PHASE:phase},encoding:'utf8'});
 assert.notEqual(result.status,0);assert.equal(result.error,undefined,result.error?.message);
 assert.equal(fs.existsSync(arm+'.ack'),phase==='acknowledged');
 const restored=openStore(directory,'previous-build','production');
 // Append was already fsynced before compaction in both interrupted cases.
 assert.deepEqual(restored.value,{n:2,local:[],rng:[4,5,6],history:['acknowledged','next'],payload:'x'.repeat(5000)});
 restored.release();
}
console.log(JSON.stringify({passed:true,crashBeforePublication:true,crashAfterPublication:true,acknowledgedWriteSurvivesProcessDeath:true,rollbackReader:true,evidence:root}));
