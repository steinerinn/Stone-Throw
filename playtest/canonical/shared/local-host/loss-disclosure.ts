import type {HostState} from '../host/contracts.js';
import type {LossReveal} from '../client-contract/public.js';
import {cellKey} from '../combat/access.js';
/** Legacy revealEnemyBoardOnLoss, issued by authority only after normal defeat.
 * This is not a client-selectable reveal mode. Already-shot cells stay under
 * their existing combat disclosure; hidden identities never cross this boundary. */
export function lossDisclosure(h:HostState):LossReveal[]{
 const self=h.config.players[0]!,enemy=h.config.players[1]!,outcome=h.state.match.outcome;
 if(h.status!=='complete'||outcome.kind!=='win'||!outcome.winnerIds.includes(enemy.id)||outcome.winnerIds.includes(self.id))return [];
 const seat=h.state.seats.find(p=>p.playerId===enemy.id)!;const visible:LossReveal[]=[];
 for(let y=0;y<h.config.size;y++)for(let x=0;x<h.config.size;x++){
  const k=x+','+y;if(!seat.occupied.includes(k)||seat.shots.includes(k))continue;
  const u=h.state.match.units.find(u=>u.ownerId===enemy.id&&u.cells.some(c=>cellKey(c)===k));if(!u?.type)continue;
  let castleMask:number|null=null;if(u.type==='castle'){const own=new Set(u.cells.map(cellKey));castleMask=0;if(own.has(x+','+(y-1)))castleMask|=1;if(own.has((x+1)+','+y))castleMask|=2;if(own.has(x+','+(y+1)))castleMask|=4;if(own.has((x-1)+','+y))castleMask|=8;}
  visible.push({cell:{x,y},kind:u.type,castleMask});
 }
 return visible;
}
