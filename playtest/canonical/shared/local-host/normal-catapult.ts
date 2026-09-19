import type {HostState} from '../host/contracts.js';
import type {NormalMemory} from './normal-policy.js';
import {normalPolicy} from './normal-policy.js';
import {cellKey} from '../combat/access.js';

/** Normal resolveCatapultShotsForSide retains Castle stops for this series,
 * including a Castle destroyed by an earlier shot. It records volley origins
 * only for Auto Match / Story Auto Resolve, never for normal enemy play. */
export function normalCatapultChoice(h:HostState,memory:NormalMemory):string|null {
 const root=h.pendingRoot,d=root?.decisions.find(d=>d.status==='pending');
 if(!root||!d||d.kind!=='catapult-target')throw Error('No normal Catapult target decision');
 const stopped=new Set<string>();
 for(const e of root.events){
  if(e.workId!==d.workId||e.kind!=='impact'||e.meta?.source!=='catapult-shot'||e.meta.ownerId!==d.actorId)continue;
  if(root.state.match.units.find(u=>u.id===e.unitId)?.type==='castle')for(const cell of e.cells)stopped.add(cellKey(cell));
 }
 return normalPolicy(h,memory).catapult([...stopped],[]);
}
