import type { Unit, Cell } from '../../model.js';
import type { ResolutionContext, SourceMetadata } from '../contracts.js';
export declare function heroHit(ctx: ResolutionContext, u: Unit, meta: SourceMetadata): void;
export declare function killHero(ctx: ResolutionContext, u: Unit, reason: string): void;
export declare function heroDestinations(ctx: ResolutionContext, u: Unit, local: boolean): Cell[];
export declare function moveHero(ctx: ResolutionContext, u: Unit, cell: Cell): void;
