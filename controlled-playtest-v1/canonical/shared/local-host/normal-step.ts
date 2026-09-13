import {normalExecution} from './demon-entropy.js';
import {normalCatapultChoice} from './normal-catapult.js';
import type {HostState} from '../host/contracts.js';import {acceptCommand,pumpHost} from '../host/lifecycle.js';import {autoStep} from '../host/auto-match.js';import {cellKey,parseKey} from '../combat/access.js';import {normalPolicy} from './normal-policy.js';import type {NormalMemory} from './normal-policy.js';
export function refreshNormalMemory(h:HostState,m:NormalMemory){const self=h.config.players[0]!.id,enemy=h.config.players[1]!.id;const add=(list:string[],k:string)=>{if(!list.includes(k))list.push(k);};for(const {event:e}of h.events.slice(m.eventCursor)){const u=e.unitId?h.state.match.units.find(u=>u.id===e.unitId):null;
 if((e.kind==='impact'||e.kind==='resurrection-discovered')&&u?.ownerId===self)for(const c of e.cells){if(e.meta?.source!=='direct-ai')add(m.knownHits,cellKey(c));if(u.type==='castle')add(m.castleHits,cellKey(c));}
 // Normal enemyTurn records its direct hit after its retaliation chain.
 // Root-local lookup also survives an intervening serialized human decision.
 if(e.kind==='work-started'&&e.reason==='direct-after'){
  const hit=h.events.find(({event:q})=>q.rootId===e.rootId&&q.kind==='impact'&&q.meta?.source==='direct-ai'&&q.meta.targetPlayerId===self)?.event;
  if(hit?.unitId)for(const c of hit.cells)add(m.knownHits,cellKey(c));
 }
 if(e.kind==='resurrection'&&u?.ownerId===self)m.knownHits=m.knownHits.filter(k=>!e.cells.some(c=>cellKey(c)===k));
 if(e.kind==='hero-moved'&&u?.ownerId===self)for(const c of e.cells){const k=cellKey(c);if(h.state.seats[1]!.scouted.includes(k)){const i=m.scoutKnowledge.findIndex(([key])=>key===k);if(i<0)m.scoutKnowledge.push([k,'special']);else m.scoutKnowledge[i]=[k,'special'];}}
 }
 // The legacy Castle-memory pruning helper has no live caller. Retain recorded hits after destruction.
 // killHero('player') clears normal hunt memory; Auto Match memory is separate.
 m.heroHunt=h.state.match.units.some(u=>u.ownerId===self&&u.type==='hero'&&u.lifecycle==='destroyed')?[]:[...h.brains.find(b=>b.playerId===enemy)!.heroHunt];m.eventCursor=h.events.length;
 for(const k of h.state.seats[1]!.scouted)if(!m.scoutKnowledge.some(([key])=>key===k)){const u=h.state.match.units.find(u=>u.ownerId===self&&u.cells.some(c=>cellKey(c)===k)),kind=!u?'empty':u.type==='hero'?(u.hero?.activated?'core':'special'):['inf','cav','archer','monk','castle'].includes(u.type||'')?'core':'special';m.scoutKnowledge.push([k,kind]);}
}
export function normalEnemyStep(input:HostState,m:NormalMemory,observePresentationStep?:import('../host/lifecycle.js').HostExecution['observePresentationStep']):HostState {let h=structuredClone(input);refreshNormalMemory(h,m);const enemy=h.config.players[1]!,commandId='normal-'+h.history.length;
 if(h.status==='awaiting-turn')return acceptCommand(h,{id:commandId,kind:'advance-turn'},{...normalExecution(m),...(observePresentationStep?{observePresentationStep}:{})});
 if(h.status==='awaiting-command'&&h.activePlayerId===enemy.id){const k=normalPolicy(h,m).target(h.plagueAwareAtTurnStart);if(k)h=acceptCommand(h,{id:commandId,kind:'shoot',actorId:enemy.id,boardId:h.config.players[0]!.boardId,cell:parseKey(k)},{...normalExecution(m),...(observePresentationStep?{observePresentationStep}:{})});else{h.turnStep='plague';h.status='running';pumpHost(h,100000,{...normalExecution(m),...(observePresentationStep?{observePresentationStep}:{})});}return h;}
 if(h.status==='awaiting-decision'){const d=h.pendingRoot!.decisions.find(d=>d.status==='pending')!;if(d.actorId!==enemy.id)throw Error('Normal AI cannot answer human decision');const policy=normalPolicy(h,m);let k:string|null=null;if(d.kind==='scout'){if(!m.scoutQueue.length)m.scoutQueue=policy.scout(d.remaining||0);k=m.scoutQueue.shift()||null;}else if(d.kind==='catapult-target'){k=normalCatapultChoice(h,m);}else if(d.kind==='catapult-roll')k=policy.roll(d.legalCells.map(cellKey),true);else return autoStep(h,{...normalExecution(m),...(observePresentationStep?{observePresentationStep}:{})});return acceptCommand(h,{id:commandId,kind:'answer',answer:{actorId:enemy.id,decisionId:d.id,cell:k?parseKey(k):null,unitId:null}},{...normalExecution(m),...(observePresentationStep?{observePresentationStep}:{})});}
 return h;
}
