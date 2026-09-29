import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {durableReplace} from '../server/durable-file.mjs';import {openStore} from '../server/store.mjs';import {coldRoomStore} from '../server/cold-rooms.mjs';import {startServer} from '../server/main.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-durable-fault-'));let checks=0;
const failure=code=>Object.assign(new Error('injected '+code),{code});
const rename=fs.renameSync,fsync=fs.fsyncSync,write=fs.writeFileSync;
try{
 const file=path.join(dir,'atomic.json');durableReplace(file,'old');let tries=0;
 fs.renameSync=(a,b)=>{if(b===file&&++tries<=2)throw failure('EPERM');return rename(a,b);};durableReplace(file,'new');assert.equal(tries,3);assert.equal(fs.readFileSync(file,'utf8'),'new');checks+=2;fs.renameSync=rename;
 let syncs=0;fs.fsyncSync=fd=>{if(++syncs===1)throw failure('EBUSY');return fsync(fd);};durableReplace(file,'synced');assert.equal(syncs,2);assert.equal(fs.readFileSync(file,'utf8'),'synced');checks+=2;fs.fsyncSync=fsync;
 fs.renameSync=(a,b)=>{if(b===file)throw failure('EACCES');return rename(a,b);};assert.throws(()=>durableReplace(file,'blocked'),e=>e.persistenceOperation==='rename'&&e.persistenceAttempts===5);assert.equal(fs.readFileSync(file,'utf8'),'synced');checks+=2;fs.renameSync=rename;
 let writes=0;fs.writeFileSync=(...a)=>{writes++;throw failure('ENOSPC');};assert.throws(()=>durableReplace(file,'full'),e=>e.code==='ENOSPC'&&e.persistenceAttempts===1);assert.equal(writes,1);checks+=2;fs.writeFileSync=write;
 for(const journalEnabled of [false,true]){const state=path.join(dir,'store-'+journalEnabled);let store=openStore(state,'test','production',{journalEnabled}),faults=0;fs.renameSync=(a,b)=>{if(b.endsWith('checkpoint.json')&&faults++<2)throw failure('EPERM');return rename(a,b);};store.write({value:1});fs.renameSync=rename;store.write({value:2});store.release();store=openStore(state,'test','production',{journalEnabled});assert.deepEqual(store.value,{value:2});store.release();checks++;}
 const journalDir=path.join(dir,'journal-sync');let journalStore=openStore(journalDir,'test','production');journalStore.write({n:1});let journalSyncs=0;fs.fsyncSync=fd=>{if(++journalSyncs===1)throw failure('EBUSY');return fsync(fd);};journalStore.write({n:2});fs.fsyncSync=fsync;journalStore.release();assert.equal(fs.readFileSync(path.join(journalDir,'checkpoint.journal'),'utf8').trim().split('\n').length,2);journalStore=openStore(journalDir,'test','production');assert.deepEqual(journalStore.value,{n:2});journalStore.release();checks+=2;
 const cold=coldRoomStore(path.join(dir,'cold'));let faults=0;fs.renameSync=(a,b)=>{if(faults++<2)throw failure('EBUSY');return rename(a,b);};const hash=cold.write({result:'retained'});fs.renameSync=rename;assert.deepEqual(cold.read(hash),{result:'retained'});checks++;
 const logs=[],app=await startServer({port:0,lan:true,stateDir:path.join(dir,'http'),registryDir:path.join(dir,'registry'),playtestSnapshotOnly:true,logger:e=>logs.push(e)}),cookies=new Map();
 async function post(route,body={}){const r=await fetch(app.origin+'/api/'+route,{method:'POST',headers:{Origin:app.origin,'Content-Type':'application/json',Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; ')},body:JSON.stringify(body)});for(const c of r.headers.getSetCookie()){const [k,v]=c.split(';')[0].split('=');cookies.set(k,v);}return {status:r.status,body:await r.json()};}
 try{assert.equal((await post('open')).status,200);assert.equal((await post('pvp/make',{slots:['human','human','empty','empty'],visibility:'private'})).status,200);
 fs.renameSync=(a,b)=>{if(b.endsWith('liveness.json'))throw failure('EPERM');return rename(a,b);};assert.equal((await post('read')).status,200);assert.ok(logs.some(e=>e.event==='liveness-recovered'));assert.ok(logs.some(e=>e.event==='liveness-write-failed'&&e.file==='liveness.json'&&e.operation==='rename'&&e.attempts===5));checks+=3;
 fs.renameSync=rename;assert.equal((await post('read')).status,200);checks++;
 fs.renameSync=(a,b)=>{if(b.endsWith('liveness.json')||b.endsWith('checkpoint.json'))throw failure('EPERM');return rename(a,b);};
 // Advance heartbeat so liveness must write even when no game command is pending.
 await new Promise(r=>setTimeout(r,20));const failed=await post('read');assert.equal(failed.status,503);assert.equal((await post('read')).status,503);checks+=2;
 }finally{fs.renameSync=rename;await app.close();}
 console.log(JSON.stringify({passed:true,checks,transientRecovery:true,atomicOldFilePreserved:true,livenessFallback:true,permanentFailureNotAcknowledged:true,dir}));
}finally{fs.renameSync=rename;fs.fsyncSync=fsync;fs.writeFileSync=write;}

