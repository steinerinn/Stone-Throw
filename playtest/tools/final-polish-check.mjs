import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';
import {createPvpService} from '../server/multiplayer.mjs';import {prepareStatistics} from '../server/statistics-capture.mjs';import {reliabilityHistory} from '../server/reliability-outcome.mjs';import {profileFixture} from './profile-fixture.mjs';import {createHost,place} from '../canonical/compiled/host/initialization.js';import {normalPolicy,emptyNormalMemory} from '../canonical/compiled/local-host/normal-policy.js';
let checks=0;
for(const plague of [false,true])for(const activated of [false,true])for(let seed=1;seed<=20;seed++){
 const h=createHost({matchId:'polish-ai',rulesVersion:'stone-throw-v1.427',seed,size:15,story:false,players:[0,1].map(i=>({id:'p'+i,boardId:'b'+i,roster:{castle:1,hero:1},decisionMode:'interactive'}))});
 place(h,{unitId:'castle',ownerId:'p0',boardId:'b0',type:'castle',cells:[{x:11,y:6},{x:11,y:7},{x:11,y:8},{x:10,y:8},{x:12,y:8}]});place(h,{unitId:'hero',ownerId:'p0',boardId:'b0',type:'hero',cells:[{x:3,y:3}]});
 const hero=h.state.match.units.find(u=>u.id==='hero');hero.hero.activated=activated;hero.hero.hitsTaken=activated?1:0;hero.hero.currentCell={x:3,y:3};h.state.seats[1].scouted=['3,3'];
 const m=emptyNormalMemory();m.scoutKnowledge=[['3,3',activated?'core':'special']];m.knownHits=['11,6'];m.castleHits=['11,6'];h.state.seats[0].shots=['11,6'];const chosen=normalPolicy(h,m).target(plague);if(activated)assert.equal(chosen,'3,3');else assert.notEqual(chosen,'3,3');checks++;
}
for(const count of [2,3,4])for(const workers of count===2?[false]:[false,true]){
 let now=1000;const service=createPvpService({inf:2},{seed:42,workers,now:()=>now});
 try{const clients=[await service.lobby('make',{name:'P0',seats:count,controllers:Array(count).fill('human'),identity:{kind:'account',playerId:'p0'}},'b0')],code=clients[0].update.lan.code;
 for(let i=1;i<count;i++)clients.push(await service.lobby('join',{code,name:'P'+i,identity:{kind:'account',playerId:'p'+i}},'b'+i));
 const route=(i,a,b={})=>service.route(clients[i].token,'b'+i,a,b);
 for(let i=0;i<count;i++)for(const intent of [{kind:'place',unit:'inf',cells:[{x:14,y:14}]},{kind:'place',unit:'inf',cells:[{x:12,y:14}]},{kind:'start'}]){const u=await route(i,'read');await route(i,'command',{contract:u.snapshot.contract,battle:u.snapshot.battle,revision:u.snapshot.revision,intent});}
 let r=service.rooms.get(code);const capture=()=>prepareStatistics(r,r.host,r.epoch,{mode:count===2?'Duel':count+' Players',build:'test',now:()=>now,participants:r.seats,news:r.news,closed:r.closed});capture();
 // A single late connection remains a normal disconnect.
 now+=8000;r.seats.slice(1).forEach(s=>s.seen=now);await service.tick();assert.equal(r.seats[0].disconnects,1);assert.ok(!r.seats[0].absence.incident);checks++;
 let u=await route(0,'return-status');await route(0,'rejoin',{battle:u.rejoin.battle,episode:u.rejoin.episode});
 // All participants stop together. Previous isolated count is preserved.
 r.seats.forEach(s=>s.seen=now);now+=8000;await service.tick();r=service.rooms.get(code);assert.ok(r.seats.every(s=>s.absence?.incident));assert.equal(r.seats[0].disconnects,1);assert.ok(r.seats.slice(1).every(s=>!s.disconnects));checks+=3;
 const restored=createPvpService({inf:2},{seed:42,workers:false,now:()=>now});try{restored.restoreState(service.exportState());assert.ok([...restored.rooms.values()][0].seats.every(s=>s.absence.incident));checks++;}finally{await restored.close();}
 r.closed=true;const d=capture();assert.ok(d.participants.every(p=>p.reliabilityOutcome==='EXEMPT'));assert.ok(d.participants.every(p=>p.reliabilityFacts.sharedIncidents.length));checks+=2;
 const row=(id,outcome)=>({match_id:id,seat:0,descriptor:{classification:{mode:'online'},participants:[{seat:0,reliabilityOutcome:outcome}]}});const before=reliabilityHistory([row('a','AFK'),row('b','FINISHED')]);assert.deepEqual(reliabilityHistory([row('a','AFK'),row('b','FINISHED'),row('c','EXEMPT')]),before);checks++;
 }finally{await service.close();}
}
// Cross-room incident requires independent humans, even when each match has one human.
const {detectSharedIncidents}=await import('../server/shared-incidents.mjs');const fake=(id,seen)=>({code:id,revision:0,host:{status:'awaiting-command',state:{},config:{players:[{id}]}},seats:[{token:id,binding:id,controller:'human',seen}]});
const a=fake('a',1000),b=fake('b',1500);assert.equal(detectSharedIncidents([a],9000),false);assert.equal(detectSharedIncidents([a,b],9000),true);assert.ok([a,b].every(r=>r.seats[0].reliabilityIncidents[0].scope==='SERVER INCIDENT'));checks+=3;
// A stale interval straddling a tick is held only until the common window closes.
const c=fake('c',1000),e=fake('e',2500);detectSharedIncidents([c,e],8000);assert.equal(c.sharedIncidentPendingUntil,9500);detectSharedIncidents([c,e],9500);assert.ok(c.seats[0].sharedIncident&&e.seats[0].sharedIncident);detectSharedIncidents([c],9500);assert.equal(c.seats[0].reliabilityIncidents[0].scope,'SERVER INCIDENT');checks+=3;
const warning=fake('warning',1000),other=fake('other',1000);warning.seats[0].afkIncidents=2;warning.seats[0].afkHistory=[{id:'old',at:500},{id:'outage',at:3000}];detectSharedIncidents([warning,other],9000);assert.equal(warning.seats[0].afkIncidents,1);assert.ok(warning.seats[0].afkHistory[1].sharedIncident);assert.ok(!warning.seats[0].afkHistory[0].sharedIncident);checks+=3;
const sameA=fake('same',1000),sameB=fake('same',1000);assert.equal(detectSharedIncidents([sameA,sameB],9000),false);checks++;
const {finalReliability}=await import('../server/reliability-outcome.mjs');assert.equal(finalReliability({incidents:2,incidentExempt:true}),'AFK');assert.equal(finalReliability({disconnects:2,incidentExempt:true}),'DISCONNECTED');checks+=2;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'polish-delete-')),f=await profileFixture(dir),db=new DatabaseSync(f.registry.file);try{const call=(i,a,b={})=>f.registry.handle(a,b,{token:f.users[i].token}),p=await call(0,'profile-view'),matchId=p.recent[0].matchId;await call(0,'save-battle',{matchId});const row=db.prepare('SELECT * FROM profile_saved_battles WHERE match_id=?').get(matchId);db.prepare('INSERT INTO profile_saved_battles VALUES(?,?,?,?,?,?)').run(f.users[1].account.playerId,matchId,row.saved_at,row.summary,row.result,row.replay);const raw=db.prepare('SELECT * FROM stat_matches').all();await assert.rejects(call(1,'delete-saved-battle',{matchId,playerId:f.users[0].account.playerId}));await call(0,'delete-saved-battle',{matchId});assert.equal((await call(0,'profile-view')).saved.length,0);assert.equal(db.prepare('SELECT count(*) n FROM profile_saved_battles WHERE match_id=?').get(matchId).n,1);assert.deepEqual(db.prepare('SELECT * FROM stat_matches').all(),raw);assert.ok(await call(1,'profile-view',{section:'replay',matchId}));checks+=5;}finally{db.close();f.registry.close();}
console.log(JSON.stringify({passed:true,checks,heroPriority:true,sharedIncidents:true,isolatedDisconnect:true,neutralRecoveryStreak:true,savedReferenceOnly:true}));
