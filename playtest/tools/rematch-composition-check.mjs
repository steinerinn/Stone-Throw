import assert from 'node:assert/strict';
import {createPvpService} from '../server/multiplayer.mjs';
let checks=0;
for(const controllers of [['human','human','ai'],['human','human','ai','ai'],['human','ai','human','ai'],['human','human','human','human']]){
 const service=createPvpService({inf:1,hero:1,cleric:1,monk:1,dwarf:1,goblin:1,elf:1,demon:1,dragon:1,wizard:1},{seed:42,workers:true});
 try{
  const clients=new Map();const made=await service.lobby('make',{name:'P0',seats:controllers.length,controllers},'b0');clients.set(0,made);
  const room=service.rooms.get(made.update.lan.code);
  for(let i=1;i<controllers.length;i++)if(controllers[i]==='human')clients.set(i,await service.lobby('join',{name:'P'+i,code:room.code},'b'+i));
  const npcs=room.seats.filter(s=>s.controller==='ai').map(s=>s.npc);
  const command=async(i,intent)=>{const token=clients.get(i).token,u=await service.route(token,'b'+i,'read');const out=await service.route(token,'b'+i,'command',{contract:u.snapshot.contract,battle:u.snapshot.battle,revision:u.snapshot.revision,intent});assert.notEqual(out.accepted,false);};
  for(const i of clients.keys()){await command(i,{kind:'random-placement'});await command(i,{kind:'start'});}
  for(let guard=0;room.host.status!=='complete';guard++){
   assert.ok(guard<200);const h=room.host,d=h.pendingRoot?.decisions.find(d=>d.status==='pending'),i=h.config.players.findIndex(p=>p.id===(d?.actorId||h.activePlayerId)),u=await service.route(clients.get(i).token,'b'+i,'read');
   if(d){await command(i,{kind:'answer',choice:u.snapshot.choice.handle,cell:d.legalCells[0]||null,unit:d.legalUnitIds[0]?room.handles[i].get(d.legalUnitIds[0]):null});continue;}
   const target=h.config.players[u.lan.target].id,board=h.state.seats.find(s=>s.playerId===target),units=h.state.match.units.filter(u=>u.ownerId===target&&u.lifecycle!=='destroyed');let cell=units.filter(u=>['inf','monk'].includes(u.type)||u.type==='hero'&&u.hero?.hitsTaken>0).flatMap(u=>u.cells).find(c=>!board.shots.includes(c.x+','+c.y));
   cell??=units.flatMap(u=>u.cells).find(c=>!board.shots.includes(c.x+','+c.y));assert.ok(cell);await command(i,{kind:'shoot',cell});
  }
  // The first human rematches; remaining humans have not consented yet.
  const first=await service.route(made.token,'b0','rematch'),next=service.rooms.get(first.update.lan.code);
  assert.deepEqual(next.seats.map(s=>s.controller),controllers);assert.deepEqual(next.seats.filter(s=>s.controller==='ai').map(s=>s.npc),npcs);
  assert.equal(next.seats.filter(s=>s.controller==='human'&&!s.token).length,clients.size-1);
  assert.equal(next.host.status,'placement');assert.ok(next.seats.every((s,i)=>s.controller!=='ai'||next.ready[i]));checks+=5;
  for(const [i,c]of clients)if(i!==0){const joined=await service.route(c.token,'b'+i,'rematch');assert.equal(joined.update.lan.code,next.code);}
  assert.equal(next.seats.filter(s=>s.controller==='human'&&!s.token).length,0);assert.deepEqual(next.seats.map(s=>s.controller),controllers);checks+=2;
 }finally{await service.close();}
}
console.log(JSON.stringify({passed:true,checks}));
