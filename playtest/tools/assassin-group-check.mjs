import assert from 'node:assert/strict';
import {createRingService} from '../server/ring-pvp.mjs';
import {serializeHost,deserializeHost} from '../canonical/compiled/host/serialization.js';
import {syncRing} from '../canonical/compiled/host/ring.js';
import {refreshHost} from '../canonical/compiled/host/refresh.js';
let checks=0;
for(const n of [3,4])for(const workers of [false,true]){
 const service=createRingService({inf:2,wizard:1,assassin:1},{seed:42,workers,now:()=>100000});
 try{const made=await service.lobby('make',{name:'Tester',seats:n,controllers:Array(n).fill('human')},'p0'),r=service.rooms.get(made.update.lan.code),tokens=[made.token];for(let i=1;i<n;i++)tokens.push((await service.lobby('join',{name:'P'+i,code:r.code},'p'+i)).token);
 const act=async(i,intent)=>{const {snapshot:s}=await service.route(tokens[i],'p'+i,'read');const u=await service.route(tokens[i],'p'+i,'command',{contract:s.contract,battle:s.battle,revision:s.revision,intent});assert.equal(u.accepted,true,u.error);return u;};
 for(let i=0;i<n;i++){for(const [unit,x,y]of [['inf',12,14],['inf',14,14],['wizard',2,2],['assassin',12,13]])await act(i,{kind:'place',unit,cells:[{x,y}]});await act(i,{kind:'start'});}
 const h=r.host;h.activePlayerId=h.config.players[0].id;h.starterId=h.activePlayerId;h.state.ring.order=h.config.players.map(p=>p.id);h.status='awaiting-command';h.turnStep='actions';h.state.seats[0].ordinaryShots=3;syncRing(h.state);refreshHost(h);r.host=deserializeHost(serializeHost(h));r.revision++;
 const saved=service.exportState()[0];saved.seats.forEach((s,i)=>{if(i){s.controller='ai';s.npc=['Rackler','Snurk','Cruns'][i-1];s.name=s.npc;}});const local=service.localSession({},JSON.stringify({contract:'local-group-session-v1',battle:saved}));const l=await local.client.read(),intent={kind:'shoot',cell:{x:12,y:13}};const localResult=await local.client.dispatch({contract:l.snapshot.contract,battle:l.snapshot.battle,revision:l.snapshot.revision,intent}),onlineResult=await act(0,intent);assert.equal(localResult.accepted,true);
 const localHost=deserializeHost(JSON.parse(await local.serializePrivate()).battle.host);assert.equal(serializeHost(localHost),serializeHost(r.host));const events=r.host.events.map(row=>row.event),strike=events.find(e=>e.kind==='attack-started'&&e.reason==='assassin');assert.ok(strike);assert.equal(strike.meta.targetPlayerId,'seat-0');assert.equal(events.filter(e=>e.kind==='attack-started'&&e.reason==='assassin').length,1);assert.ok(onlineResult.presentation.some(f=>f.onlineAnimation?.cue.kind==='assassin'));assert.ok(onlineResult.snapshot.online.boards.find(b=>b.seat===1).cells.some(c=>c.kind==='assassin'));assert.equal(r.host.pendingRoot,null);const restored=service.localSession({},await local.serializePrivate());assert.deepEqual({...((await restored.client.read()).snapshot.online),room:null},{...localResult.snapshot.online,room:null});checks++;
 }finally{await service.close();}
}
console.log(JSON.stringify({passed:true,checks,localOnlineParity:true,workerModes:[false,true],formats:[3,4],publicImpact:true,restored:true}));
