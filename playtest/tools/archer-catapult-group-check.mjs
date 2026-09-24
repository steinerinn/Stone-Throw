import assert from 'node:assert/strict';import {createRingService} from '../server/ring-pvp.mjs';
for(const workers of [false,true])for(const seats of [3,4])for(const wanted of [0,seats-1]){let plan=null;for(let pass=0;pass<2;pass++){
const service=createRingService({inf:1,archer:1,catapult:1},{seed:42,now:()=>100000,workers});try{const made=await service.lobby('make',{name:'P0',seats,controllers:Array(seats).fill('human')},'b0'),code=made.update.lan.code,tokens=[made.token];for(let i=1;i<seats;i++)tokens.push((await service.lobby('join',{name:'P'+i,code},'b'+i)).token);
const room=()=>service.rooms.get(code),read=i=>service.route(tokens[i],'b'+i,'read',{}),act=async(i,intent)=>{const {snapshot:s}=await read(i);return service.route(tokens[i],'b'+i,'command',{contract:s.contract,battle:s.battle,revision:s.revision,intent});};
// Probe the real seeded volley, then place one legal Catapult on its first contact.
for(let i=0;i<seats;i++){for(const [unit,c]of [['inf',[14,14]],['archer',!plan||i===plan.target?[5,5]:[0,0]],['catapult',plan&&i===plan.actor?[plan.cell.x,plan.cell.y]:[12,12]]])assert.equal((await act(i,{kind:'place',unit,cells:[{x:c[0],y:c[1]}]})).accepted,true);await act(i,{kind:'start'});}
for(let n=0;room().host.activePlayerId!=='seat-'+wanted;n++){assert.ok(n<16);const i=Number(room().host.activePlayerId.split('-')[1]);assert.equal((await act(i,{kind:'shoot',cell:{x:n,y:10}})).accepted,true);}
const h=room().host,actor=h.config.players.findIndex(p=>p.id===h.activePlayerId);if(!plan){const u=await act(actor,{kind:'shoot',cell:{x:5,y:5}}),attack=room().host.events.find(r=>r.event.kind==='attack-started'&&r.event.reason==='archer').event;assert.ok(attack.statistics.plannedCells.length);plan={actor,target:Number(attack.meta.ownerId.split('-')[1]),cell:attack.statistics.plannedCells[0]};continue;}
const u=await act(actor,{kind:'shoot',cell:{x:5,y:5}});assert.equal(u.snapshot.choice?.kind,'catapult-target');const root=room().host.pendingRoot.id,turn=room().host.turnIndex,rngBefore=structuredClone(room().host.rng);for(let i=0;i<10;i++){assert.equal((await read(actor)).snapshot.choice?.kind,'catapult-target');await service.route(tokens[actor],'b'+actor,'heartbeat',{});}
assert.equal((await act(actor,{kind:'shoot',cell:{x:10,y:10}})).accepted,false);assert.equal(room().host.turnIndex,turn);assert.deepEqual(room().host.rng,rngBefore);assert.equal(room().host.pendingRoot.id,root);assert.equal(room().host.events.filter(r=>r.event.kind==='benefit-scheduled'&&r.event.reason==='archer-ordinary-shot-quirk').length,0);
const saved=service.exportState();const restored=createRingService({inf:1,archer:1,catapult:1},{seed:42,now:()=>100000,workers:false});try{restored.restoreState(saved);const recovered=await restored.route(tokens[actor],'b'+actor,'read',{});assert.equal(recovered.snapshot.choice?.kind,'catapult-target');assert.equal(restored.rooms.get(code).host.pendingRoot.id,root);}finally{await restored.close();}
const current=await read(actor),answer=await act(actor,{kind:'answer',choice:current.snapshot.choice.handle,cell:{x:0,y:10},unit:null});assert.equal(answer.accepted,true);const contacts=room().host.events.filter(r=>r.event.kind==='impact'&&r.event.meta?.source==='catapult-shot');assert.equal(contacts.length,5);assert.ok(contacts.every(r=>r.event.rootId===root));console.log(JSON.stringify({passed:true,workers,seats,actor,pendingSurvivesPolls:true,ordinaryShotRejectedWhilePending:true,turnCannotAdvance:true,contacts:5}));
}finally{await service.close();}}}

// All accepted hit sources share the Catapult rule, in Duel and Group authority.
const {createHost,place}=await import('../canonical/compiled/host/initialization.js');
const {startResolution}=await import('../canonical/compiled/combat/resolver.js');
const {pumpHost,acceptCommand}=await import('../canonical/compiled/host/lifecycle.js');
const {serializeHost,deserializeHost}=await import('../canonical/compiled/host/serialization.js');
const {normalTarget}=await import('../canonical/compiled/host/ring.js');
const sources=['direct-human','direct-ai','chain','archer','monk-deflect','catapult-shot','goblin','dragon','demon-blast','wizard','plague'];let ruleChecks=0;
for(const n of [2,3,4])for(const ownTurn of [true,false])for(const source of sources){
 let h=createHost({matchId:'catapult-rule',rulesVersion:'stone-throw-v1.427',size:15,story:false,seed:42,players:Array.from({length:n},(_,i)=>({id:'p'+i,boardId:'b'+i,roster:{inf:1,...(i===1?{catapult:1}:{})},decisionMode:'interactive'}))});
 for(let i=0;i<n;i++)place(h,{unitId:'inf'+i,ownerId:'p'+i,boardId:'b'+i,type:'inf',cells:[{x:14,y:14}]});
 place(h,{unitId:'cat',ownerId:'p1',boardId:'b1',type:'catapult',cells:[{x:5,y:5}]});
 const actor=ownTurn?'p1':'p0';h.activePlayerId=actor;h.starterId='p0';h.round=1;h.turnIndex=1;h.turnStep='actions';h.state.seats.find(p=>p.playerId===actor).ordinaryShots=1;
 const meta={actorId:'p0',ownerId:'p0',targetPlayerId:'p1',targetBoardId:'b1',sourceUnitId:null,source,origin:{x:5,y:5}};
 const hit={kind:'impact',meta,cell:{x:5,y:5},deferReactions:false};
 h.pendingRoot=startResolution(h.state,'hit-root','hit-action',actor,[hit,...(source==='plague'?[]:[hit]),{kind:'same-turn-effects'}],h.rng,'boundary-comparison');h.rootPurpose='shot';h.rootSerial=1;h.status='running';pumpHost(h);
 const owner=()=>h.state.seats[1];assert.equal(owner().nextShots,2,'never ordinary bonus: '+source);
 assert.equal(h.events.filter(r=>r.event.kind==='benefit-scheduled'&&r.event.reason==='catapult').length,source==='plague'?0:1,'one benefit per new hit');
 if(source==='plague'){assert.equal(owner().catapultLater,0);assert.notEqual(h.status,'awaiting-decision');ruleChecks++;continue;}
 if(!ownTurn){assert.equal(owner().catapultLater,1);assert.notEqual(h.status,'awaiting-decision');h=deserializeHost(serializeHost(h));assert.equal(owner().catapultLater,1);}
 let serial=0;while(h.status!=='awaiting-decision'){
  assert.ok(serial++<20);if(h.status==='awaiting-turn')h=acceptCommand(h,{id:'advance'+serial,kind:'advance-turn'});
  else{const target=normalTarget(h.state,h.activePlayerId),cell=Array.from({length:14},(_,x)=>({x,y:0})).find(c=>!target.shots.includes(c.x+',0'));h=acceptCommand(h,{id:'miss'+serial,kind:'shoot',actorId:h.activePlayerId,boardId:target.boardId,cell});}
 }
 let d=h.pendingRoot.decisions.find(d=>d.status==='pending');assert.equal(d.kind,'catapult-target');assert.equal(d.actorId,'p1');
 h=deserializeHost(serializeHost(h));d=h.pendingRoot.decisions.find(d=>d.status==='pending');
 h=acceptCommand(h,{id:'cat-answer',kind:'answer',answer:{actorId:'p1',decisionId:d.id,cell:{x:0,y:10},unitId:null}});
 assert.notEqual(h.status,'awaiting-decision');assert.equal(owner().catapultLater,0);assert.equal(owner().catapultNow,0);
 assert.equal(h.events.filter(r=>r.event.kind==='decision-required'&&r.event.reason==='catapult-target').length,1);
 assert.equal(h.events.filter(r=>r.event.kind==='impact'&&r.event.meta?.source==='catapult-shot'&&r.event.meta.ownerId==='p1').length,5);ruleChecks++;
}
console.log(JSON.stringify({passed:true,sourceIndependentCatapultCases:ruleChecks,duplicateHitsIgnored:true,offTurnRestoreAndTurnTransition:true}));
