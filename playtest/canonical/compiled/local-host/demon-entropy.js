import { reserveResultMessage } from './result-message.js';
import { random } from '../combat/rng.js';
import { boardSize, cellKey, parseKey } from '../combat/access.js';
import { demonPatternFrom } from '../rules/attacks.js';
const glyphs = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᛉ', 'ᛏ', 'ᛒ', 'ᛞ'];
/** Authorized Stage 10 exception. Legacy visual order is row ascending X,
 * then column ascending Y, deduplicated by the ritual's rune map. Combat's
 * column-first impact order is deliberately not reused here. */
export function reserveNormalDemonRunes(ctx, memory) {
    const frame = ctx.frames.at(-1), op = frame?.current[frame.cursor]?.operation;
    if (op?.kind !== 'attack' || op.entry.kind !== 'demon')
        return;
    const meta = op.entry.meta;
    if (!meta.origin)
        throw Error('Demon presentation requires origin');
    const pattern = demonPatternFrom({ size: boardSize(ctx.state, meta.targetBoardId) }, cellKey(meta.origin)).map(parseKey);
    const row = pattern.filter(c => c.y === meta.origin.y).sort((a, b) => a.x - b.x), column = pattern.filter(c => c.x === meta.origin.x).sort((a, b) => a.y - b.y);
    const seen = new Set(), runes = [];
    for (const cell of [...row, ...column]) {
        const key = cellKey(cell);
        if (seen.has(key))
            continue;
        seen.add(key);
        const glyph = glyphs[Math.floor(random(ctx.rng, 'normal-demon-glyph') * glyphs.length)];
        const rotation = Math.floor(random(ctx.rng, 'normal-demon-rotation') * 8) * 45;
        runes.push({ cell: { ...cell }, glyph, rotation });
    }
    (memory.demonRunes ??= []).push({ boardId: meta.targetBoardId, runes });
}
export const normalExecution = (memory) => ({ reserveNormalDemonRunes: ctx => reserveNormalDemonRunes(ctx, memory), normalTerminalMessage: host => reserveResultMessage(host, memory) });
