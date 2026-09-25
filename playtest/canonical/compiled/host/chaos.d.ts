import type { HostState } from './contracts.js';
export declare function livingDemons(h: HostState): boolean;
export declare function beginChaosBoundary(h: HostState): void;
export declare function observeChaosBoundary(h: HostState): void;
/** Only invoked after the entire root and elimination commit, never from an impact. */
export declare function settleChaos(h: HostState): void;
