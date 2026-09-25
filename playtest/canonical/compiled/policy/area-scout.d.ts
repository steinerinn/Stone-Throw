import type { HostState } from '../host/contracts.js';
import type { Cell, PlayerId, BoardId } from '../model.js';
/** Maximize fresh information, using only shots and this observer's scouting. */
export declare function areaScoutChoice(h: HostState, actor: PlayerId, boardId: BoardId, legal: readonly Cell[]): Cell | null;
