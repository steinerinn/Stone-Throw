import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createPvpService} from '../server/multiplayer.mjs';import {prepareStatistics} from '../server/statistics-capture.mjs';import {livenessStore} from '../server/liveness-store.mjs';import {coldRoomStore} from '../server/cold-rooms.mjs';
let checks=0;
for(const count of [2,3,4]){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'cs-hot-set-'));let now=1000;
 const options={seed:42,stateDir:directory,now:()=>now};let service=createPvpService({inf:1},options);
 const clients=[await service.lobby('make',{name:'P0',seats:count,controllers:Array(count).fill('human')},'b0')],code=clients[0].update.lan.code;
 for(let i=1;i<count;i++)clients.push(await service.lobby('join',{name:'P'+i,code},'b'+i));
 const route=(i,a,b={})=>service.route(clients[i].token,'b'+i,a,b);
 async function command(i,intent){const u=await route(i,'read'),out=await route(i,'command',{contract:u.snapshot.contract,battle:u.snapshot.battle,revision:u.snapshot.revision,intent});assert.notEqual(out.accepted,false,out.error);}
 for(let i=0;i<count;i++){await command(i,{kind:'place',unit:'inf',cells:[{x:14,y:14}]});await command(i,{kind:'start'});}
 const room=service.rooms.get(code);while(room.host.status!=='complete'){const actor=room.host.config.players.findIndex(p=>p.id===room.host.activePlayerId);await command(actor,{kind:'shoot',cell:{x:14,y:14}});}
 prepareStatistics(room,room.host,room.epoch,{mode:count===2?'Duel':count+' Players',build:'test',now:()=>now,participants:room.seats,news:room.news,closed:room.closed});
 const history=JSON.stringify(room.host.events),rng=JSON.stringify(room.host.rng);
 const watched=service.watchRead(clients[0].token,'b0',0,'');assert.ok(watched.deliveryCursor);assert.equal(service.watchRead(clients[0].token,'b0',watched.snapshot.eventPosition,watched.deliveryCursor),null);assert.throws(()=>service.watchRead(clients[0].token,'wrong',0,''));checks+=3;
 assert.equal(await service.retireClosed(),false);checks++; // Active result/rematch seats must stay hot.
 now+=300000;assert.equal(await service.retireClosed(),true);assert.equal(service.rooms.size,0);checks+=2;
 const saved=service.exportState();assert.equal(saved.cold.length,1);assert.equal(saved.ring.length+saved.two.length,0);checks+=2;await service.close();service=createPvpService({inf:1},options);service.restoreState(saved);
 assert.equal(service.rooms.size,0);const restored=service.getRoom(code);assert.deepEqual(JSON.parse(JSON.stringify(restored.host.events)),JSON.parse(history));assert.deepEqual(JSON.parse(JSON.stringify(restored.host.rng)),JSON.parse(rng));assert.equal(restored.epoch,room.epoch);checks+=4;
 const resumed=await route(0,'read');assert.equal(resumed.snapshot.phase,'finished');checks++;
 for(let i=0;i<count;i++)await route(i,'leave');await service.retireClosed();assert.equal(service.rooms.size,0);checks++;
 const ref=service.exportState().cold[0],archive=path.join(directory,'retired-rooms',ref.hash+'.json');fs.appendFileSync(archive,' ');assert.throws(()=>coldRoomStore(directory).read(ref.hash));checks++;await service.close();
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-leases-')),leases=livenessStore(dir),room={code:'ABC123',epoch:9,seats:[{token:'seat',seen:500}],afk:{key:'input',observedAt:480}};leases.write(new Map([[room.code,room]]));const saved={two:[{...room,seats:[{token:'seat',seen:100}],afk:{key:'input',observedAt:80}}],ring:[]};leases.restore(saved);assert.equal(saved.two[0].seats[0].seen,500);assert.equal(saved.two[0].afk.observedAt,480);checks+=2;
console.log(JSON.stringify({passed:true,checks,formats:[2,3,4],coldRecovery:true,privateWatch:true,historyAndRngPreserved:true,durableLiveness:true}));
