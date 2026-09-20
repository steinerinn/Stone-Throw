import { deduceMonkCandidates } from './monk-deduction.js';
/** Public deduction is independent of combat/AI compatibility candidates. */
export function publicMonkClues(h, seen) {
    const [self, target] = h.config.players;
    const evidence = h.state.match.knowledge[self.id].boards[target.id]?.clues.find(c => c.kind === 'monk-candidates')?.cells ?? [];
    return deduceMonkCandidates(h.config.size, evidence, seen);
}
