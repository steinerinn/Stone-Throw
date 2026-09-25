/** Stage 7 legacy-compatible pure rules. Order and quirks are intentional.
 * Explicit readonly inputs; no DOM, RNG, state mutation or AI policy.
 * See extraction-map.json for source hashes and transitive dependencies. */
import {ring3x3CellsOf,key,inBounds,parseKey,neighbors4} from './coordinates.js';
import {cavCellsAt} from './footprints.js';

export function anyConflictsSingle(ctx:Readonly<{occupied:ReadonlySet<string>;size:number;spacingExempt?:ReadonlySet<string>}>,targetKey:string,ignoreKeys:ReadonlySet<string>=new Set<string>()){
const around=ring3x3CellsOf(ctx,[targetKey]); const offenders=[]; for(const c of around){ if(ignoreKeys.has(c)) continue; if(ctx.occupied.has(c)&&!ctx.spacingExempt?.has(c)) offenders.push(c); } return offenders; }

export function anyConflictsMulti(ctx:Readonly<{occupied:ReadonlySet<string>;size:number;spacingExempt?:ReadonlySet<string>}>,targetKeys:readonly string[],ignoreKeys:ReadonlySet<string>=new Set<string>()){
const around=ring3x3CellsOf(ctx,targetKeys); for(const k of targetKeys) around.add(k);const offenders=[]; for(const c of around){ if(ignoreKeys.has(c)) continue; if(ctx.occupied.has(c) && !ctx.spacingExempt?.has(c) && !targetKeys.includes(c)) offenders.push(c); } return offenders; }

export function canPlaceInf(ctx:Readonly<{occupied:ReadonlySet<string>;size:number;spacingExempt?:ReadonlySet<string>}>,x:number,y:number){ if(!inBounds(ctx,x,y)) return false; const k=key(x,y); if(ctx.occupied.has(k)) return false; return anyConflictsSingle(ctx,k).length===0; }

export function canPlaceCav(ctx:Readonly<{occupied:ReadonlySet<string>;size:number;spacingExempt?:ReadonlySet<string>}>,x:number,y:number,orient:string){ const cells=cavCellsAt(x,y,orient); for(const k of cells){ const {x:cx,y:cy}=parseKey(k); if(!inBounds(ctx,cx,cy)) return {ok:false, offenders:['out']}; } for(const k of cells){ if(ctx.occupied.has(k)) return {ok:false, offenders:[k]}; } const offenders=anyConflictsMulti(ctx,cells); return {ok: offenders.length===0, offenders}; }

export function canPlaceCastleShape(ctx:Readonly<{occupied:ReadonlySet<string>;size:number;spacingExempt?:ReadonlySet<string>}>,cells:readonly string[]){
const cellSet=new Set(cells);const offenders=[];for(const k of cells){
const {x,y}=parseKey(k);if(!inBounds(ctx,x,y)){ offenders.push('out'); continue; }
if(ctx.occupied.has(k)) offenders.push(k);}
if(offenders.length) return {ok:false,offenders:[...new Set(offenders)]};const around=ring3x3CellsOf(ctx,cells);for(const k of around){
if(cellSet.has(k)) continue;if(ctx.occupied.has(k)&&!ctx.spacingExempt?.has(k)) offenders.push(k);}
return {ok:offenders.length===0,offenders:[...new Set(offenders)]};}

export function castleCellsConnected(ctx:Readonly<{size:number}>,cellsSet:ReadonlySet<string>){
const cells=[...cellsSet];if(cells.length<=1) return true;const seen=new Set([cells[0]!]);const stack=[cells[0]!];while(stack.length){
const cur=stack.pop()!;const {x,y}=parseKey(cur);for(const nk of neighbors4(ctx,x,y)){
if(cellsSet.has(nk) && !seen.has(nk)){ seen.add(nk); stack.push(nk); }
}
}
return seen.size===cellsSet.size;}

export function validCastleExpansionCells(ctx:Readonly<{occupied:ReadonlySet<string>;size:number;spacingExempt?:ReadonlySet<string>}>,castle:Readonly<{cells:ReadonlySet<string>}>){
const valid=new Set<string>();const own=new Set(castle.cells);if(castle.cells.size===0) return valid;for(const ck of castle.cells){
const {x,y}=parseKey(ck);for(const nk of neighbors4(ctx,x,y)){
if(own.has(nk) || ctx.occupied.has(nk)) continue;const around=ring3x3CellsOf(ctx,[nk]);let blocked=false;for(const ak of around){
if(own.has(ak)) continue;if(ctx.occupied.has(ak)&&!ctx.spacingExempt?.has(ak)){ blocked=true; break; }
}
if(!blocked) valid.add(nk);}
}
return valid;}

export function canRemoveCastleCell(ctx:Readonly<{size:number}>,castle:Readonly<{cells:ReadonlySet<string>}>|null,k:string){
if(!castle || !castle.cells.has(k)) return false;if(castle.cells.size<=1) return true;const next=new Set(castle.cells);next.delete(k);return castleCellsConnected(ctx,next);}
