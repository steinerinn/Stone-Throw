import type { HostState } from './contracts.js';
/** Re-materialize authoritative pending facts from compatibility counters.
 * The compatibility counters remain the execution authority for this stage. */
export declare function refreshPending(host: HostState): void;
