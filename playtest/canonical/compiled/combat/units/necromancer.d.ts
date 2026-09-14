import type { PlayerId, Cell } from '../../model.js';
import type { ResolutionContext, SourceMetadata } from '../contracts.js';
export declare function necromancers(ctx: ResolutionContext, ownerId: PlayerId): import("../../model.js").Unit[];
export declare function necroHits(ctx: ResolutionContext, ownerId: PlayerId): number;
export declare function schedulePlague(ctx: ResolutionContext, ownerId: PlayerId, origin: Cell | null): void;
export declare function releaseHeldPlague(ctx: ResolutionContext, clericOwnerId: PlayerId): void;
export declare function necromancerRule(ctx: ResolutionContext, meta: SourceMetadata, origin: Cell): void;
