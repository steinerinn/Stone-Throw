import assert from 'node:assert/strict';
import {createHost,place} from '../canonical/compiled/host/initialization.js';
import {normalPolicy,emptyNormalMemory} from '../canonical/compiled/local-host/normal-policy.js';
let checks=0;
for(const plague of [false,true])for(const hits of [1,2])for(const type of ['inf','archer','monk','cav','castle'])for(let seed=1;seed<=20;seed++){
 const h=createHost({matchId:'hero-priority',rulesVersion:'stone-throw-v1.427',seed,size:15,story:false,players:[0,1].map(i=>({id:'p'+i,boardId:'b'+i,roster:{[type]:1,hero:1},decisionMode:'interactive'}))});
 place(h,{unitId:'core',ownerId:'p0',boardId:'b0',type,cells:type==='castle'?[{x:11,y:6},{x:11,y:7},{x:11,y:8},{x:10,y:8},{x:12,y:8}]:type==='cav'?[{x:11,y:6},{x:11,y:7}]:[{x:11,y:6}]});
 place(h,{unitId:'hero',ownerId:'p0',boardId:'b0',type:'hero',cells:[{x:3,y:3}]});
 const hero=h.state.match.units.find(u=>u.id==='hero');hero.hero.currentCell={x:12,y:7};hero.hero.activated=true;hero.hero.hitsTaken=hits;
 const p=h.state.seats[0],m=emptyNormalMemory();p.shots=Array.from({length:225},(_,i)=>`${i%15},${Math.floor(i/15)}`).filter(k=>!['11,6','12,7'].includes(k));
 m.scoutKnowledge=[['12,7','empty']];m.heroHunt=['12,7'];
 assert.equal(normalPolicy(h,m).target(plague),'11,6',JSON.stringify({plague,hits,type,seed}));checks++;
 // Once the other core dies, the relocated Hero may occupy a previously empty cell.
 p.shots.push('11,6');assert.equal(normalPolicy(h,m).target(plague),'12,7');checks++;
}
for(const plague of [false,true])for(let seed=1;seed<=20;seed++){
 const h=createHost({matchId:'hero-near-hits',rulesVersion:'stone-throw-v1.427',seed,size:15,story:false,players:[0,1].map(i=>({id:'p'+i,boardId:'b'+i,roster:{inf:1,hero:1},decisionMode:'interactive'}))});
 place(h,{unitId:'inf',ownerId:'p0',boardId:'b0',type:'inf',cells:[{x:11,y:6}]});
 place(h,{unitId:'hero',ownerId:'p0',boardId:'b0',type:'hero',cells:[{x:3,y:3}]});
 const hero=h.state.match.units.find(u=>u.id==='hero');hero.hero.currentCell={x:12,y:7};hero.hero.activated=true;hero.hero.hitsTaken=1;
 const p=h.state.seats[0],m=emptyNormalMemory();p.shots=Array.from({length:225},(_,i)=>`${i%15},${Math.floor(i/15)}`).filter(k=>!['12,7','0,0'].includes(k));m.knownHits=['11,6'];m.scoutKnowledge=[['12,7','empty']];
 assert.equal(normalPolicy(h,m).target(plague),'12,7');checks++;
 p.shots.push('12,7');assert.equal(normalPolicy(h,m).target(plague),'0,0');checks++;
}
console.log(JSON.stringify({passed:true,checks}));
