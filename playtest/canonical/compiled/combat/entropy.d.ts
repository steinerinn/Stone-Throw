import type { ResolutionContext } from './contracts.js';
/** Compatibility-only entropy reported by an external presentation adapter.
 * No visual operation executes here. Values and their position in the rule RNG
 * stream are checked exactly; unknown or unconsumed entries fail comparison. */
export declare function consumeCompatibilityEntropy(ctx: ResolutionContext): void;
