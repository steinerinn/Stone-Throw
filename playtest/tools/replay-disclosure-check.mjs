import assert from 'node:assert/strict';import {createHost,place} from '../canonical/compiled/host/initialization.js';import {refreshHost,observeRuleEvent} from '../canonical/compiled/host/refresh.js';import {startResolution,stepResolution} from '../canonical/compiled/combat/resolver.js';import {publicCheckpoint,buildReplay} from '../server/replay.mjs';import {createReplayCursor} from '../client-v13/replay-state.js';
let checks=0;
for(const n of [2,3,4]){
 const h=createHost({matchId:'public-replay',rulesVersion:'stone-throw-v1.427',size:15,story:false,seed:42,players:Array.from({length:n},(_,i)=>({id:'p'+i,boardId:'b'+i,roster:{inf:1,...(i===1?{castle:1}:{})},decisionMode:'interactive'}))});
 for(let i=0;i<n;i++)place(h,{unitId:'inf'+i,ownerId:'p'+i,boardId:'b'+i,type:'inf',cells:[{x:14,y:14}]});place(h,{unitId:'castle-secret',ownerId:'p1',boardId:'b1',type:'castle',cells:Array.from({length:5},(_,i)=>({x:2+i,y:2}))});h.status='awaiting-command';h.activePlayerId='p0';h.round=1;h.turnIndex=1;refreshHost(h);
 const checkpoints=[];const snapshot=()=>{const before=JSON.stringify(h),p=publicCheckpoint(h);assert.equal(JSON.stringify(h),before);checkpoints.push({cursor:h.events.length,value:p});return p.boards[1].cells;};assert.equal(snapshot().length,0);checks++;
 function hit(source,x){const meta={actorId:'p0',ownerId:'p0',targetPlayerId:'p1',targetBoardId:'b1',sourceUnitId:null,source,origin:{x,y:2}},ctx=startResolution(h.state,'root-'+x,'action-'+x,'p0',[{kind:'impact',meta,cell:{x,y:2},deferReactions:false}],h.rng,'comparison-only');while(ctx.status==='running')stepResolution(ctx);h.state=ctx.state;h.rng=ctx.rng;for(const e of ctx.events)observeRuleEvent(h,e);refreshHost(h);}
 hit('direct-human',2);assert.equal(snapshot().find(c=>c.x===2).kind,null);checks++;
 h.state.seats[0].scouted.push('3,2');assert.equal(snapshot().find(c=>c.x===2).kind,null);assert.equal(snapshot().some(c=>c.x===3),false);checks++;
 hit('plague',6);assert.ok(snapshot().every(c=>c.kind===null));checks++;
 hit('plague',5);const cells=snapshot();assert.equal(cells.find(c=>c.x===2).kind,null);assert.ok(cells.filter(c=>[5,6].includes(c.x)).every(c=>c.kind==='castle'));checks++;
 const d={id:'public-replay',configuration:h.config,build:'test',mode:'Duel',startedAt:1,endedAt:2,participants:h.config.players.map((p,seat)=>({actor:p.id,seat,kind:'account',displayName:'Player '+seat,reliability:'Full'}))},facts=h.events.map((f,index)=>({...f,index})),replay=buildReplay(d,facts,checkpoints),cursor=createReplayCursor(replay);
 assert.equal(JSON.stringify(replay).includes('castle-secret'),false);assert.equal(JSON.stringify(replay).includes('rng'),false);assert.deepEqual(cursor.seek(0).boards[1].cells,{});assert.equal(cursor.seek(cursor.length).boards[1].cells['6,2'].kind,'castle');checks++;
}
console.log(JSON.stringify({passed:true,checks,privateScoutExcluded:true,canonicalCastleGeometry:true,noFutureDisclosure:true,authorityUnchanged:true}));
