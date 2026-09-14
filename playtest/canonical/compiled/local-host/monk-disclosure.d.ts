import type { HostState } from '../host/contracts.js';
/** These are the player's existing public question markers, not the Monk's
 * location or the opponent's private targeting clues. Keep the rule's retained
 * negative-clue quirk intact; presentation does not recompute candidates. */
export declare function publicMonkClues(h: HostState): {
    x: number;
    y: number;
}[];
