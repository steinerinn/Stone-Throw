import type { ResolutionContext } from '../contracts.js';
/** Resume only after every frame, reaction and decision in the preceding chain settles. */
export declare function settleAssassin(ctx: ResolutionContext): boolean;
