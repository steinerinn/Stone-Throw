import assert from 'node:assert/strict';
import {createHost,place} from '../canonical/compiled/host/initialization.js';
import {startResolution,runResolution,stepResolution} from '../canonical/compiled/combat/resolver.js';
import {answerDecision} from '../canonical/compiled/combat/decisions.js';
import {serializeResolution,deserializeResolution} from '../canonical/compiled/combat/serialization.js';
let checks=0;const tested=[];
for(const n of [2,3,4])for(const kind of ['dragon','demon','wizard','archer','goblin','catapult']){
 let covered=0;
 for(let seed=1;seed<=10;seed++){
 const h=createHost({matchId:'hero-chain',rulesVersion:'stone-throw-pacing-v1',size:9,story:false,seed,players:Array.from({length:n},(_,i)=>({id:'p'+i,boardId:'b'+i,roster:{inf:1,hero:1},decisionMode:'interactive'}))});
 for(let i=0;i<n;i++)place(h,{unitId:'core'+i,ownerId:'p'+i,boardId:'b'+i,type:'inf',cells:[{x:8,y:7}]});
 place(h,{unitId:'hero',ownerId:'p1',boardId:'b1',type:'hero',cells:[{x:1,y:1}]});
 const meta=(source,origin)=>({actorId:'p0',ownerId:'p0',targetPlayerId:'p1',targetBoardId:'b1',sourceUnitId:null,source,origin});
 const second=kind==='catapult'?{kind:'catapult',meta:meta('catapult-shot',{x:4,y:3}),cell:{x:6,y:3},impact:4,generated:[]}:{kind:'wave',entries:[{kind,meta:meta(kind==='demon'?'demon-blast':kind,{x:4,y:3})}],terminalCheck:false};
 let ctx=startResolution(h.state,'root','command','p0',[{kind:'wave',entries:[{kind:'dragon',meta:meta('dragon',{x:0,y:0})}],terminalCheck:false},second],h.rng,'boundary-comparison');
 runResolution(ctx);assert.equal(ctx.status,'awaiting-decision');const d=ctx.decisions.find(d=>d.status==='pending');assert.equal(d.kind,'hero-relocation');assert.equal(ctx.state.match.units.find(u=>u.id==='hero').hero.hitsTaken,1);
 const saved=serializeResolution(ctx),probe=deserializeResolution(saved);answerDecision(probe,{actorId:'p1',decisionId:d.id,cell:d.legalCells[0],unitId:null});
 let announcement=kind==='catapult'?{statistics:{plannedCells:[{x:6,y:3}]}}:null;for(let guard=0;guard<500&&!announcement&&probe.status==='running';guard++){stepResolution(probe);announcement=probe.events.find(e=>e.kind==='attack-started'&&e.reason===kind&&e.meta.origin.x===4);if(announcement)break;}
 assert.ok(announcement);const destination=announcement.statistics.plannedCells.find(c=>d.legalCells.some(q=>q.x===c.x&&q.y===c.y));if(!destination)continue;
 ctx=deserializeResolution(saved);answerDecision(ctx,{actorId:'p1',decisionId:d.id,cell:destination,unitId:null});runResolution(ctx);
 const hero=ctx.state.match.units.find(u=>u.id==='hero');assert.equal(hero.hero.hitsTaken,2,`${n} seats ${kind} after relocation`);assert.ok(ctx.events.some(e=>e.kind==='impact'&&e.unitId==='hero'&&e.meta.source===(kind==='demon'?'demon-blast':kind==='catapult'?'catapult-shot':kind)&&e.cells.some(c=>c.x===destination.x&&c.y===destination.y)));
 assert.equal(deserializeResolution(serializeResolution(ctx)).state.match.units.find(u=>u.id==='hero').hero.hitsTaken,2);covered++;checks+=5;
 }
 assert.ok(covered,kind+' needs actual post-move hit coverage');tested.push({seats:n,attack:kind,seeds:covered});
}
console.log(JSON.stringify({passed:true,checks,tested,sameRoot:true,restoredBeforeAndAfterMove:true}));
