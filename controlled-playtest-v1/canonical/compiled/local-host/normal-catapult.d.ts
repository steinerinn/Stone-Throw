import type { HostState } from '../host/contracts.js';
import type { NormalMemory } from './normal-policy.js';
/** Normal resolveCatapultShotsForSide retains Castle stops for this series,
 * including a Castle destroyed by an earlier shot. It records volley origins
 * only for Auto Match / Story Auto Resolve, never for normal enemy play. */
export declare function normalCatapultChoice(h: HostState, memory: NormalMemory): string | null;
