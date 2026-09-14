import type { HostState } from '../host/contracts.js';
/** Legacy markScoutedShot is called by direct/Archer paths only. Generic
 * chains and Plague deliberately retain the ring. This is presentation history,
 * not a new scouting rule or a recomputation of authoritative knowledge. */
export declare function publicEnemyScoutVisuals(h: HostState): Set<string>;
