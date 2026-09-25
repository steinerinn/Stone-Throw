import {projectSeat} from '../server/projection.mjs';
import {emptyNormalMemory} from '../canonical/compiled/local-host/normal-policy.js';
import {emptyStatistics} from '../canonical/compiled/local-host/public-statistics.js';
import assert from 'node:assert/strict';import {createHost,place} from '../canonical/compiled/host/initialization.js';import {startResolution,stepResolution} from '../canonical/compiled/combat/resolver.js';import {serializeResolution,deserializeResolution} from '../canonical/compiled/combat/serialization.js';
import {execFileSync} from 'node:child_process';
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64'),rewrite=(s,url)=>s.replace(/from '([^']+)'/g,(all,p)=>p.startsWith('.')?"from '"+new URL(p,url).href+"'":all);
const oldMonk=data(rewrite(execFileSync('git',['show','cbc7d15ef9814db8ef8690e29611c89a6cbf71b6:playtest/canonical/compiled/combat/units/monk.js'],{encoding:'utf8'}),new URL('../canonical/compiled/combat/units/monk.js',import.meta.url)));
const old=await import(data(rewrite(execFileSync('git',['show','cbc7d15ef9814db8ef8690e29611c89a6cbf71b6:playtest/canonical/compiled/combat/resolver.js'],{encoding:'utf8'}).replace("'./units/monk.js'","'"+oldMonk+"'"),new URL('../canonical/compiled/combat/resolver.js',import.meta.url))));
let checks=0,circulations=0;
for(const n of [2,3,4])for(const seed of [1,2,3,42,99]){
 const h=createHost({matchId:'monk-pair',rulesVersion:'stone-throw-v1.427',size:9,story:false,seed,players:Array.from({length:n},(_,i)=>({id:'p'+i,boardId:'b'+i,roster:{inf:1,monk:1},decisionMode:'interactive'}))});
 for(let i=0;i<n;i++){place(h,{ownerId:'p'+i,boardId:'b'+i,unitId:'i'+i,type:'inf',cells:[{x:8,y:8}]});place(h,{ownerId:'p'+i,boardId:'b'+i,unitId:'m'+i,type:'monk',cells:[{x:4,y:4}]});h.state.seats[i].reactionTarget={playerId:'p'+((i+1)%n),boardId:'b'+((i+1)%n)};}
 const meta={actorId:'p0',ownerId:'p0',targetPlayerId:'p1',targetBoardId:'b1',sourceUnitId:'m0',source:'monk-deflect',origin:{x:4,y:4}};
 let ctx=startResolution(h.state,'pair','shot','p0',[{kind:'impact',meta,cell:{x:4,y:3},deferReactions:false}],h.rng,'boundary-comparison');let steps=0;
 while(ctx.status==='running'){assert.ok(++steps<10000,'exchange terminates');stepResolution(ctx);ctx=deserializeResolution(serializeResolution(ctx));}
 const baseline=old.startResolution(h.state,'pair','shot','p0',[{kind:'impact',meta,cell:{x:4,y:3},deferReactions:false}],h.rng,'boundary-comparison');let guard=0;while(baseline.status==='running'){assert.ok(++guard<10000);old.stepResolution(baseline);}if(n===2)assert.equal(serializeResolution(ctx),serializeResolution(baseline),'Duel complete events/state/RNG remain identical');if(n===4&&new Set(baseline.events.filter(e=>e.kind==='attack-started'&&e.reason==='monk-deflect').map(e=>e.meta.ownerId)).size===4)circulations++;const attacks=ctx.events.filter(e=>e.kind==='attack-started'&&e.reason==='monk-deflect');assert.ok(attacks.length>=2);
 for(const a of attacks){assert.ok(['p0','p1'].includes(a.meta.ownerId));assert.equal(a.meta.targetPlayerId,a.meta.ownerId==='p0'?'p1':'p0');}
 assert.ok(ctx.events.some(e=>e.kind==='monk-duel'&&e.reason==='defeated'));const projectedHost={...h,state:ctx.state,events:ctx.events.map(event=>({turnIndex:0,event}))};const publicUpdate=projectSeat(projectedHost,emptyNormalMemory(),emptyStatistics(),1,1,new Map(h.state.match.units.map(u=>[u.id,u.id])),new Map());assert.equal(publicUpdate.snapshot.monkDuelSequence,ctx.events.filter(e=>e.kind==='monk-duel'&&e.reason!=='defeated').length);assert.ok(publicUpdate.snapshot.monkDuelSequence>0);for(let i=2;i<n;i++)assert.equal(ctx.state.seats[i].shots.length,0,'third/fourth seat untouched');checks++;
}
assert.ok(circulations>0,'old 4P ring circulation reproduced');console.log(JSON.stringify({passed:true,checks,circulations,formats:[2,3,4],seeds:5,pairLocked:true,restoredEveryStep:true,terminatesOnMonkDefeat:true}));
