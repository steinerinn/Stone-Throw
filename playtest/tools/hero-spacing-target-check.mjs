import assert from 'node:assert/strict';
import {createHost,place} from '../canonical/compiled/host/initialization.js';
import {normalPolicy,emptyNormalMemory} from '../canonical/compiled/local-host/normal-policy.js';
let checks=0;
for(const plague of [false,true])for(const historical of [false,true])for(const scouted of [false,true]){
 const h=createHost({matchId:'hero-spacing',rulesVersion:'stone-throw-v1.427',seed:42,size:15,story:false,players:[0,1].map(i=>({id:'p'+i,boardId:'b'+i,roster:{inf:1,hero:1},decisionMode:'interactive'}))});
 place(h,{unitId:'inf',ownerId:'p0',boardId:'b0',type:'inf',cells:[{x:11,y:6}]});
 place(h,{unitId:'hero',ownerId:'p0',boardId:'b0',type:'hero',cells:[{x:3,y:3}]});
 const hero=h.state.match.units.find(u=>u.id==='hero');if(!historical)hero.cells=[{x:12,y:7}];hero.hero.currentCell=null;hero.hero.activated=true;hero.hero.hitsTaken=3;hero.lifecycle='destroyed';
 if(historical)h.events.push({event:{kind:'impact',unitId:'hero',cells:[{x:12,y:7}]}});
 h.state.seats[0].shots=Array.from({length:225},(_,i)=>`${i%15},${Math.floor(i/15)}`).filter(k=>k!=='11,6');
 const m=emptyNormalMemory();m.knownHits=['12,7'];if(scouted)m.scoutKnowledge=[['12,7','special']];
 assert.equal(normalPolicy(h,m).target(plague),'11,6',JSON.stringify({plague,historical,scouted}));checks++;
 // Ordinary stationary unit hits still forbid adjacent cells.
 hero.cells=[{x:3,y:3}];h.events=[];m.scoutKnowledge=[];
 assert.equal(normalPolicy(h,m).target(plague),null);checks++;
}
console.log(JSON.stringify({passed:true,checks,ordinaryAndPlagueTargeting:true,currentAndHistoricalHeroCells:true}));
