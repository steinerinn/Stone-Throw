import { normalTarget, survives } from '../host/ring.js';
import { attackBlockedCells, seat, unitAt, available, parseKey, cellKey, boardSize } from './access.js';
import { resolveImpact } from './impact.js';
import { neighbors8 } from '../rules/coordinates.js';
import { random } from './rng.js';
import { pushFrame, work } from './scheduling.js';
import { requireDecision } from './decisions.js';
function finish(ctx, generated) { const operations = [{ kind: 'hero-queue' }, ...generated.map(entry => ({ kind: 'wave', entries: [entry], terminalCheck: true })), { kind: 'terminal-check', reason: 'catapult-sibling' }]; pushFrame(ctx, 'catapult', operations); }
export function catapultImpact(ctx, meta, cell, impact, generated) { const p = seat(ctx.state, meta.targetPlayerId), k = cellKey(cell); if (attackBlockedCells(ctx.state, meta.targetPlayerId).has(k)) {
    finish(ctx, generated);
    return;
} const type = unitAt(ctx.state, meta.targetBoardId, k)?.type, result = resolveImpact(ctx, meta, cell); if (result.reaction)
    generated.push(result.reaction); if (type === 'castle' || impact === 4) {
    finish(ctx, generated);
    return;
} const next = neighbors8({ size: boardSize(ctx.state, meta.targetBoardId) }, cell.x, cell.y).filter(k => !attackBlockedCells(ctx.state, meta.targetPlayerId).has(k)); if (!next.length) {
    finish(ctx, generated);
    return;
} if (seat(ctx.state, meta.ownerId).decisionMode === 'interactive') {
    const dest = next[Math.floor(random(ctx.rng, 'catapult-roll') * next.length)];
    ctx.frames.at(-1).current.splice(ctx.frames.at(-1).cursor, 0, work(ctx, { kind: 'catapult', meta, cell: parseKey(dest), impact: impact + 1, generated }));
}
else {
    const d = requireDecision(ctx, 'catapult-roll', meta.ownerId, meta.targetBoardId, meta.sourceUnitId, next.map(parseKey));
    ctx.frames.at(-1).current.splice(ctx.frames.at(-1).cursor, 0, work(ctx, { kind: 'catapult-resume', meta, impact: impact + 1, generated, decisionId: d.id }));
} }
export function catapultSeries(ctx, ownerId, remaining) { if (remaining <= 0)
    return; const p = seat(ctx.state, ownerId), target = normalTarget(ctx.state, ownerId); if (ctx.state.ring && !survives(ctx.state, target.playerId)) {
    p.catapultLater += remaining;
    return;
} const cells = available(ctx.state, target.boardId, target.playerId); if (!cells.length)
    return; const meta = { actorId: ownerId, ownerId, targetPlayerId: target.playerId, targetBoardId: target.boardId, sourceUnitId: null, source: 'catapult-shot', origin: null }; const d = requireDecision(ctx, 'catapult-target', ownerId, target.boardId, null, cells.map(parseKey)); const frame = ctx.frames.at(-1); frame.current.splice(frame.cursor, 0, work(ctx, { kind: 'catapult-resume', meta, impact: 0, generated: [], decisionId: d.id }), work(ctx, { kind: 'catapult-series', ownerId, remaining: remaining - 1 })); }
