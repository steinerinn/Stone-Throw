import { consumeCompatibilityEntropy } from './entropy.js';
import { id } from '../model.js';
import { emit, ruleTurn } from './access.js';
export function work(ctx, operation, timing = 'attack-remainder', parentId = null) { return { id: id(`${ctx.id}-work-${ctx.nextWork++}`), rootId: ctx.id, parentId: parentId || ctx.frames.at(-1)?.id || null, timing, operation }; }
export function pushFrame(ctx, kind, operations, terminalCheck = false) { const frame = { detachedPlague: null, compatibilityTurnId: ruleTurn(ctx), id: id(`${ctx.id}-frame-${ctx.nextWork++}`), kind, current: [], next: [], deferred: [], cursor: 0, terminalCheck, stage: 'body' }; frame.current = operations.map(op => work(ctx, op, kind === 'interrupt' ? 'immediate-interrupt' : 'attack-remainder', frame.id)); ctx.frames.push(frame); return frame; }
export function goblinLast(entries) { return [...entries.filter(e => e.kind !== 'goblin'), ...entries.filter(e => e.kind === 'goblin')]; }
export function waveOperations(entries) { return goblinLast(entries).flatMap(entry => [{ kind: 'attack', entry }, { kind: 'hero-queue' }]); }
export function complete(ctx, reason = 'settled') { consumeCompatibilityEntropy(ctx); if (ctx.externalEntropy.length)
    throw Error('Unconsumed legacy entropy'); if (ctx.completedAtEvent !== null)
    throw Error('Resolution already completed'); ctx.status = 'complete'; const ev = emit(ctx, 'resolution-completed', null, null, [], null, reason); ctx.completedAtEvent = ev.sequence; }
/** Called only at a legacy terminal boundary, not whenever a core becomes damaged.
 * Remaining siblings stay auditable as cancelled work, never silently drained. */
export function terminalTruncate(ctx, reason) {
    ctx.state.plagues = [];
    ctx.state.heroQueue = [];
    ctx.state.monkDuelActive = false;
    for (const seat of ctx.state.seats) {
        seat.dwarfNow = 0;
        seat.catapultNow = 0;
        seat.elfNow = false;
        seat.clericNow = false;
        seat.releaseNow = false;
        seat.currentChainBonus = 0;
    }
    const omitted = ctx.frames.reduce((n, f) => n + f.current.length - f.cursor + f.next.length, 0);
    emit(ctx, 'compatibility-truncation', null, null, [], omitted, reason);
    for (const d of ctx.decisions)
        if (d.status === 'pending') {
            d.status = 'cancelled';
            emit(ctx, 'decision-cancelled', null, d.unitId, [], null, reason);
        }
    ctx.frames = [];
    complete(ctx, reason);
}
