import type { Board, BoardId, PlayerId, Cell } from '../model.js';
/** Narrow private authoritative input. Never an observer projection or browser bridge. */
export interface BoardRuleState {
    readonly boards: readonly Readonly<Board>[];
    readonly units: readonly Readonly<{
        boardId: BoardId;
        ownerId: PlayerId;
        cells: readonly Readonly<Cell>[];
    }>[];
}
/** Legacy geometry is square. Reject unsupported rectangles, rather than invent rules.
 * Retain destroyed footprints: legacy occupancy does not remove dead unit cells.
 * Return a fresh set; never expose or mutate source state. */
export declare function canonicalBoardInput(state: BoardRuleState, boardId: BoardId, ownerId: PlayerId): Readonly<{
    size: number;
    occupied: ReadonlySet<string>;
}>;
/** Shots must be supplied explicitly. Damage/history/knowledge cannot reconstruct
 * every attempted shot; the adapter does not infer them or choose an AI policy. */
export declare function cellKeys(cells: readonly Readonly<Cell>[]): ReadonlySet<string>;
