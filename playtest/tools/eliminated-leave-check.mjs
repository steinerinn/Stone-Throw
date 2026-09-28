import assert from 'node:assert/strict';import {createPvpService} from '../server/multiplayer.mjs';import {prepareStatistics} from '../server/statistics-capture.mjs';import {normalTarget} from '../canonical/compiled/host/ring.js';
let checks=0;
for(const count of [2,3,4])for(const workers of count===2?[false]:[false,true])for(const action of count===2?['leave','permanent','timeout']:['leave','permanent','give-up','timeout']){
 let time=1000;const service=createPvpService({inf:1},{seed:42,workers,now:()=>time});
 try{const clients=[await service.lobby('make',{name:'P0',seats:count,controllers:Array(count).fill('human'),identity:{kind:'account',playerId:'p0'}},'b0')],code=clients[0].update.lan.code,r=service.rooms.get(code);for(let i=1;i<count;i++)clients.push(await service.lobby('join',{code,name:'P'+i,identity:{kind:'account',playerId:'p'+i}},'b'+i));
 const route=(i,a,b={})=>service.route(clients[i].token,'b'+i,a,b);
 async function command(i,intent){const u=await route(i,'read'),o=await route(i,'command',{contract:u.snapshot.contract,battle:u.snapshot.battle,revision:u.snapshot.revision,intent});assert.notEqual(o.accepted,false,o.error);}
 const capture=()=>prepareStatistics(r,r.host,r.epoch,{mode:count===2?'Duel':count+' Players',build:'test',now:()=>time,participants:r.seats,news:r.news,closed:r.closed});
 for(let i=0;i<count;i++){await command(i,{kind:'place',unit:'inf',cells:[{x:14,y:14}]});await command(i,{kind:'start'});}capture();
 const actor=r.host.config.players.findIndex(p=>p.id===r.host.activePlayerId),target=r.host.config.players.findIndex(p=>p.id===normalTarget(r.host.state,r.host.activePlayerId).playerId);await command(actor,{kind:'shoot',cell:{x:14,y:14}});
 assert.ok(count===2?r.host.status==='complete':r.host.state.ring.eliminated.includes(r.host.config.players[target].id));checks++;
 if(action==='timeout'){time+=180000;r.seats.forEach((s,i)=>{if(i!==target)s.seen=time;});await service.tick();}else await route(target,action==='permanent'?'leave':action,action==='permanent'?{permanent:true}:{});
 assert.equal(r.seats[target].statDeparture,undefined,`${count}/${workers}/${action}: no departure penalty`);assert.equal(r.seats[target].disconnects||0,0);assert.equal(r.seats[target].afkIncidents||0,0);checks+=3;
 for(let guard=0;r.host.status!=='complete';guard++){assert.ok(guard<10);const i=r.host.config.players.findIndex(p=>p.id===r.host.activePlayerId);await command(i,{kind:'shoot',cell:{x:14,y:14}});}
 const p=capture().participants[target];assert.equal(p.reliability,'Full');assert.equal(p.reliabilityOutcome,'FINISHED');assert.equal(p.outcome,'Loss');assert.equal(p.cutoff,undefined);checks+=4;
 }finally{await service.close();}
}
console.log(JSON.stringify({passed:true,checks,formats:[2,3,4],workers:true,eliminatedLeaveNoPenalty:true,timeoutAfterLossNoPenalty:true}));
