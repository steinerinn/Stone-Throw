import assert from 'node:assert/strict';
import {createHost,place} from '../canonical/compiled/host/initialization.js';
import {startResolution,stepResolution} from '../canonical/compiled/combat/resolver.js';
import {serializeResolution,deserializeResolution} from '../canonical/compiled/combat/serialization.js';
import {schedulePlague} from '../canonical/compiled/combat/units/necromancer.js';
import {protectedCells} from '../canonical/compiled/policy/auto-target.js';
import {commitEliminations} from '../canonical/compiled/host/ring.js';
import {syncDamage} from '../canonical/compiled/combat/access.js';
const h=createHost({matchId:'dual-plague',rulesVersion:'stone-throw-v1.427',size:15,story:false,seed:42,players:Array.from({length:4},(_,i)=>({id:'seat-'+i,boardId:'board-'+i,roster:{inf:1},decisionMode:'interactive'}))});
for(let i=0;i<4;i++)place(h,{unitId:'alive-'+i,ownerId:'seat-'+i,boardId:'board-'+i,type:'inf',cells:[{x:14,y:14}]});
for(const i of [0,2])h.state.seats[i].reactionTarget={playerId:'seat-1',boardId:'board-1'};
let c=startResolution(h.state,'create','create','seat-0',[],h.rng);schedulePlague(c,'seat-0',{x:3,y:3});const a=structuredClone(c.state.plagues[0]);schedulePlague(c,'seat-2',{x:10,y:10});assert.equal(c.state.plagues.length,2);assert.deepEqual(c.state.plagues[0],a);const ids=c.state.plagues.map(p=>p.outbreaks[0].statisticsId);assert.notEqual(...ids);
const initial=structuredClone(c.state),timeline=[];const both=protectedCells({...h,state:initial},'seat-1'),onlyA=protectedCells({...h,state:{...initial,plagues:[initial.plagues[0]]}},'seat-1'),onlyB=protectedCells({...h,state:{...initial,plagues:[initial.plagues[1]]}},'seat-1');assert.deepEqual([...both].sort(),[...new Set([...onlyA,...onlyB])].sort());let state=initial,rng=h.rng;
function step(state,rng,owner,id,serial,resume){let c=startResolution(state,'step-'+serial,'action-'+serial,owner,[{kind:'plague-step',targetBoardId:'board-1',plagueId:id}],rng);const t=performance.now();while(c.status==='running'){stepResolution(c,{deferTerminal:true});if(resume)c=deserializeResolution(serializeResolution(c));}return {state:c.state,rng:c.rng,events:c.events,ms:performance.now()-t};}
for(let round=1;round<=5;round++)for(const [index,owner]of ['seat-0','seat-2'].entries()){
 const other=structuredClone(state.plagues.find(p=>p.ownerId!==owner));const out=step(state,rng,owner,ids[index],round+'-'+index,false),resumed=step(state,rng,owner,ids[index],round+'-'+index,true);assert.deepEqual(resumed.state,out.state);assert.deepEqual(resumed.rng,out.rng);assert.deepEqual(out.state.plagues.find(p=>p.ownerId!==owner),other);
 const contacts=out.events.filter(e=>e.kind==='impact'&&e.meta?.source==='plague');assert.ok(contacts.length);for(const e of contacts){assert.equal(e.meta.ownerId,owner);assert.equal(e.statistics.plague.id,ids[index]);assert.equal(e.statistics.plague.step,round);assert.equal(e.statistics.rootActorId,owner);}
 timeline.push({round,id:ids[index],owner,cells:contacts.length,ms:out.ms,rngBefore:rng.cursor,rngAfter:out.rng.cursor});state=out.state;rng=out.rng;
}
assert.equal(state.plagues.length,0);
// Same owner/board also progresses both independently from one legacy-compatible boundary operation.
let same=structuredClone(initial);same.plagues[1].ownerId='seat-0';same.plagues[1].moveOnPlayerId='seat-0';c=startResolution(same,'same-owner','same-owner','seat-0',[{kind:'plague-step',targetBoardId:'board-1'}],h.rng);while(c.status==='running')stepResolution(c,{deferTerminal:true});assert.deepEqual(c.state.plagues.map(p=>p.outbreaks[0].round),[1,1]);
// Source loss retargets scheduling without cancelling either identity. Target loss clears both.
let host={...h,state:structuredClone(initial)};host.state.seats[0].shots.push('14,14');syncDamage(host.state,host.state.match.units.find(u=>u.id==='alive-0'));commitEliminations(host);assert.equal(host.state.plagues.length,2);assert.equal(host.state.plagues[0].moveOnPlayerId,'seat-1');assert.equal(host.state.plagues[1].moveOnPlayerId,'seat-2');host.state.seats[1].shots.push('14,14');syncDamage(host.state,host.state.match.units.find(u=>u.id==='alive-1'));commitEliminations(host);assert.equal(host.state.plagues.length,0);
console.log(JSON.stringify({passed:true,checks:15,ids,timeline},null,2));
