import assert from 'node:assert/strict';import {createRingService} from '../server/ring-pvp.mjs';import {roster as full} from '../server/main.mjs';
const roster={...full};let checks=0;
for(const count of [3,4]){
 const service=createRingService(roster,{seed:42,workers:false,now:()=>100000});
 try{const npcNames=['Cruns','Snurk','Rackler'].slice(0,count-1),local=service.localSession({identity:{displayName:'Tester'},npcNames}),online=await service.lobby('make',{name:'Tester',seats:count,controllers:['human',...Array(count-1).fill('ai')]},'test');
 const host=()=>service.rooms.get(online.update.lan.code).host,localHost=async()=>{const cp=JSON.parse(await local.serializePrivate());return cp.battle.host;};
 const parity=async()=>{const {serializeHost}=await import('../canonical/compiled/host/serialization.js');assert.equal(await localHost(),serializeHost(host()));};await parity();checks++;
 const command=async intent=>{const l=await local.client.read(),o=await service.route(online.token,'test','read');const req=s=>({contract:s.contract,battle:s.battle,revision:s.revision,intent});const a=await local.client.dispatch(req(l.snapshot)),b=await service.route(online.token,'test','command',req(o.snapshot));assert.equal(a.accepted,b.accepted);assert.equal(a.accepted,true,JSON.stringify(a.error));assert.equal(a.lan,undefined);await parity();return a;};
 await command({kind:'random-placement'});let u=await command({kind:'start'});checks++;
 for(let i=0;i<4&&u.snapshot.phase!=='finished'&&!u.snapshot.choice;i++)u=await command({kind:'shoot',cell:{x:i,y:14}});checks++;
 const cp=await local.serializePrivate(),restored=service.localSession({npcNames},cp);assert.equal(await localHost(),JSON.parse(await restored.serializePrivate()).battle.host);assert.deepEqual(restored.participants.map(s=>s.npc),local.participants.map(s=>s.npc));checks++;
 await local.configure();const rematch=await local.client.read();assert.equal(rematch.snapshot.phase,'placement');assert.equal(rematch.localGroup.names.length,count);assert.deepEqual(local.participants.slice(1).map(s=>s.npc),npcNames);assert.equal(service.rooms.size,1);checks++;
 }finally{await service.close();}
}
console.log('PASS '+checks+' local Group authority groups: exact canonical host/RNG parity through placement/start/shots, private restore, same-count/identity rematch, no local room registration.');
