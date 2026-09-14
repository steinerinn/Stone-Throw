import type {Board,BoardId,PlayerId,Unit,Cell} from '../model.js';
import {key} from './coordinates.js';
/** Narrow private authoritative input. Never an observer projection or browser bridge. */
export interface BoardRuleState {
 readonly boards:readonly Readonly<Board>[];
 readonly units:readonly Readonly<{boardId:BoardId;ownerId:PlayerId;cells:readonly Readonly<Cell>[]}>[];
}
/** Legacy geometry is square. Reject unsupported rectangles, rather than invent rules.
 * Retain destroyed footprints: legacy occupancy does not remove dead unit cells.
 * Return a fresh set; never expose or mutate source state. */
export function canonicalBoardInput(state:BoardRuleState,boardId:BoardId,ownerId:PlayerId):Readonly<{size:number;occupied:ReadonlySet<string>}> {
 const boards=state.boards.filter(b=>b.id===boardId);
 if(boards.length!==1)throw Error('Expected one canonical board');
 const board=boards[0]!;
 if(board.ownerId!==ownerId)throw Error('Board owner mismatch');
 if(!Number.isInteger(board.width)||board.width<=0||board.width!==board.height)throw Error('Legacy rules require a positive square board');
 const occupied=new Set<string>();
 for(const unit of state.units){if(unit.boardId!==boardId)continue;
  if(unit.ownerId!==ownerId)throw Error('Unit owner mismatch');
  for(const cell of unit.cells)occupied.add(key(cell.x,cell.y));
 }
 return {size:board.width,occupied};
}
/** Shots must be supplied explicitly. Damage/history/knowledge cannot reconstruct
 * every attempted shot; the adapter does not infer them or choose an AI policy. */
export function cellKeys(cells:readonly Readonly<Cell>[]):ReadonlySet<string> {
 return new Set(cells.map(c=>key(c.x,c.y)));
}
