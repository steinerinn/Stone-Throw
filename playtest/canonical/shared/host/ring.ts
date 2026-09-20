import {mutableRows} from '../archives.js';
import type {HostState} from './contracts.js';
import type {CombatState} from '../combat/contracts.js';
import type {PlayerId} from '../model.js';
import {seat,destroyed} from '../combat/access.js';

export function normalTarget(s:CombatState,owner:PlayerId){
 const order=s.ring?.order;
 if(!order)return seat(s,seat(s,owner).reactionTarget.playerId);
 const i=order.indexOf(owner);if(i<0||order.length<2)throw Error('No active target');
 return seat(s,order[(i+1)%order.length]!);
}
export function syncRing(s:CombatState){if(!s.ring||s.ring.order.length<2)return;const order=s.ring.order;
 for(const [i,id] of order.entries()){const p=seat(s,id),previous=seat(s,order[(i+order.length-1)%order.length]!);p.reactionTarget={playerId:previous.playerId,boardId:previous.boardId};}
}
/** Approved active-ring-only exception: a stale search marker is not surviving core state. */
export function survives(s:CombatState,id:PlayerId){return s.match.units.some(u=>u.ownerId===id&&(u.type==='hero'?!!u.hero?.activated&&!!u.hero.currentCell:['inf','cav','archer','monk','castle'].includes(u.type||'')&&u.cells.length>0&&!destroyed(s,u)));}
/** Called after the resolver has exhausted every frame and Human decision. */
export function commitEliminations(h:HostState){const s=h.state,ring=s.ring;if(!ring)return false;if(h.pendingRoot)throw Error('Elimination inside root');
 const before=[...ring.order],dead=before.filter(id=>!survives(s,id));if(!dead.length)return false;
 const last=h.events.at(-1);if(last){h.events=mutableRows(h.events);h.events[h.events.length-1]={...last,event:{...last.event,statistics:{...last.event.statistics,eliminationBoundary:{dead:[...dead],survivors:before.length-dead.length}}}};}
 ring.eliminated.push(...dead);ring.order=before.filter(id=>!dead.includes(id));
 for(const id of dead){const p=seat(s,id);p.ordinaryShots=0;p.nextShots=0;p.currentChainBonus=0;p.dwarfNow=0;p.catapultNow=0;p.catapultLater=0;p.elfNow=false;p.spyLater=0;p.clericNow=false;p.clericLater=false;p.releaseNow=false;}
 // Approved Plague rule: only elimination of the infected board cancels its outbreak.
 s.plagues=s.plagues.filter(p=>!dead.includes(p.targetPlayerId));
 // Keep the original source/credit and remaining steps. An orphaned outbreak advances
 // on its surviving target's turns, since its original mover no longer has turns.
 for(const p of s.plagues)if(!ring.order.includes(p.moveOnPlayerId))p.moveOnPlayerId=p.targetPlayerId;
 syncRing(s);if(ring.order.length<=1)for(const p of s.seats){p.catapultNow=0;p.catapultLater=0;p.elfNow=false;p.spyLater=0;}
 if(ring.order.length<=1)s.match.outcome=ring.order.length?{kind:'win',winnerIds:[...ring.order],eliminatedIds:[...ring.eliminated]}:{kind:'draw'};
 if(h.activePlayerId&&dead.includes(h.activePlayerId)&&ring.order.length>1){const i=before.indexOf(h.activePlayerId),next=[...before.slice(i+1),...before.slice(0,i)].find(id=>ring.order.includes(id))!;h.activePlayerId=next;h.turnIndex++;h.turnStep='enter';h.status='awaiting-turn';h.guards.turnActions=0;return true;}
 return false;
}
/** Future Chaos capability only: no transport, trigger or entropy. */
export function reorderAtBoundary(input:HostState,order:PlayerId[]):HostState{
 if(input.pendingRoot||!['awaiting-command','awaiting-turn'].includes(input.status)||!input.state.ring)throw Error('Ring reorder requires a settled active match');
 const current=input.state.ring.order;if(order.length!==current.length||new Set(order).size!==current.length||order.some(id=>!current.includes(id)))throw Error('Reorder must preserve active membership');
 const h=structuredClone(input);h.state.ring!.order=[...order];syncRing(h.state);return h;
}
