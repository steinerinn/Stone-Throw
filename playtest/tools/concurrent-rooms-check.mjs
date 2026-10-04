import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {startServer} from '../server/main.mjs';import {archiveDecoder} from '../server/archive-wire.mjs';import {journalRecords} from '../server/journal-reader.mjs';import {serializeHost} from '../canonical/compiled/host/serialization.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-concurrent-rooms-'));
const app=await startServer({port:0,lan:true,bind:'127.0.0.1',seed:42,stateDir:dir+'/state',registryDir:dir+'/registry',logger:()=>{}});
const rooms=[];let overlapping=false;
function client(){const jar=new Map();return {jar,async post(route,body={}){const response=await fetch(app.origin+'/api/'+route,{method:'POST',headers:{Origin:app.origin,'Content-Type':'application/json',Accept:'application/x-ndjson','X-St-Incremental-Stream':'1',Cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')},body:JSON.stringify(body)});for(const c of response.headers.getSetCookie()){const [k,v]=c.split(';')[0].split('=');jar.set(k,v);}const text=await response.text(),out=response.headers.get('content-type')?.includes('ndjson')?JSON.parse(text.trim().split('\n').at(-1)).update:JSON.parse(text);assert.equal(response.status,200,text);return out;}};}
const command=async(c,intent)=>{const s=(await c.post('read')).snapshot;return {contract:s.contract,battle:s.battle,revision:s.revision,intent};};
let poll;
try{
 for(let n=0;n<2;n++){const clients=[client(),client()];for(const c of clients)await c.post('open');const made=await clients[0].post('pvp/make',{seats:4,controllers:['human','human','ai','ai']});await clients[1].post('pvp/join',{code:made.update.lan.code});for(const c of clients)for(const kind of ['random-placement','start'])assert.notEqual((await c.post('command',await command(c,{kind}))).accepted,false);rooms.push({clients,code:made.update.lan.code});}
 poll=setInterval(()=>{if(rooms.every(({clients})=>clients.some(c=>app.pvp.isBusy(c.jar.get('st12seat')))))overlapping=true;},1);
 for(let n=0;n<8;n++){
  const actions=await Promise.all(rooms.map(async({clients,code})=>{const room=app.pvp.rooms.get(code),i=room.host.config.players.findIndex(p=>p.id===room.host.activePlayerId),c=clients[i];return {c,body:await command(c,{kind:'shoot',cell:{x:n,y:0}})};}));
  const out=await Promise.all(actions.map(({c,body})=>c.post('command',body)));assert.ok(out.every(u=>u.accepted));
  // Check acknowledged authority directly from the durable journal BEFORE close
  // can perform its final save. This catches premature acknowledgements.
  let decode=archiveDecoder(),saved,sequence=0,previous='';
  for(const row of journalRecords(dir+'/state/checkpoint.journal')){const record=JSON.parse(row.line);assert.equal(record.sequence,++sequence);assert.equal(record.previous,previous);assert.equal(createHash('sha256').update(record.payload).digest('hex'),record.sha256);previous=record.sha256;const entry=JSON.parse(record.payload);if(entry.reset)decode=archiveDecoder();saved=decode(entry.packet);}
  for(const {code} of rooms)assert.equal(serializeHost(saved.multiplayer.ring.find(r=>r.code===code).host),serializeHost(app.pvp.rooms.get(code).host));
 }
 assert.ok(overlapping,'Both rooms must execute workers concurrently');
 const {clients,code}=rooms[0],room=app.pvp.rooms.get(code),c=clients[room.host.config.players.findIndex(p=>p.id===room.host.activePlayerId)],body=await command(c,{kind:'shoot',cell:{x:8,y:0}});
 const duplicate=await Promise.all([c.post('command',body),c.post('command',body)]);assert.equal(duplicate.filter(u=>u.accepted).length,1);assert.equal(duplicate.filter(u=>u.error==='stale').length,1);
 // Hold one room before its worker starts: final reads for that same room
 // must wait for durability, but an unrelated room's watch must not wait.
 const originalStream=app.pvp.stream;let release,entered;
 const held=new Promise(resolve=>{release=resolve;}),began=new Promise(resolve=>{entered=resolve;});
 app.pvp.stream=async(...args)=>{entered();await held;return originalStream(...args);};
 const active=app.pvp.rooms.get(code).host.activePlayerId,acting=clients[app.pvp.rooms.get(code).host.config.players.findIndex(p=>p.id===active)];
 const heldBody=await command(acting,{kind:'shoot',cell:{x:14,y:0}}),pending=acting.post('command',heldBody);await began;
 let ownReturned=false;const ownWatch=acting.post('pvp/watch',{after:0,cursor:''}).then(value=>{ownReturned=true;return value;});
 let timeout;
 try{await Promise.race([rooms[1].clients[0].post('pvp/watch',{after:0,cursor:''}),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Unrelated watch blocked')),1000);})]);
 await new Promise(resolve=>setTimeout(resolve,60));assert.equal(ownReturned,false,'Own room must remain behind its commit boundary');
 }finally{clearTimeout(timeout);release();app.pvp.stream=originalStream;}
 await pending;await ownWatch;
 console.log(JSON.stringify({passed:true,concurrentRooms:2,acknowledgedRngAndHostDurable:true,sameRoomOrdering:true,unrelatedWatchIndependent:true,ownWatchWaitsForCommit:true,evidence:dir}));
}finally{clearInterval(poll);await app.close();}
