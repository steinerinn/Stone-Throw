import type { HostState, PolicyMemory } from '../host/contracts.js';
import type { PlayerId } from '../model.js';
/** Compatibility-only policy: intentionally consults private unit identities and
 * geometry as the legacy Auto Match does. Never use as an observer API. */
export declare const brain: (h: HostState, id: PlayerId) => PolicyMemory;
export declare const draw: (h: HostState, purpose: string) => number;
export declare function pick<T>(h: HostState, list: readonly T[], purpose: string): T | null;
export declare function protectedCells(h: HostState, targetId: PlayerId): Set<string>;
export declare function autoMatchTarget(h: HostState, actor: PlayerId, plagueAware?: boolean): string | null;
export declare function scoutChoices(h: HostState, actor: PlayerId, count: number): string[];
