import {publicEnemyScoutVisuals} from './scout-visuals.js';
import type {HostState} from '../host/contracts.js';
import type {SeenCell} from '../client-contract/public.js';
import {cellKey} from '../combat/access.js';
/** Trusted normal-browser disclosure adapter. Private geometry is used only to
 * reproduce the accepted identification predicates. Only observed cells leave
 * this boundary; an unidentified core carries neither type nor geometry. */
export function multiCellDisclosure(h:HostState,base:SeenCell[],records=h.events):SeenCell[]{
 const enemy=h.config.players[1]!,shots=new Set(h.state.seats[1]!.shots),scouted=new Set(h.state.seats[0]!.scouted);
 const rings=publicEnemyScoutVisuals(h);
 const out=new Map(base.map(c=>[cellKey(c.cell),c]));
 for(const u of h.state.match.units.filter(u=>u.ownerId===enemy.id&&(u.type==='cav'||u.type==='castle'))){
  const known=u.cells.filter(c=>shots.has(cellKey(c))||scouted.has(cellKey(c))),knownKeys=new Set(known.map(cellKey));
  const destroyed=u.cells.every(c=>shots.has(cellKey(c)));
  const revealed=new Set<string>();
  if(u.type==='cav'){if(known.length===u.cells.length)for(const c of known)revealed.add(cellKey(c));}
  else {
   // Attacker disclosure is local to each 8-neighbour observed component.
   // A pair elsewhere on this Castle cannot identify an isolated hit.
   for(const c of known)if(destroyed||known.some(p=>cellKey(p)!==cellKey(c)&&Math.abs(p.x-c.x)<=1&&Math.abs(p.y-c.y)<=1))revealed.add(cellKey(c));
   for(const {event:e} of records)if(e.kind==='impact'&&e.unitId===u.id&&e.meta?.targetPlayerId===enemy.id&&e.meta.source==='catapult-shot')for(const c of e.cells)if(knownKeys.has(cellKey(c)))revealed.add(cellKey(c));
  }
  for(const c of known){const hit=shots.has(cellKey(c)),identified=revealed.has(cellKey(c));
   const entry:SeenCell={cell:{...c},observation:hit?'impact':'occupied',kind:identified?u.type:null,corePresentation:identified?'identified':'unidentified',scouted:!hit,scoutVisual:rings.has(cellKey(c))};
   if(identified&&destroyed)entry.knownDestroyed=true;
   if(identified&&u.type==='castle'){let mask=0;if(revealed.has(c.x+','+(c.y-1)))mask|=1;if(revealed.has((c.x+1)+','+c.y))mask|=2;if(revealed.has(c.x+','+(c.y+1)))mask|=4;if(revealed.has((c.x-1)+','+c.y))mask|=8;entry.castleMask=mask;}
   out.set(cellKey(c),entry);
  }
 }
 return [...out.values()].sort((a,b)=>a.cell.y-b.cell.y||a.cell.x-b.cell.x);
}
