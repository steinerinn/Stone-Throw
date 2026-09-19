import { random } from '../combat/rng.js';
import { RESULT_DRAW_LINES, RESULT_WIN_LINES, RESULT_LOSE_LINES } from './result-lines.js';
/** Separate audit: legacy's synchronous result-line draw, not a new entropy
 * exception. The presentation receives only the selected existing prose. */
export function reserveResultMessage(host, memory) {
    if (memory.resultMessage !== undefined)
        return;
    const outcome = host.state.match.outcome;
    if (outcome.kind !== 'win' && outcome.kind !== 'draw')
        throw Error('Result before terminal outcome');
    const lines = outcome.kind === 'draw' ? RESULT_DRAW_LINES : outcome.winnerIds.includes(host.config.players[0].id) ? RESULT_WIN_LINES : RESULT_LOSE_LINES;
    memory.resultMessage = lines[Math.floor(random(host.rng, 'normal-result-message') * lines.length)];
}
