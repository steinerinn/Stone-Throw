import assert from 'node:assert/strict';
import {createPvpService} from '../server/multiplayer.mjs';
import {roster} from '../server/main.mjs';
let checks=0;
for(const count of [2,3,4]){
 let now=1000;const service=createPvpService(roster,{seed:42,now:()=>now});
 try{
 const a=await service.lobby('make',{name:'Alpha',slots:['human','human',count>=3?'ai':'empty',count===4?'ai':'empty']},'a');
 const room=service.rooms.get(a.update.lan.code);assert.equal(room.deploymentDeadline,undefined);now+=10000;room.seats[0].seen=now;await service.tick();assert.equal(room.deploymentDeadline,undefined);checks++;
 const b=await service.lobby('join',{name:'Beta',code:room.code},'b'),deadline=room.deploymentDeadline;assert.equal(deadline,now+120000);checks++;
 async function command(c,binding,intent){room.seats.forEach(s=>{if(s)s.seen=now;});const u=await service.route(c.token,binding,'read');const v=await service.route(c.token,binding,'command',{contract:u.snapshot.contract,battle:u.snapshot.battle,revision:u.snapshot.revision,intent});assert.notEqual(v.accepted,false,v.error);return v;}
 await command(a,'a',{kind:'random-placement'});const placed=structuredClone(room.host.placements.filter(p=>p.ownerId===room.host.config.players[0].id));await command(a,'a',{kind:'start'});assert.equal(room.ready[0],true);await command(a,'a',{kind:'start'});assert.equal(room.ready[0],false);assert.deepEqual(room.host.placements.filter(p=>p.ownerId===room.host.config.players[0].id),placed);checks++;
 await command(b,'b',{kind:'place',unit:'inf',cells:[{x:0,y:0}]});const preserved=structuredClone(room.host.placements.find(p=>p.ownerId===room.host.config.players[1].id));
 now+=20000;room.seats.forEach(s=>{if(s)s.seen=now;});await service.route(a.token,'a','leave');const info=await service.route(a.token,'a','return-status');const rejoined=await service.route(a.token,'a','rejoin',{battle:info.rejoin.battle,episode:info.rejoin.episode});assert.equal(rejoined.update.lan.deployment.deadline,deadline);assert.equal(room.ready[0],false);checks++;
 const saved=service.exportState();service.restoreState(saved);const restored=service.rooms.get(room.code);assert.equal(restored.deploymentDeadline,deadline);checks++;
 now=deadline;restored.seats.forEach(s=>{if(s)s.seen=now;});if(count===4)restored.seats[1].seen=now-10000;assert.equal(await service.tick(),true);assert.notEqual(restored.host.status,'placement');assert.deepEqual(restored.host.placements.find(p=>p.unitId===preserved.unitId),preserved);assert.deepEqual(restored.host.placements.filter(p=>p.ownerId===restored.host.config.players[0].id),placed);checks++;
 assert.equal(restored.deploymentDiagnostics.length,count===4?1:2);assert.ok(restored.deploymentDiagnostics.every(d=>d.diagnosticOnly));const initial=JSON.stringify(restored.deploymentDiagnostics);await service.tick();assert.equal(JSON.stringify(restored.deploymentDiagnostics),initial);checks++;
 console.log('PASS deployment '+count+'P: delayed arm, Ready/Unready, preserved placement, rejoin, restore, timeout, diagnostic-only AFK');
 }finally{await service.close();}
}
console.log(JSON.stringify({passed:true,checks}));
