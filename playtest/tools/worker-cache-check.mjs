import assert from 'node:assert/strict';
import {createRingService} from '../server/ring-pvp.mjs';import {roster} from '../server/main.mjs';import {serializeHost} from '../canonical/compiled/host/serialization.js';
const service=createRingService(roster,{seed:42,now:()=>1000}),games=[];
try{for(let i=0;i<10;i++){const binding='isolated-'+i,made=await service.lobby('make',{seats:3,controllers:['human','ai','ai'],name:'Test'},binding),token=made.token,s=made.update.snapshot;const result=await service.route(token,binding,'command',{contract:s.contract,battle:s.battle,revision:s.revision,intent:{kind:'random-placement'}});assert.equal(result.accepted,true);games.push({token,binding,code:made.update.lan.code});assert.ok(service.workerCount<=8);}
 const first=games[0],room=service.rooms.get(first.code),before=serializeHost(room.host),s=(await service.route(first.token,first.binding,'read')).snapshot;
 const denied=await service.route(first.token,first.binding,'command',{contract:s.contract,battle:s.battle,revision:s.revision-1,intent:{kind:'random-placement'}});assert.equal(denied.error,'stale');assert.equal(serializeHost(room.host),before);assert.ok(service.workerCount<=8);assert.equal(service.rooms.size,10);
 console.log(JSON.stringify({passed:true,idleWorkerCacheBound:8,roomsPreserved:10,evictedWorkerRestoresExactAuthority:true}));
}finally{await service.close();}
