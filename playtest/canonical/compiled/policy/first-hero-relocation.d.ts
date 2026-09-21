import type { HostState } from '../host/contracts.js';
import type { PlayerId } from '../model.js';
/** Approved first-hit AI policy only. The resolver supplies the legal set;
 * this policy cannot invent destinations or change subsequent relocations. */
export declare function firstHeroRelocation(h: HostState, owner: PlayerId, legal: string[]): string | null;
