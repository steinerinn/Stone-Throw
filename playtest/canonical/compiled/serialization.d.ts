import type { MatchState, MatchConfiguration } from './model.js';
export declare function freezeConfiguration<T extends MatchConfiguration>(config: T): T;
/** Stable key ordering for fingerprints; this is not a gameplay RNG or event order. */
export declare function stableJson(v: unknown): string;
export declare function serializeMatch(state: MatchState): string;
export declare function deserializeMatch(text: string): MatchState;
