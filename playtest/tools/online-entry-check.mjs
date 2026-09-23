import assert from 'node:assert/strict';
import {createPvpService} from '../server/multiplayer.mjs';
import {roster} from '../server/main.mjs';
let now=100000;const service=createPvpService(roster,{seed:42,workers:false,now:()=>now});let checks=0;
const make=async(name,slots=['human','human','empty','empty'],visibility='public')=>{now+=10;return service.lobby('make',{name,slots,visibility},name);};
try{
 const a=await make('Old public'),privateRoom=await make('Private',['human','human','empty','empty'],'private'),b=await make('New public'),full=await make('Full');
 await service.lobby('join',{name:'Peer',code:full.update.lan.code},'peer');
 let list=service.list('observer');assert.deepEqual(list.map(x=>x.creator),['Old public','New public','Private','Full']);assert.equal(list.at(-1).full,true);assert.equal(list.at(-1).freeSlots,0);checks++;
 const p=list.find(x=>x.visibility==='private');assert.equal(p.code,undefined);await assert.rejects(service.lobby('join',{name:'Wrong',roomId:p.roomId,code:a.update.lan.code},'wrong'),/bad-game-code/);const joined=await service.lobby('join',{name:'Correct',roomId:p.roomId,code:privateRoom.update.lan.code},'correct');assert.equal(joined.update.lan.code,privateRoom.update.lan.code);const privateFull=service.list('observer').find(x=>x.roomId===p.roomId);assert.equal(privateFull.full,true);assert.equal(privateFull.visibility,'private');assert.equal(privateFull.code,undefined);checks++;
 for(const slots of [['human','ai','empty','empty'],['human','empty','empty','empty']])await assert.rejects(make('Invalid',slots),/invalid-configuration/);checks++;
 const three=await make('Three',['human','human','empty','ai']),four=await make('Four',['human','human','ai','ai']);assert.equal(a.update.lan.names.length,2);assert.equal(three.update.lan.names.length,3);assert.equal(four.update.lan.names.length,4);const ai=four.update.lan.names.slice(2);assert.equal(new Set(ai).size,2);assert.ok(ai.every(x=>['Cruns','Snurk','Rackler'].includes(x)));checks++;
 const identity={kind:'account',playerId:'immutable-id',displayName:'Current Name'};const registered=await service.lobby('make',{name:identity.displayName,identity,slots:['human','human','empty','empty']},'account');await assert.rejects(service.lobby('join',{name:'Changed Name',identity,code:registered.update.lan.code},'second-browser'),/already-seated/);checks++;
 const saved=service.exportState(),restored=createPvpService(roster,{seed:42,workers:false,now:()=>now});try{restored.restoreState(saved);assert.deepEqual(restored.list('observer'),service.list('observer'));}finally{await restored.close();}checks++;
 const room=service.rooms.get(a.update.lan.code),before=JSON.stringify(room.host);service.list('observer');assert.equal(JSON.stringify(room.host),before);checks++;
 now+=8000;assert.equal(service.list('observer').length,0);checks++;
 console.log('PASS '+checks+' Online entry service groups: ordering, private code, full rooms, restrictions, 2/3/4 seats, unique NPCs, account binding, restore and read-only listing.');
}finally{await service.close();}
