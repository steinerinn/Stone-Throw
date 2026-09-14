import type { ExplicitRng } from './contracts.js';
export declare function createRuleRng(seed?: number, tape?: readonly number[]): ExplicitRng;
export declare function random(rng: ExplicitRng, purpose: string): number;
/** Golden Fisher–Yates order; no draw for empty/singleton pools. */
export declare function shuffle<T>(values: T[], rng: ExplicitRng, purpose: string): void;
