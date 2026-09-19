import {publicEnemyScoutVisuals} from './scout-visuals.js';
import type {HostState} from '../host/contracts.js';
import type {SeenCell} from '../client-contract/public.js';
import {cellKey,parseKey} from '../combat/access.js';
/** Ordinary stationary-unit hit/Scout observations. Hero movement and Plague
 * have different retained presentation histories and are handled separately.
 * This adapter never projects an unobserved cell or a canonical unit handle. */
export function stationaryDisclosure(h:HostState,base:SeenCell[],records=h.events):SeenCell[]{
 const enemy=h.config.players[1]!,shots=new Set(h.state.seats[1]!.shots),scouted=new Set(h.state.seats[0]!.scouted);
 const rings=publicEnemyScoutVisuals(h);
 const out=new Map(base.map(c=>[cellKey(c.cell),c])),hits=new Map<string,string|null>(),plague=new Set<string>();
 for(const {event:e} of records)if(e.kind==='impact'&&e.meta?.targetPlayerId===enemy.id){for(const c of e.cells){const k=cellKey(c);if(e.meta.source==='plague')plague.add(k);else hits.set(k,e.unitId);}}
 for(const k of new Set([...scouted,...hits.keys()])){
  if(plague.has(k))continue;
  const u=hits.has(k)?h.state.match.units.find(u=>u.id===hits.get(k)):h.state.match.units.find(u=>u.ownerId===enemy.id&&u.cells.some(c=>cellKey(c)===k));
  if(u&&(!u.type||['cav','castle','hero'].includes(u.type)))continue;
  if(shots.has(k)&&!hits.has(k))continue;
  out.set(k,{cell:parseKey(k),kind:u?.type??null,observation:shots.has(k)?u?'impact':'miss':u?'occupied':'empty',unitPresentation:{hit:shots.has(k),scouted:rings.has(k),scoutArt:scouted.has(k)}});
 }
 return [...out.values()].sort((a,b)=>a.cell.y-b.cell.y||a.cell.x-b.cell.x);
}
