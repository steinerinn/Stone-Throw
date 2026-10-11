import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import {startServer} from '../server/main.mjs';
import {devRoomHealthReader} from '../server/dev-room.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-request-isolation-'));
const app=await startServer({port:0,registryDir:dir+'/registry',stateDir:dir+'/state',logger:()=>{}});
const post=(route,body='{}',headers={})=>fetch(app.origin+route,{method:'POST',headers:{Origin:app.origin,'Content-Type':'application/json',...headers},body});
let checks=0;
const oldRead=fs.readFileSync,oldStat=fs.statSync,oldAsyncStat=fsp.stat,oldStatfs=fsp.statfs;
try{
 const opened=await post('/api/open');assert.equal(opened.status,200);await opened.json();
 let snapshotVisits=0;for(const entry of app.sessions.values()){const session=entry.session,visit=session.visitStatistics;const wrapped={...session,visitStatistics:(...args)=>{snapshotVisits++;return visit(...args);}};entry.session=wrapped;for(const slot of Object.values(entry.slots||{}))if(slot.session===session)slot.session=wrapped;}
 const journal=dir+'/state/checkpoint.journal',before=fs.readFileSync(journal);
 for(const [route,body,headers,status]of [
  ['/api/open','{}',{Origin:'https://evil.invalid'},403],
  ['/api/open','{}',{'Content-Type':'text/plain'},400],
  ['/api/open','{',{},400],
  ['/api/open','[]',{},400],
 ]){const r=await post(route,body,headers);assert.equal(r.status,status);await r.arrayBuffer();checks++;}
 const badHost=await new Promise((resolve,reject)=>{const req=http.request(app.origin+'/api/open',{method:'POST',headers:{Host:'evil.invalid',Origin:app.origin,'Content-Type':'application/json'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);req.end('{}');});assert.equal(badHost,403);checks++;
 const get=await fetch(app.origin+'/api/open');assert.equal(get.status,405);await get.arrayBuffer();checks++;
 assert.equal(snapshotVisits,0,'Rejected requests must not prepare game snapshots');assert.deepEqual(fs.readFileSync(journal),before,'Rejected transport requests must not save the world');checks++;
 // A deliberately held asset stat must not block an unrelated health request.
 let release,entered;const gate=new Promise(r=>release=r),seen=new Promise(r=>entered=r);
 fsp.stat=async function(file,...args){if(String(file).endsWith('game-log.js')){entered();await gate;}return oldAsyncStat.call(this,file,...args);};
 const slow=fetch(app.origin+'/client-v13/game-log.js');await seen;
 const start=performance.now(),health=await fetch(app.origin+'/health',{signal:AbortSignal.timeout(2000)});
 assert.equal((await health.json()).healthy,true);const healthMs=performance.now()-start;release();await(await slow).arrayBuffer();fsp.stat=oldAsyncStat;checks++;
 // Both cold and warm static responses, HTML and music avoid sync disk reads.
 const publicFile=file=>String(file).includes('playtest')&&!String(file).includes('node_modules');
 fs.readFileSync=function(file,...args){assert.ok(!publicFile(file),'sync public read: '+file);return oldRead.call(this,file,...args);};
 fs.statSync=function(file,...args){assert.ok(!publicFile(file),'sync public stat: '+file);return oldStat.call(this,file,...args);};
 for(const url of ['/','/client-v13/game-log.js','/client-v13/profile.js','/assets/audio/music/exploration.mp3']){
  const r=await fetch(app.origin+url,{headers:{Range:'bytes=0-31'}});assert.ok([200,206].includes(r.status),url+': '+r.status);await r.arrayBuffer();checks++;
 }
 let releaseDisk,enteredDisk;const diskGate=new Promise(r=>releaseDisk=r),diskSeen=new Promise(r=>enteredDisk=r);
 fsp.statfs=async function(...args){enteredDisk();await diskGate;return oldStatfs.apply(this,args);};
 const reading=devRoomHealthReader()(dir);await diskSeen;
 const healthWhileDisk=await fetch(app.origin+'/health',{signal:AbortSignal.timeout(2000)});assert.equal((await healthWhileDisk.json()).healthy,true);releaseDisk();assert.ok((await reading).disk.total>0);checks++;
 console.log(JSON.stringify({passed:true,checks,rejectionsDoNotPersist:true,asyncAssetHealthMs:healthMs,noSyncAssetIO:true,asyncDiskHealth:true}));
}finally{fs.readFileSync=oldRead;fs.statSync=oldStat;fsp.stat=oldAsyncStat;fsp.statfs=oldStatfs;await app.close();}
