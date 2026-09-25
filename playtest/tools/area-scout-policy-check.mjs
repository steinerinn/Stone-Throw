import assert from 'node:assert/strict';
import {createHost} from '../canonical/compiled/host/initialization.js';
import {areaScoutChoice} from '../canonical/compiled/policy/area-scout.js';
let checks=0;
const cells=Array.from({length:225},(_,i)=>({x:i%15,y:Math.floor(i/15)})),key=c=>c.x+','+c.y;
for(const n of [2,3,4]){
 const h=createHost({matchId:'area-policy',rulesVersion:'stone-throw-pacing-v1',size:15,story:false,seed:42,players:Array.from({length:n},(_,i)=>({id:'p'+i,boardId:'b'+i,roster:{inf:1},decisionMode:'interactive'}))});
 const unknown=c=>c.x>=8&&c.x<=10&&c.y>=8&&c.y<=10;
 const explored=cells.filter(c=>!unknown(c)).map(key),shots=explored.filter((_,i)=>i%2===0),scouted=explored.filter((_,i)=>i%2!==0);
 h.state.seats[1].shots=shots;
 if(n===2)h.state.seats[0].scouted=scouted;else h.state.ring.knowledge['p0:p1']={scouted,monkCandidates:[]};
 assert.deepEqual(areaScoutChoice(h,'p0','b1',cells),{x:9,y:9});checks++;
 const saved=structuredClone(h);h.state.match.units=[];assert.deepEqual(areaScoutChoice(h,'p0','b1',cells),areaScoutChoice(saved,'p0','b1',cells));checks++;
 if(n>2){h.state.ring.knowledge['p2:p1']={scouted:cells.map(key),monkCandidates:[]};h.state.ring.knowledge['p0:p2']={scouted:cells.map(key),monkCandidates:[]};assert.deepEqual(areaScoutChoice(h,'p0','b1',cells),{x:9,y:9});checks++;}
 assert.equal(areaScoutChoice(h,'p0','b1',[]),null);checks++;
 // Restrictions on legal centers must be respected even when the best center is unavailable.
 const restricted=[{x:0,y:0},{x:8,y:9}];assert.deepEqual(areaScoutChoice(h,'p0','b1',restricted),restricted[1]);checks++;
 h.state.seats[1].shots=[];if(n===2)h.state.seats[0].scouted=[];else h.state.ring.knowledge['p0:p1'].scouted=[];
 for(let i=0;i<20;i++){const clone=structuredClone(h),chosen=areaScoutChoice(h,'p0','b1',cells);assert.ok(chosen.x>0&&chosen.x<14&&chosen.y>0&&chosen.y<14);assert.deepEqual(areaScoutChoice(clone,'p0','b1',cells),chosen);checks++;}
 h.state.seats[1].shots=cells.map(key);assert.ok(cells.some(c=>key(c)===key(areaScoutChoice(h,'p0','b1',cells))));checks++;
}
console.log(JSON.stringify({passed:true,checks}));
