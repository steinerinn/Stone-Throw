import {destroyed} from '../combat/access.js';
import {mutableRows} from '../archives.js';
import type {HostState} from './contracts.js';
import type {PlayerId} from '../model.js';
/** Private scoring evidence at the settled elimination boundary; no gameplay writes. */
export function recordEliminationScores(h:HostState,targets:PlayerId[]){
 const last=h.events.at(-1);if(!last||!targets.length)return;
 const awards=targets.map(target=>{
  const death=[...h.events].reverse().find(({event:e})=>['unit-destroyed','hero-killed'].includes(e.kind)&&e.statistics?.unitOwner===target&&['inf','cav','archer','monk','castle','hero'].includes(String(e.statistics?.unitType)));
  const e=death?.event,hit=e&&[...h.events].reverse().find(({event:x})=>x.kind==='impact'&&x.unitId===e.unitId)?.event;
  const cause=e?.meta||hit?.meta,environmental=e?.statistics?.environmental||hit?.statistics?.environmental;
  const survivingCore=h.state.match.units.some(u=>u.ownerId===target&&(u.type==='hero'?!!u.hero?.activated&&!!u.hero.currentCell:['inf','cav','archer','monk','castle'].includes(u.type||'')&&u.cells.length>0&&!destroyed(h.state,u)));
  const actor=!survivingCore&&!environmental&&cause?.ownerId!==target?cause?.ownerId||null:null;
  const heroAlive=h.state.match.units.some(u=>u.ownerId===target&&u.type==='hero'&&u.lifecycle!=='destroyed'&&!!u.hero?.currentCell);
  return {target,actor,heroAlive};
 });
 h.events=mutableRows(h.events);h.events[h.events.length-1]={...last,event:{...last.event,statistics:{...last.event.statistics,eliminationAwards:awards}}};
}
