import assert from 'node:assert/strict';
import {createPvpService} from '../server/multiplayer.mjs';
import {prepareStatistics} from '../server/statistics-capture.mjs';
let checks=0;
for(const count of [2,3,4])for(const workers of count===2?[false]:[false,true]){
 let now=1000;const service=createPvpService({inf:2},{seed:42,workers,now:()=>now});
 try{
  const clients=[await service.lobby('make',{name:'P0',seats:count,controllers:Array(count).fill('human'),identity:{kind:'account',playerId:'p0'}},'b0')];
  const code=clients[0].update.lan.code;let r=service.rooms.get(code);
  for(let i=1;i<count;i++)clients.push(await service.lobby('join',{code,name:'P'+i,identity:{kind:'account',playerId:'p'+i}},'b'+i));
  const route=(i,action,body={})=>service.route(clients[i].token,'b'+i,action,body);
  async function command(i,intent){const u=await route(i,'read');const o=await route(i,'command',{contract:u.snapshot.contract,battle:u.snapshot.battle,revision:u.snapshot.revision,intent});assert.notEqual(o.accepted,false,o.error);return o;}
  const capture=()=>prepareStatistics(r,r.host,r.epoch,{mode:count===2?'Duel':count+' Players',build:'test',now:()=>now,participants:r.seats,news:r.news,closed:r.closed});
  for(let i=0;i<count;i++){await command(i,{kind:'place',unit:'inf',cells:[{x:14,y:14}]});await command(i,{kind:'place',unit:'inf',cells:[{x:12,y:14}]});await command(i,{kind:'start'});}
  const id=capture().id;
  const acting=()=>r.host.config.players.findIndex(p=>p.id===r.host.activePlayerId);
  let i=acting(),u=await route(i,'read');assert.ok(u.lan.afk);assert.ok(!r.afk);
  // Merely polling throughout a long presentation cannot create an AFK incident.
  now+=180000;r.seats.forEach(s=>s.seen=now);await service.tick();assert.equal(r.seats[i].afkIncidents||0,0);checks++;
  u=await route(i,'read');await route(i,'input-ready',{key:u.lan.afk.inputKey});assert.ok(r.afk);
  now+=29000;r.seats.forEach(s=>s.seen=now);await service.tick();assert.equal(r.seats[i].afkIncidents||0,0);
  now+=1000;r.seats.forEach(s=>s.seen=now);await service.tick();assert.equal(r.seats[i].afkIncidents,1);checks++;
  u=await route(i,'read');const episode=r.afk.id;const invalid=await route(i,'command',{contract:u.snapshot.contract,battle:u.snapshot.battle,revision:u.snapshot.revision,intent:{kind:'shoot',cell:{x:99,y:99}}});assert.equal(invalid.accepted,false);assert.equal(r.afk.id,episode);checks++;
  await command(i,{kind:'shoot',cell:{x:0,y:0}});assert.ok(!r.afk);assert.equal(r.seats[i].controller,'human');checks++;
  i=acting();u=await route(i,'read');await route(i,'input-ready',{key:u.lan.afk.inputKey});now+=30000;r.seats.forEach(s=>s.seen=now);await service.tick();
  const incidents=r.seats[i].afkIncidents,warningId=r.afk.id;const snapshot=service.exportState();service.restoreState(snapshot);r=service.rooms.get(code);assert.equal(capture().id,id);assert.ok(r.seats[i].afkIncidents>=1);checks++;
  // Restart invalidates the old readiness key and requires a fresh settled view.
  u=await route(i,'read');await route(i,'input-ready',{key:u.lan.afk.inputKey});assert.equal(r.seats[i].afkIncidents,incidents);assert.equal(r.afk.id,warningId);await service.tick();
  const voter=(i+1)%count,cutoff=r.host.events.length;
  await route(voter,'afk-vote',{episode:r.afk.id,action:'kick'});if(r.seats[i].controller==='human')await route((i+2)%count,'afk-vote',{episode:r.afk.id,action:'kick'});
  assert.equal(r.seats[i].controller,'ai');assert.equal(r.seats[i].statDeparture.eventCursor,cutoff);assert.equal(r.seats[i].statDeparture.reason,'afk');checks++;
  r.closed=true;const d=capture();assert.equal(d.participants[i].reliabilityOutcome,incidents>=2?'AFK':'DISCONNECTED');assert.equal(d.participants[i].cutoff,cutoff);assert.equal(capture(),d);checks++;
 }finally{await service.close();}
}
console.log(JSON.stringify({passed:true,checks,formats:[2,3,4],workerAndInline:true}));
