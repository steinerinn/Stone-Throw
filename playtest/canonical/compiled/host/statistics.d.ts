import type { HostState } from './contracts.js';
import type { PlayerId } from '../model.js';
/** Legacy snapshot counts current damage, not cumulative kills across revivals. */
export declare function unitsDestroyed(host: HostState, ownerId: PlayerId): number;
export declare function coreSurvivors(host: HostState, ownerId: PlayerId): number;
