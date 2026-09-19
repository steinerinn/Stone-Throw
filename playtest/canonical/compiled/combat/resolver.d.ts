import type { PlayerId } from '../model.js';
import type { ResolutionContext, CombatState, Operation, ExplicitRng } from './contracts.js';
export declare function startResolution(state: CombatState, rootId: string, acceptedActionId: string, activePlayerId: PlayerId, operations: Operation[], rng?: ExplicitRng, scope?: ResolutionContext['scope']): ResolutionContext;
export declare function living(ctx: ResolutionContext, ownerId: PlayerId): boolean;
export declare function checkTerminal(ctx: ResolutionContext, reason: string): boolean;
export declare function stepResolution(ctx: ResolutionContext, options?: {
    deferLocalHeroPolicy?: boolean;
    deferTerminal?: boolean;
}): void;
export declare function runResolution(ctx: ResolutionContext, maxSteps?: number): ResolutionContext;
