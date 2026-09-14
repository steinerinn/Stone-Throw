import type { ResolutionContext, SourceMetadata } from './contracts.js';
/** Future work is carried by the root journal. Activation by the legacy turn
 * driver remains a separate action; this must not be drained as same-turn work. */
export declare function futureBenefit(ctx: ResolutionContext, meta: SourceMetadata, benefit: 'dwarf' | 'catapult' | 'scout' | 'resurrection' | 'ordinary-shots', amount: number): void;
