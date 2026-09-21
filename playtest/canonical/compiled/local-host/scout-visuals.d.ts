import type { HostState } from '../host/contracts.js';
export declare function publicScoutOnlyCells(h: HostState, board: string, scouted: Iterable<string>): Set<string>;
export declare function publicEnemyScoutVisuals(h: HostState): Set<string>;
