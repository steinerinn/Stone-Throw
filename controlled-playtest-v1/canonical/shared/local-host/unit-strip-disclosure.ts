import type {HostState} from '../host/contracts.js';
import type {UnitKind,Side} from '../client-contract/public.js';
import {cellKey} from '../combat/access.js';
export interface StripState {placed:number;destroyed:number;heroHits:number}
/** Aggregate public strip status only. No unit IDs or private geometry cross.
 * During enemy search, already-public candidate casualties remain dead-looking
 * until accepted elimination/discovery reveals a new state. */
export function publicUnitStrips(h:HostState):Record<Side,Partial<Record<UnitKind,StripState>>>{
 const result:Record<Side,Partial<Record<UnitKind,StripState>>>={self:{},opponent:{}};
 for(const [i,p]of h.config.players.entries()){
  const side=i===0?'self':'opponent',s=h.state.seats[i]!,units=h.state.match.units.filter(u=>u.ownerId===p.id),shots=new Set(s.shots);
  if(i===1&&h.status!=='complete'&&s.resurrection.searchActive)for(const id of s.resurrection.suspects)for(const c of units.find(u=>u.id===id)!.cells)shots.add(cellKey(c));
  for(const [type,count]of Object.entries(p.roster)){if(!count)continue;const own=units.filter(u=>u.type===type);result[side][type as UnitKind]={placed:i===0?own.length:units.length?count:0,destroyed:type==='hero'?0:own.filter(u=>u.cells.length&&u.cells.every(c=>shots.has(cellKey(c)))).length,heroHits:type==='hero'?(own[0]?.hero?.hitsTaken||0):0};}
 }
 return result;
}
