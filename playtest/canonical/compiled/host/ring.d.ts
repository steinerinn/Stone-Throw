import type { HostState } from './contracts.js';
import type { CombatState } from '../combat/contracts.js';
import type { PlayerId } from '../model.js';
export declare function normalTarget(s: CombatState, owner: PlayerId): import("../combat/contracts.js").CombatSeat;
export declare function syncRing(s: CombatState): void;
/** Approved active-ring-only exception: a stale search marker is not surviving core state. */
export declare function survives(s: CombatState, id: PlayerId): boolean;
/** Called after the resolver has exhausted every frame and Human decision. */
export declare function commitEliminations(h: HostState): boolean;
/** Future Chaos capability only: no transport, trigger or entropy. */
export declare function reorderAtBoundary(input: HostState, order: PlayerId[]): HostState;
