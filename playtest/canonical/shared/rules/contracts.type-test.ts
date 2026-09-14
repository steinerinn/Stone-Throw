import type {BoardId,PlayerId,Cell} from '../model.js';
import {canonicalBoardInput} from './canonical.js';
import {canPlaceInf} from './placement.js';
declare const boardId:BoardId;declare const ownerId:PlayerId;
declare const cells:readonly Readonly<Cell>[];
if(false){
 canonicalBoardInput({boards:[],units:[{boardId,ownerId,cells}]},boardId,ownerId);
 // @ts-expect-error Board and player identity are not interchangeable.
 canonicalBoardInput({boards:[],units:[]},ownerId,boardId);
 // @ts-expect-error DOM nodes are not occupancy collections.
 canPlaceInf({size:5,occupied:{className:'unit'}},0,0);
 const ctx:Parameters<typeof canPlaceInf>[0]={size:5,occupied:new Set<string>()};
 // @ts-expect-error The helper contract does not permit mutating input occupancy.
 ctx.occupied.add('0,0');
 // @ts-expect-error Size is an explicit readonly input.
 ctx.size=10;
}
