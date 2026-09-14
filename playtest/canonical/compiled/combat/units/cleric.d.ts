import type { PlayerId, UnitId } from '../../model.js';
import type { ResolutionContext, SourceMetadata } from '../contracts.js';
export declare function clericRule(ctx: ResolutionContext, meta: SourceMetadata): void;
export declare function resurrectionCandidates(ctx: ResolutionContext, ownerId: PlayerId): UnitId[];
export declare function resurrect(ctx: ResolutionContext, ownerId: PlayerId, unitId: UnitId): void;
export declare function discoverResurrection(ctx: ResolutionContext, meta: SourceMetadata, k: string): boolean;
