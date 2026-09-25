import assert from 'node:assert/strict';
import {roster as fullRoster} from '../server/main.mjs';
import {createRingService} from '../server/ring-pvp.mjs';
import {serializeHost,deserializeHost} from '../canonical/compiled/host/serialization.js';
import {syncRing} from '../canonical/compiled/host/ring.js';
import {refreshHost} from '../canonical/compiled/host/refresh.js';
let checks=0;
for(const n of [3,4]){
 const service=createRingService({inf:1,demon:1,elf:2},{seed:42,workers:false,now:()=>100000});
 try{
 const made=await service.lobby('make',{name:'Tester',seats:n,controllers:Array(n).fill('human')},'p0'),r=service.rooms.get(made.update.lan.code),tokens=[made.token];
 for(let i=1;i<n;i++)tokens.push((await service.lobby('join',{name:'P'+i,code:r.code},'p'+i)).token);
 const act=async(i,intent)=>{const {snapshot:s}=await service.route(tokens[i],'p'+i,'read');const u=await service.route(tokens[i],'p'+i,'command',{contract:s.contract,battle:s.battle,revision:s.revision,intent});assert.equal(u.accepted,true,u.error);return u;};
 for(let i=0;i<n;i++){for(const [unit,x,y]of [['inf',14,14],['demon',0,0],['elf',3,3],['elf',5,3]])await act(i,{kind:'place',unit,cells:[{x,y}]});await act(i,{kind:'start'});}
 // Controlled retained pre-shot fixture: only the next target has a living Demon.
 const h=r.host;h.activePlayerId=h.config.players[0].id;h.starterId=h.activePlayerId;h.state.ring.order=h.config.players.map(p=>p.id);h.status='awaiting-command';h.turnStep='actions';h.state.seats[0].ordinaryShots=3;syncRing(h.state);
 for(let i=0;i<n;i++)if(i!==1){const u=h.state.match.units.find(u=>u.type==='demon'&&u.ownerId===h.config.players[i].id);h.state.seats[i].shots.push('0,0');u.lifecycle='destroyed';u.damage.cells=[{x:0,y:0}];}refreshHost(h);r.revision++;
 const saved=service.exportState()[0];saved.seats.forEach((s,i)=>{if(i){s.controller='ai';s.npc=['Rackler','Snurk','Cruns'][i-1];s.name=s.npc;}});
 const local=service.localSession({},JSON.stringify({contract:'local-group-session-v1',battle:saved}));
 const l=await local.client.read(),localResult=await local.client.dispatch({contract:l.snapshot.contract,battle:l.snapshot.battle,revision:l.snapshot.revision,intent:{kind:'shoot',cell:{x:0,y:0}}}),onlineResult=await act(0,{kind:'shoot',cell:{x:0,y:0}});
 assert.equal(localResult.accepted,true,localResult.error);assert.equal(onlineResult.snapshot.online.chaos,true);assert.equal(localResult.snapshot.online.chaos,true);
 const localHost=deserializeHost(JSON.parse(await local.serializePrivate()).battle.host);assert.equal(serializeHost(localHost),serializeHost(r.host));assert.equal(r.host.state.seats[0].ordinaryShots,3);assert.equal(r.host.activePlayerId,h.config.players[0].id);assert.equal(r.host.events.filter(e=>e.event.kind==='chaos-manifestation').length,1);checks+=2;
 const restored=service.localSession({},await local.serializePrivate());assert.deepEqual((await restored.client.read()).snapshot.online.ring,localResult.snapshot.online.ring);assert.equal((await restored.client.read()).snapshot.online.chaos,true);checks++;
 const rematchService=createRingService(fullRoster,{seed:42,workers:false});try{const fresh=rematchService.localSession({npcNames:['Rackler','Snurk','Cruns'].slice(0,n-1)});await fresh.configure();assert.equal((await fresh.client.read()).snapshot.online.chaos,false);checks++;}finally{await rematchService.close();}
 // Public area choice survives private checkpoint, without exposing extra private state.
 r.host.state.seats[0].areaScoutLater=1;r.host.status='awaiting-turn';r.host.turnStep='scout';r.revision++;
 // Canonical command boundary (service usually advances this before reading).
 const {acceptCommand}=await import('../canonical/compiled/host/lifecycle.js');r.host=acceptCommand(r.host,{id:'area-entry',kind:'advance-turn'});r.revision++;
 const before=await service.route(tokens[0],'p0','read');assert.equal(before.snapshot.choice.area,true);assert.equal(before.snapshot.choice.remaining,1);
 const result=await act(0,{kind:'answer',choice:before.snapshot.choice.handle,cell:{x:4,y:3},unit:null});assert.equal(result.snapshot.choice,null);assert.equal(r.host.events.filter(e=>e.event.kind==='scouted'&&e.event.reason==='area-scout').at(-1).event.cells.length,9);checks++;
 }finally{await service.close();}
}
console.log(JSON.stringify({passed:true,checks,paths:['Single Player 3P','Single Player 4P','Online 3P','Online 4P'],localOnlineStateRngParity:true,chaosPublic:true,restore:true,rematchFresh:true}));
