import type {HostState} from './contracts.js';
import type {PlayerId} from '../model.js';
import {destroyed} from '../combat/access.js';
import {random} from '../combat/rng.js';
import {syncRing} from './ring.js';
import {mutableRows} from '../archives.js';
export function livingDemons(h:HostState){return h.state.match.units.some(u=>u.type==='demon'&&u.cells.length>0&&!destroyed(h.state,u));}
export function beginChaosBoundary(h:HostState){if(h.config.rulesVersion!=='stone-throw-pacing-v1'||!h.state.ring)return;const c=h.state.ring.chaos??={livingBeforeRoot:false,pending:false,used:false,triggered:false};c.livingBeforeRoot=livingDemons(h);}
export function observeChaosBoundary(h:HostState){const c=h.state.ring?.chaos;if(!c||c.used)return;const living=livingDemons(h);if(c.livingBeforeRoot&&!living)c.pending=true;c.livingBeforeRoot=living;}
function permutations(values:PlayerId[]):PlayerId[][]{if(!values.length)return [[]];return values.flatMap((id,i)=>permutations(values.filter((_,j)=>i!==j)).map(rest=>[id,...rest]));}
/** Only invoked after the entire root and elimination commit, never from an impact. */
export function settleChaos(h:HostState){const ring=h.state.ring,c=ring?.chaos;if(!ring||!c?.pending||c.used||h.pendingRoot)return;c.pending=false;if(livingDemons(h))return;c.used=true;if(ring.order.length<3||h.state.match.outcome.kind!=='ongoing')return;
 const actor=h.activePlayerId;if(!actor||!ring.order.includes(actor))throw Error('Chaos needs surviving current actor');
 const index=ring.order.indexOf(actor),before=[...ring.order.slice(index),...ring.order.slice(0,index)];
 const alternatives=permutations(before.slice(1)).map(rest=>[actor,...rest]).filter(order=>order.some((id,i)=>id!==before[i]));
 ring.order=alternatives[Math.floor(random(h.rng,'chaos-ring')*alternatives.length)]!;c.triggered=true;syncRing(h.state);
 const last=h.events.at(-1)?.event;if(last){h.events=mutableRows(h.events);h.events.push({turnIndex:h.turnIndex,event:{sequence:last.sequence+1,rootId:last.rootId,workId:null,kind:'chaos-manifestation',meta:null,unitId:null,cells:[],amount:null,reason:'last-demon',statistics:{before,after:[...ring.order]}}});}
}
