import type { HostState } from './contracts.js';
import type { PlayerId } from '../model.js';
/** Private scoring evidence at the settled elimination boundary; no gameplay writes. */
export declare function recordEliminationScores(h: HostState, targets: PlayerId[]): void;
