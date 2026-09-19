import type { HostState } from '../host/contracts.js';
import type { StrengthSample, PublicStatistics } from '../client-contract/public.js';
export interface StatisticsMemory {
    strength: StrengthSample[];
    rounds: {
        round: number;
        player: number;
        enemy: number;
    }[];
    lastCells: number[];
}
export declare const emptyStatistics: () => StatisticsMemory;
/** The only hidden statistic exception. Candidate footprints are already-public
 * casualties. Compare possible contributions, never publish the selected one. */
export declare function enemyStrengthUnknown(h: HostState): boolean;
/** Called by private execution, never by renderer timing or reads. Known samples
 * keep the legacy per-round replacement. An unknown sample is never backfilled. */
export declare function captureStatistics(h: HostState, m: StatisticsMemory, round?: number): void;
export declare function publicStatistics(h: HostState, m: StatisticsMemory): PublicStatistics;
