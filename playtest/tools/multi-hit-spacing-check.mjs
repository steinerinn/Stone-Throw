import assert from 'node:assert/strict';
import {createHost,place} from '../canonical/compiled/host/initialization.js';
import {normalPolicy,emptyNormalMemory} from '../canonical/compiled/local-host/normal-policy.js';
let checks=0;
for(const story of [false,true])for(const plague of [false,true])for(const type of ['cav','castle'])for(const blocker of ['inf','cav','castle'])for(const seed of Array.from({length:64},(_,i)=>i+1)){
 const h=createHost({matchId:'spacing',rulesVersion:'stone-throw-v1.427',seed,size:15,story,players:[0,1].map(i=>({id:'p'+i,boardId:'b'+i,roster:{[type]:1,...{[blocker]:blocker===type?2:1}},decisionMode:'interactive'}))});
 const cells=type==='cav'?[[5,5],[5,6]]:[[5,5],[5,6],[4,6],[4,7],[5,7]];
 place(h,{unitId:'target',ownerId:'p0',boardId:'b0',type,cells:cells.map(([x,y])=>({x,y}))});
 // (6,5) touches the destroyed infantry diagonally but is beside the partial target.
 place(h,{unitId:'dead',ownerId:'p0',boardId:'b0',type:blocker,cells:(blocker==='inf'?[[7,4]]:blocker==='cav'?[[7,4],[8,4]]:[[7,4],[8,4],[9,4],[7,3],[8,3]]).map(([x,y])=>({x,y}))});
 const dead=h.state.match.units.find(u=>u.id==='dead').cells.map(c=>c.x+','+c.y);h.state.seats[0].shots=['5,5',...dead];
 const m=emptyNormalMemory();m.knownHits=['5,5',...dead];
 const selected=normalPolicy(h,m).target(plague);
 assert.notEqual(selected,'6,5');assert.ok(['4,5','5,4','5,6'].includes(selected),selected);checks+=2;
 // Without knowledge of that destroyed unit, AI must not infer its hidden boundary.
 m.knownHits=['5,5'];m.scoutKnowledge=[['4,5','empty'],['5,4','empty'],['5,6','empty']];h.state.seats[0].shots=['5,5'];
 assert.equal(normalPolicy(h,m).target(plague),'6,5');checks++;
}
for(const exempt of ['hero','assassin'])for(const plague of [false,true]){
 const h=createHost({matchId:'exempt',rulesVersion:'stone-throw-v1.427',seed:42,size:15,story:false,players:[0,1].map(i=>({id:'p'+i,boardId:'b'+i,roster:{cav:1,[exempt]:1},decisionMode:'interactive'}))});
 place(h,{unitId:'target',ownerId:'p0',boardId:'b0',type:'cav',cells:[{x:5,y:5},{x:6,y:5}]});
 place(h,{unitId:'exempt',ownerId:'p0',boardId:'b0',type:exempt,cells:[{x:10,y:10}]});
 const unit=h.state.match.units.find(u=>u.id==='exempt');unit.cells=[{x:7,y:4}];if(unit.hero){unit.hero.currentCell=null;unit.hero.hitsTaken=3;unit.hero.activated=true;}
 h.state.seats[0].shots=['5,5','7,4','4,5','5,4','5,6'];const m=emptyNormalMemory();m.knownHits=['5,5','7,4'];m.scoutKnowledge=[['7,4','special']];
 assert.equal(normalPolicy(h,m).target(plague),'6,5');checks++;
}
console.log(JSON.stringify({passed:true,checks,localStoryAndSharedOnlinePolicy:true}));

