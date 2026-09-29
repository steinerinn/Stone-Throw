import assert from 'node:assert/strict';import {createPvpService} from '../server/multiplayer.mjs';import {prepareStatistics} from '../server/statistics-capture.mjs';import {finalReliability} from '../server/reliability-outcome.mjs';
let checks=0;
for(const count of [2,3,4])for(const workers of count===2?[false]:[false,true])for(const earlierPenalty of [false,true]){
 const service=createPvpService({inf:2},{seed:42,workers,now:()=>1000});try{
 const clients=[await service.lobby('make',{name:'P0',seats:count,controllers:Array(count).fill('human'),identity:{kind:'account',playerId:'p0'}},'b0')],code=clients[0].update.lan.code;
 for(let i=1;i<count;i++)clients.push(await service.lobby('join',{code,name:'P'+i,identity:{kind:'account',playerId:'p'+i}},'b'+i));
 const route=(i,a,b={})=>service.route(clients[i].token,'b'+i,a,b);
 for(let i=0;i<count;i++)for(const intent of [{kind:'place',unit:'inf',cells:[{x:14,y:14}]},{kind:'place',unit:'inf',cells:[{x:12,y:14}]},{kind:'start'}]){const u=await route(i,'read');await route(i,'command',{contract:u.snapshot.contract,battle:u.snapshot.battle,revision:u.snapshot.revision,intent});}
 let r=service.rooms.get(code);const capture=()=>prepareStatistics(r,r.host,r.epoch,{mode:count===2?'Duel':count+' Players',build:'test',now:()=>1000,participants:r.seats,news:r.news,closed:r.closed});capture();
 // Other players explicitly leave into the existing reconnect grace period.
 for(let i=1;i<count;i++){await route(i,'leave');r=service.rooms.get(code);assert.ok(r.seats[i].absence);assert.equal(r.closed,false);checks++;}
 if(earlierPenalty)r.seats[0].disconnects=2;
 const out=await route(0,'leave',{permanent:true});r=service.rooms.get(code);assert.equal(out.mainMenu,true);assert.equal(r.closed,true);const d=capture();assert.equal(d.participants[0].reliabilityOutcome,earlierPenalty?'DISCONNECTED':'EXEMPT');assert.equal(d.participants[0].reliabilityFacts.departureExemption,'no-human-opponents');assert.notEqual(d.participants[0].reliability,'Full');checks+=5;
 }finally{await service.close();}
}
assert.equal(finalReliability({incidents:2,incidentExempt:true}),'AFK');checks++;
console.log(JSON.stringify({passed:true,checks,formats:[2,3,4],workerParity:true,priorPenaltiesPreserved:true}));
