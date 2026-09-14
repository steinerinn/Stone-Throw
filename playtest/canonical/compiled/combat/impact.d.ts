import type { Cell, Unit } from '../model.js';
import type { ResolutionContext, SourceMetadata, ReactionEntry } from './contracts.js';
export interface ImpactResult {
    type: Unit['type'];
    unitId: Unit['id'] | null;
    reaction: ReactionEntry | null;
    repeat: boolean;
    deferred: {
        unitId: Unit['id'];
        cell: Cell;
        meta: SourceMetadata;
    } | null;
}
export declare function unitReaction(ctx: ResolutionContext, u: Unit, meta: SourceMetadata, cell: Cell): ReactionEntry | null;
/** Direct state transition only. Attack-layer/volley barriers choose when to call
 * unitReaction; interrupts and completion checks belong to the root scheduler. */
export declare function resolveImpact(ctx: ResolutionContext, meta: SourceMetadata, cell: Cell, deferReactions?: boolean): ImpactResult;
