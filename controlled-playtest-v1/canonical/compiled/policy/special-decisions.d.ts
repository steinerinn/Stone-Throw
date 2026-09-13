import type { HostState } from '../host/contracts.js';
import type { PlayerId } from '../model.js';
export declare function catapultOpenScore(h: HostState, target: PlayerId, start: string, protectedSet?: Set<string>, limit?: number): number;
export declare function bestCatapult(h: HostState, actor: PlayerId, cells: readonly string[], protectedSet?: Set<string>): string | null;
export declare function catapultOrigin(h: HostState, actor: PlayerId, avoidKnown?: readonly string[], avoidOrigins?: readonly string[]): string | null;
export declare function heroPlagueSafe(h: HostState, owner: PlayerId, candidates: readonly string[]): string[];
export declare function heroRelocation(h: HostState, owner: PlayerId): string | null;
/** Second-hit legacy policy: the second seat prefers unscouted cells, then
 * applies Plague distance safety; the first seat keeps the raw neighbor order. */
export declare function heroLocalEscape(h: HostState, owner: PlayerId, legal: readonly string[]): string | null;
