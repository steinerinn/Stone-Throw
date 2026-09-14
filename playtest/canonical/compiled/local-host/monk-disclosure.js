import { parseKey } from '../combat/access.js';
/** These are the player's existing public question markers, not the Monk's
 * location or the opponent's private targeting clues. Keep the rule's retained
 * negative-clue quirk intact; presentation does not recompute candidates. */
export function publicMonkClues(h) {
    return h.state.seats[0].monkCandidates.map(parseKey);
}
