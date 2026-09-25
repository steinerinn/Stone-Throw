import assert from 'node:assert/strict';
import {installStoryPolicy} from '../client-v13/story-policy.js';
import {createHost,place} from '../canonical/compiled/host/initialization.js';
import {createPrivateReplay,recordReplayStep,replayPrivate} from '../canonical/compiled/host/replay.js';
import {acceptCommand,pumpHost} from '../canonical/compiled/host/lifecycle.js';
import {serializeHost,deserializeHost} from '../canonical/compiled/host/serialization.js';
import {startResolution,stepResolution} from '../canonical/compiled/combat/resolver.js';
import {serializeResolution,deserializeResolution} from '../canonical/compiled/combat/serialization.js';
import {answerDecision} from '../canonical/compiled/combat/decisions.js';
import {goblinTargets} from '../canonical/compiled/combat/units/goblin.js';
import {createRuleRng} from '../canonical/compiled/combat/rng.js';
import {beginChaosBoundary,settleChaos} from '../canonical/compiled/host/chaos.js';
import {syncRing} from '../canonical/compiled/host/ring.js';
import {tacticalScoreFacts} from '../server/score-tactics.mjs';
import {legacyRandomPlacement} from '../canonical/compiled/policy/placement-legacy.js';
let checks=0;
function host(n=4,roster={inf:1,elf:2,demon:1},version='stone-throw-pacing-v1'){
 const h=createHost({matchId:'pacing-check',rulesVersion:version,size:15,story:false,seed:42,players:Array.from({length:n},(_,i)=>({id:'p'+i,boardId:'b'+i,roster,decisionMode:'interactive'}))});
 for(let i=0;i<n;i++)for(const [type,count] of Object.entries(roster))for(let j=0;j<count;j++)place(h,{unitId:type+i+'x'+j,ownerId:'p'+i,boardId:'b'+i,type,cells:[{x:type==='inf'?14:type==='elf'?3+j*2:0,y:type==='inf'?14:type==='elf'?3:0}]});
 h.activePlayerId='p0';h.starterId='p0';h.status='awaiting-command';h.turnStep='actions';h.round=1;h.turnIndex=1;h.state.seats[0].ordinaryShots=2;if(h.state.ring)syncRing(h.state);return h;
}
const meta=(source='direct-human',target=1)=>({actorId:'p0',ownerId:'p0',targetPlayerId:'p'+target,targetBoardId:'b'+target,sourceUnitId:null,source,origin:{x:0,y:0}});
function resolve(h,ops){let r=startResolution(h.state,'test-root','test','p0',ops,h.rng,'boundary-comparison'),steps=0;while(r.status==='running'){assert.ok(++steps<10000);stepResolution(r);r=deserializeResolution(serializeResolution(r));}return r;}
// Bomb count follows remaining targets, never a random count roll.
for(const [remaining,count] of [[0,0],[2,2],[5,5],[30,5],[75,5],[76,6],[100,7],[150,10],[200,14],[225,15],[300,15]]){
 const available=Array.from({length:remaining},(_,i)=>i+',0');
 for(const seed of [1,42,987]){const rng=createRuleRng(seed),result=goblinTargets(available,rng,true);assert.equal(result.length,count);assert.equal(new Set(result).size,count);assert.ok(result.every(c=>available.includes(c)));assert.deepEqual(result,goblinTargets(available,createRuleRng(seed),true));assert.ok(rng.draws.every(d=>d.purpose==='goblin-shuffle'));}
 assert.equal(goblinTargets(available,createRuleRng(1),false).length,Math.min(remaining,Math.max(5,Math.ceil(remaining*0.044))));checks++;
}
for(const n of [2,3,4]){
 const h=host(n);assert.deepEqual(h.state.match.units.filter(u=>u.ownerId==='p0'&&u.type==='elf').map(u=>u.scoutMode),[undefined,undefined]);assert.equal(serializeHost(deserializeHost(serializeHost(h))),serializeHost(h));
 for(const xs of [[5,3],[3,5]]){const first=resolve(h,[{kind:'impact',meta:meta('archer'),cell:{x:xs[0],y:3},deferReactions:false}]);assert.equal(first.state.seats[1].spyLater,5);assert.equal(first.state.seats[1].areaScoutLater,undefined);const saved=deserializeHost(serializeHost({...h,state:first.state}));const second=resolve(saved,[{kind:'impact',meta:meta('archer'),cell:{x:xs[1],y:3},deferReactions:false}]);assert.equal(second.state.seats[1].areaScoutLater,1);assert.equal(second.state.seats[1].scoutHitCount,2);assert.equal(second.events.filter(e=>e.reason==='area-scout').length,1);checks++;}
 for(const [cell,count] of [[{x:4,y:3},9],[{x:0,y:3},6],[{x:0,y:0},4]]){
  const r=resolve(h,[{kind:'turn-scout',ownerId:'p0',count:1,area:true}]),d=r.decisions.at(-1);assert.equal(d.remaining,1);assert.equal(d.area,true);const shots=r.state.seats.map(p=>[...p.shots]);answerDecision(r,{decisionId:d.id,actorId:d.actorId,cell,unitId:null});assert.equal(d.status,'answered');const events=r.events.filter(e=>e.kind==='scouted');assert.equal(events.length,1);assert.equal(events[0].cells.length,count);assert.deepEqual(r.state.seats.map(p=>p.shots),shots);assert.equal(r.events.filter(e=>e.kind==='impact'||e.kind==='reaction-generated').length,0);deserializeResolution(serializeResolution(r));
  const facts=events.map((event,index)=>({event,index,eventId:'scan'+index})),score=tacticalScoreFacts({participants:[{actor:'p0',kind:'player'}]},facts);assert.equal(score.p0.scouts,cell.x===4||cell.y===0?1:0);assert.equal(tacticalScoreFacts({participants:[{actor:'p0',kind:'player'}]},[...facts,...facts]).p0.scouts,score.p0.scouts);checks++;
 }
 const r=resolve(h,[{kind:'turn-scout',ownerId:'p0',count:5}]);assert.equal(r.decisions.at(-1).remaining,5);assert.equal(r.decisions.at(-1).area,undefined);checks++;
}
for(const profile of ['first-seat','second-seat'])for(const size of [10,15]){const roster=size===10?{inf:2,elf:2}:{inf:5,cav:3,archer:3,monk:1,castle:2,dwarf:1,goblin:1,catapult:2,elf:2,cleric:1,demon:1,dragon:1,wizard:1,necro:2,hero:1};const proposals=legacyRandomPlacement(profile,size,roster,createRuleRng(42),size===10);assert.equal(proposals.filter(u=>u.type==='elf').length,2);const h=createHost({matchId:'random-elves',rulesVersion:'stone-throw-pacing-v1',size,story:false,seed:42,players:[{id:'p0',boardId:'b0',roster,decisionMode:'interactive'},{id:'p1',boardId:'b1',roster,decisionMode:'interactive'}]});proposals.forEach((u,i)=>place(h,{unitId:'u'+i,ownerId:'p0',boardId:'b0',type:u.type,cells:u.cells.map(k=>{const [x,y]=k.split(',').map(Number);return {x,y};})}));assert.deepEqual(h.state.match.units.filter(u=>u.type==='elf').map(u=>u.scoutMode),[undefined,undefined]);checks++;}
// Goblin restore at every resolver step reproduces uninterrupted state/events/RNG.
{const h=host(4,{inf:1}),ops=[{kind:'attack',entry:{kind:'goblin',meta:meta('goblin')}}],restored=resolve(h,ops),straight=startResolution(h.state,'test-root','test','p0',ops,h.rng,'boundary-comparison');while(straight.status==='running')stepResolution(straight);assert.equal(serializeResolution(restored),serializeResolution(straight));checks++;}
// Both benefits in one owner turn: five precision answers, then one area answer.
{let h=host(4);h.state.seats[0].spyLater=5;h.state.seats[0].areaScoutLater=1;h.status='running';h.turnStep='scout';pumpHost(h);let count=0;while(h.status==='awaiting-decision'){h=deserializeHost(serializeHost(h));const d=h.pendingRoot.decisions.find(d=>d.status==='pending');assert.equal(!!d.area,count>=5);h=acceptCommand(h,{id:'answer'+count++,kind:'answer',answer:{decisionId:d.id,actorId:d.actorId,cell:d.legalCells[0],unitId:null}});}assert.equal(count,6);assert.equal(h.state.seats[0].areaScoutLater,0);assert.equal(h.state.seats[0].spyLater,0);assert.equal(h.state.ring.knowledge['p0:p1'].scouted.length>0,true);assert.equal(h.state.ring.knowledge['p2:p1'],undefined);checks++;}
for(const source of ['direct-human','archer','wizard','plague']){const h=host(4),r=resolve(h,[{kind:'impact',meta:meta(source),cell:{x:5,y:3},deferReactions:false}]);assert.equal(r.state.seats[1].areaScoutLater||0,0);assert.equal(r.state.seats[1].spyLater,source==='plague'?0:5);assert.equal(r.state.seats[1].nextShots,2);checks++;}
// Single-turn immediate area Scout, with normal combat state untouched by its answer.
{const h=host(4),m={...meta('archer',0),actorId:'p1',ownerId:'p1'};h.state.seats[0].scoutHitCount=1;const r=resolve(h,[{kind:'impact',meta:m,cell:{x:5,y:3},deferReactions:false},{kind:'same-turn-effects'}]);assert.equal(r.status,'awaiting-decision');assert.equal(r.decisions.at(-1).area,true);assert.equal(r.decisions.at(-1).remaining,1);checks++;}
// New-format private replay reuses precisely the same journalled RNG and state.
{const h=host(3,{inf:1,demon:1});const replay=createPrivateReplay(h);const result=recordReplayStep(replay,h,{kind:'command',command:{id:'replay-shot',kind:'shoot',actorId:'p0',boardId:'b1',cell:{x:10,y:10}}});assert.equal(serializeHost(replayPrivate(replay)),serializeHost(result));checks++;}
// Distinct events discovering the same cells still earn only one successful scan.
{const event={kind:'scouted',reason:'area-scout',statistics:{scout:{actorId:'p0',boardId:'b1',cells:[{cell:{x:1,y:1},unitId:'u1'},{cell:{x:2,y:1},unitId:'u2'}]}}};const facts=[1,2].map(index=>({index,eventId:'scan'+index,event}));assert.equal(tacticalScoreFacts({participants:[{actor:'p0',kind:'player'}]},facts).p0.scouts,1);checks++;}
// Root integration: all death sources settle first, then only surviving seats reorder.
for(const n of [3,4])for(const source of ['direct-human','plague','archer'])for(const eliminate of [false,true]){
 const h=host(n,{inf:1,demon:1});for(let i=0;i<n;i++)if(i!==1){h.state.seats[i].shots.push('0,0');h.state.match.units.find(u=>u.id==='demon'+i+'x0').lifecycle='destroyed';}
 beginChaosBoundary(h);const ops=[{kind:'impact',meta:meta(source),cell:{x:0,y:0},deferReactions:false},...(eliminate?[{kind:'impact',meta:meta('plague',n-1),cell:{x:14,y:14},deferReactions:false}]:[])];
 h.pendingRoot=startResolution(h.state,'chaos-root','chaos-shot','p0',ops,h.rng,'boundary-comparison');h.rootEventCursor=0;h.rootPurpose='shot';h.status='running';const beforeShots=h.state.seats[0].ordinaryShots;let steps=0;
 pumpHost(h,100000,{observePresentationStep(live){assert.ok(++steps<10000);assert.equal(live.state.ring.chaos.triggered,false,'no mid-root reorder');}});
 const active=n-(eliminate?1:0);assert.equal(h.state.ring.chaos.triggered,active>2);assert.equal(h.state.seats[0].ordinaryShots,beforeShots);assert.equal(h.activePlayerId,'p0');if(active===3)assert.deepEqual(h.state.ring.order,['p0',...Array.from({length:n-1},(_,i)=>'p'+(i+1)).filter(id=>!eliminate||id!=='p'+(n-1)).reverse()]);
 const count=h.events.filter(e=>e.event.kind==='chaos-manifestation').length;assert.equal(count,active>2?1:0);settleChaos(h);assert.equal(h.events.filter(e=>e.event.kind==='chaos-manifestation').length,count);assert.equal(serializeHost(deserializeHost(serializeHost(h))),serializeHost(h));checks++;
}
// A non-final death and a match that never had Demons cannot manifest Chaos.
for(const demons of [0,1]){const h=host(4,{inf:1,demon:demons});for(let i=0;i<4;i++)if(i!==1&&demons){const u=h.state.match.units.find(u=>u.id==='demon'+i+'x0');u.cells=[{x:12,y:12}];h.state.seats[i].occupied=h.state.seats[i].occupied.map(k=>k==='0,0'?'12,12':k);}beginChaosBoundary(h);h.pendingRoot=startResolution(h.state,'not-last','not-last','p0',[{kind:'impact',meta:meta('plague'),cell:{x:0,y:0},deferReactions:false}],h.rng,'boundary-comparison');h.rootPurpose='shot';h.status='running';pumpHost(h);assert.equal(h.state.ring.chaos.triggered,false);assert.equal(h.rng.draws.some(d=>d.purpose==='chaos-ring'),false);checks++;}
// Elimination of the old actor selects its legitimate successor before shuffle.
{const h=host(4,{inf:1,demon:1});for(let i=0;i<4;i++)if(i!==1)h.state.seats[i].shots.push('0,0');beginChaosBoundary(h);h.pendingRoot=startResolution(h.state,'actor-death','actor-death','p0',[{kind:'impact',meta:meta('plague'),cell:{x:0,y:0},deferReactions:false},{kind:'impact',meta:meta('plague',0),cell:{x:14,y:14},deferReactions:false} ],h.rng,'boundary-comparison');h.rootPurpose='shot';h.status='running';pumpHost(h);assert.equal(h.activePlayerId,'p1');assert.deepEqual(h.state.ring.order,['p1','p3','p2']);assert.equal(h.state.ring.chaos.triggered,true);assert.equal(h.status,'awaiting-turn');assert.equal(h.state.seats[1].ordinaryShots,0);checks++;}
// Rebuilding placements in another order never changes a saved Elf subtype.
{const h=host(2),elves=h.placements.filter(u=>u.type==='elf'),rest=h.placements.filter(u=>u.type!=='elf'),rebuilt=createHost(h.config);for(const p of [...rest,...elves.reverse()])place(rebuilt,p);for(const u of rebuilt.state.match.units.filter(u=>u.type==='elf'))assert.equal(u.scoutMode,h.state.match.units.find(old=>old.id===u.id).scoutMode);checks++;}
// The existing Story chapter 6 grants both subtypes together; chapter 7 syncs them.
{const win={addEventListener(){}},style={setProperty(){}},document={getElementById:()=>null,body:{classList:{toggle(){}},style},documentElement:{style}};let config;installStoryPolicy({window:win,document,getComputedStyle:()=>({}),requestAnimationFrame:()=>0,cancelAnimationFrame(){},configure:c=>{config=c;},restorePopupPreference(){},status(){}});for(const won of [true,false]){win.__stoneThrowStartStoryPhase2Battle(6,won);assert.equal(config.battle,6);assert.equal(config.player.elf,won?0:2);assert.equal(config.enemy.elf,won?2:0);checks++;}win.__stoneThrowStartStoryPhase2Battle(7,true);assert.equal(config.player.elf,2);assert.equal(config.enemy.elf,2);checks++;}
// Hit sequence is per owner; repeats and Plague neither grant nor consume a Scout benefit.
for(const n of [2,3,4])for(const source of ['direct-human','archer','wizard']){const h=host(n);const pair=resolve(h,[{kind:'impact',meta:meta(source),cell:{x:5,y:3},deferReactions:false},{kind:'impact',meta:meta(source),cell:{x:5,y:3},deferReactions:false},{kind:'impact',meta:meta(source),cell:{x:3,y:3},deferReactions:false}]);assert.equal(pair.state.seats[1].scoutHitCount,2);assert.equal(pair.events.filter(e=>e.reason==='scout').length,1);assert.equal(pair.events.filter(e=>e.reason==='area-scout').length,1);assert.equal(pair.state.seats[0].scoutHitCount,undefined);checks++;}
{const h=host(4);const r=resolve(h,[{kind:'impact',meta:meta('plague'),cell:{x:5,y:3},deferReactions:false},{kind:'impact',meta:meta('archer'),cell:{x:3,y:3},deferReactions:false}]);assert.equal(r.state.seats[1].scoutHitCount,1);assert.equal(r.state.seats[1].spyLater,5);assert.equal(r.state.seats[1].areaScoutLater,undefined);checks++;}
console.log(JSON.stringify({passed:true,checks,goblin:true,elves:true,chaos:true,restoreEveryResolutionStep:true}));
