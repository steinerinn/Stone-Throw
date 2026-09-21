import type {HostState} from '../host/contracts.js';
import {cellKey} from '../combat/access.js';
// Scouting alone owns the marker. Any public resolved contact permanently
// supersedes it, regardless of attack source. Coordinates are board-scoped.
export function publicScoutOnlyCells(h:HostState,board:string,scouted:Iterable<string>):Set<string>{
 const visible=new Set(scouted);
 for(const {event:e} of h.events)if(e.meta?.targetBoardId===board&&['impact','suspect-eliminated','repeat-ignored'].includes(e.kind))for(const c of e.cells)visible.delete(cellKey(c));
 return visible;
}
export function publicEnemyScoutVisuals(h:HostState):Set<string>{return publicScoutOnlyCells(h,h.config.players[1]!.boardId,h.state.seats[0]!.scouted);}
