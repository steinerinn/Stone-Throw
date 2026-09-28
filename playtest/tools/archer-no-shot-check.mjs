import assert from 'node:assert/strict';
import {createHost,place} from '../canonical/compiled/host/initialization.js';
import {refreshHost} from '../canonical/compiled/host/refresh.js';
import {serializeHost} from '../canonical/compiled/host/serialization.js';
import {createLocalSession} from '../canonical/compiled/local-host/session.js';
import {emptyNormalMemory} from '../canonical/compiled/local-host/normal-policy.js';
import {mountBattleLog} from '../client-v13/battle-log.js';
let zero=0,positive=0;
for(let seed=1;seed<=100;seed++){
const h=createHost({matchId:'archer-zero',rulesVersion:'stone-throw-pacing-v1',size:15,story:false,seed:seed*7919,players:[{id:'a',boardId:'ba',roster:{inf:1},decisionMode:'interactive'},{id:'b',boardId:'bb',roster:{inf:1,archer:1},decisionMode:'policy'}]});
for(const [id,owner,type,x,y]of [['ai','a','inf',14,0],['bi','b','inf',14,0],['arch','b','archer',5,5]])place(h,{unitId:id,ownerId:owner,boardId:'b'+owner,type,cells:[{x,y}]});
h.status='awaiting-command';h.activePlayerId='a';h.starterId='a';h.round=1;h.turnIndex=1;h.turnStep='actions';h.state.seats[0].ordinaryShots=2;refreshHost(h);
const session=createLocalSession(h.config,JSON.stringify({contract:'local-authority-checkpoint-v1',host:serializeHost(h),normalMemory:emptyNormalMemory(),revision:0,epoch:1,serial:0,unitHandles:[],choiceHandles:[]}));const initial=await session.client.read();const u=await session.client.dispatch({contract:initial.snapshot.contract,battle:initial.snapshot.battle,revision:initial.snapshot.revision,intent:{kind:'shoot',cell:{x:5,y:5}}});const state=JSON.parse(JSON.parse(await session.serializePrivate()).host);const spent=state.events.find(r=>r.event.kind==='ability-spent'&&r.event.meta?.source==='archer').event;const notes=u.events.filter(e=>e.kind==='archer-no-shot');if(spent.reason==='archer-no-shot'){zero++;assert.equal(notes.length,1);assert.equal(notes[0].cell,null);assert.equal(notes[0].unitKind,null);const memory={rows:[]};mountBattleLog(memory).consume(u);assert.ok(memory.rows.some(r=>r.text==='The enemy Archer dies before firing any arrows.'));}else{positive++;assert.equal(notes.length,0);}
}
assert.ok(zero>0&&positive>0);console.log(JSON.stringify({passed:true,seeds:100,zero,positive}));


