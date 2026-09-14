import type { PlayerId, BoardId, UnitId, Cell, Unit } from '../model.js';
import type { CombatState, ResolutionContext, SourceMetadata, InternalRuleEvent, EventKind } from './contracts.js';
import { key, parseKey } from '../rules/coordinates.js';
export { key, parseKey };
export declare const cellKey: (cell: Cell) => string;
export declare function seat(state: CombatState, id: PlayerId): import("./contracts.js").CombatSeat;
export declare function boardSize(state: CombatState, id: BoardId): number;
export declare function unit(state: CombatState, id: UnitId): Unit;
export declare function unitAt(state: CombatState, boardId: BoardId, k: string): Unit | null;
export declare function shot(state: CombatState, ownerId: PlayerId, k: string): boolean;
export declare function addUnique<T>(list: T[], v: T): void;
export declare function emit(ctx: ResolutionContext, kind: EventKind, meta?: SourceMetadata | null, unitId?: UnitId | null, cells?: Cell[], amount?: number | null, reason?: string | null): InternalRuleEvent;
export declare function destroyed(state: CombatState, u: Unit): boolean;
export declare function syncDamage(state: CombatState, u: Unit): void;
export declare function reactionMeta(state: CombatState, u: Unit, source: SourceMetadata['source'], origin: Cell): SourceMetadata;
export declare function available(state: CombatState, boardId: BoardId, ownerId: PlayerId): string[];
/** Original Plague scheduling retains its triggering turn tag independently of its later mover. */
export declare function ruleTurn(ctx: ResolutionContext): PlayerId;
/** Target-local clues: normal and reverse attacks can observe different boards. */
export declare function targetKnowledge(state: CombatState, owner: PlayerId, target: PlayerId): {
    scouted: string[];
    monkCandidates: string[];
};
