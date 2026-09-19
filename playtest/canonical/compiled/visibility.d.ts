import type { MatchState, PlayerId, ObserverSnapshot } from './model.js';
export declare function assertObserverSnapshot(value: unknown): asserts value is ObserverSnapshot;
/** Only a trusted authority/adapter may issue knowledge. Unknown observers fail closed.
 * No auto-reveal from damage, hidden units, history, AI, result or CSS is permitted here.
 */
export declare function projectObserver(state: MatchState, observerId: PlayerId): ObserverSnapshot;
export declare function serializeObserver(snapshot: ObserverSnapshot): string;
/** Reconnect is the same contract and projection, never serialization of MatchState. */
export declare function reconnectSnapshot(state: MatchState, observerId: PlayerId): string;
