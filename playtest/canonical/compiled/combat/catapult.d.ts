import type { ResolutionContext, SourceMetadata, ReactionEntry } from './contracts.js';
import type { Cell, PlayerId } from '../model.js';
export declare function catapultImpact(ctx: ResolutionContext, meta: SourceMetadata, cell: Cell, impact: number, generated: ReactionEntry[]): void;
export declare function catapultSeries(ctx: ResolutionContext, ownerId: PlayerId, remaining: number): void;
