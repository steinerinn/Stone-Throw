import type { ExplicitRng, Outbreak } from '../contracts.js';
export declare function plagueBranchCount(rng: ExplicitRng): number;
export declare function plagueOpenScore(size: number, k: string, shots: ReadonlySet<string>, reserved: ReadonlySet<string>): number;
export declare function plagueWeightedChoice(size: number, options: readonly string[], shots: ReadonlySet<string>, reserved: ReadonlySet<string>, rng: ExplicitRng): string | null;
export declare function plagueWholeEdgeCandidates(size: number, outbreak: Readonly<Outbreak>, shots: ReadonlySet<string>, reserved: ReadonlySet<string>): string[];
