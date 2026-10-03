import {roster as fullRoster} from '../server/main.mjs';
import assert from 'node:assert/strict';
import {createPvpService} from '../server/multiplayer.mjs';
import {prepareStatistics} from '../server/statistics-capture.mjs';
const roster=Object.fromEntries('inf cav archer monk castle dwarf goblin catapult elf cleric demon dragon wizard necro hero assassin'.split(' ').map(k=>[k,k==='inf'?2:0]));
let checks=0;
for(const [count,humans] of [[2,2],[3,3],[4,4],[3,2],[4,2]])for(const workers of count===2?[false]:[false,true])for(const legacy of count===2?[true,false]:[false]){
 const service=createPvpService(humans===count?roster:fullRoster,{seed:42,workers,now:()=>1000});
 try{
  const clients=[await service.lobby('make',{name:'P0',seats:count,controllers:Array.from({length:count},(_,i)=>i<humans?'human':'ai')},'b0')];
  const code=clients[0].update.lan.code;
  for(let i=1;i<humans;i++)clients.push(await service.lobby('join',{code,name:'P'+i},'b'+i));
  const route=(i,action,body={})=>service.route(clients[i].token,'b'+i,action,body);
  async function command(i,intent){const {snapshot:s}=await route(i,'read');return route(i,'command',{contract:s.contract,battle:s.battle,revision:s.revision,intent});}
  for(let i=0;i<humans;i++){if(humans<count)await command(i,{kind:'random-placement'});else{await command(i,{kind:'place',unit:'inf',cells:[{x:14,y:14}]});await command(i,{kind:'place',unit:'inf',cells:[{x:12,y:14}]});}await command(i,{kind:'start'});}
  let r=service.rooms.get(code);const actor=r.host.config.players.findIndex(p=>p.id===r.host.activePlayerId),quitter=clients.findIndex((_,i)=>i!==actor);
  const units=JSON.stringify(r.host.state.match.units),events=r.host.events.length;
  const out=legacy?await command(quitter,{kind:'give-up'}):await route(quitter,'give-up');r=service.rooms.get(code);
  assert.equal(r.seats[quitter].controller,'ai','Surrender must hand the same seat to AI');assert.equal(out.released,true);assert.notEqual(r.host.status,'complete');assert.equal(r.closed,false);assert.equal(JSON.stringify(r.host.state.match.units),units);assert.equal(r.host.events.length,events);checks+=6;
  assert.equal(r.seats[quitter].statDeparture.reason,'surrender');assert.equal(r.seats[quitter].statDeparture.eventCursor,events);assert.equal(r.seats.filter(s=>s.statDeparture).length,1);checks+=3;
  const u=await route(actor,'read');assert.notEqual(u.snapshot.phase,'finished');assert.ok(!u.snapshot.matchScore);assert.ok(!u.snapshot.groupResult);const stats=prepareStatistics(r,r.host,r.epoch,{mode:count===2?'Duel':count+' Players',build:'test',now:()=>1000,participants:r.seats,news:r.news,closed:r.closed});assert.ok(!stats.endedAt);checks+=4;
  await assert.rejects(route(quitter,'rejoin',{}),/seat-handed-to-ai/);await assert.rejects(route(quitter,'command',{}),/seat-handed-to-ai/);assert.equal((await route(quitter,'return-status')).rejoin.available,false);checks+=3;
  // Continuing real human shots lets the replacement AI participate normally.
  for(let n=0;n<(humans===count?4:0)&&service.rooms.get(code).host.status!=='complete';n++){
   r=service.rooms.get(code);const i=r.host.config.players.findIndex(p=>p.id===r.host.activePlayerId);assert.equal(r.seats[i].controller,'human');const result=await command(i,{kind:'shoot',cell:{x:n,y:0}});assert.notEqual(result.accepted,false);checks++;
  }
 }finally{await service.close();}
}
console.log(JSON.stringify({passed:true,checks,duelLegacyCommand:true,duelAndGroupTakeover:true,workers:true}));
