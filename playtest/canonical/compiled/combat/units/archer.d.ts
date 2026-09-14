import type { Cell } from '../../model.js';
import type { ExplicitRng } from '../contracts.js';
export declare const ARCHER_WEIGHTS: readonly number[];
export declare function archerShotCount(rng: ExplicitRng): number;
export declare function archerTargets(size: number, origin: Cell, shots: ReadonlySet<string>, count: number, rng: ExplicitRng): Cell[];
