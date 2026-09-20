import { statisticalFacts } from './statistical-facts.js';
import { key, parseKey } from '../rules/coordinates.js';
export { key, parseKey };
export const cellKey = (cell) => key(cell.x, cell.y);
export function seat(state, id) { const p = state.seats.find(p => p.playerId === id); if (!p)
    throw Error('Unknown player'); return p; }
export function boardSize(state, id) { const b = state.match.boards.find(b => b.id === id); if (!b || b.width !== b.height)
    throw Error('Unsupported board geometry'); return b.width; }
export function unit(state, id) { const u = state.match.units.find(u => u.id === id); if (!u)
    throw Error('Unknown unit'); return u; }
export function unitAt(state, boardId, k) { if (!state.seats.find(p => p.boardId === boardId)?.occupied.includes(k))
    return null; return state.match.units.find(u => u.boardId === boardId && u.cells.some(c => cellKey(c) === k)) || null; }
export function shot(state, ownerId, k) { return seat(state, ownerId).shots.includes(k); }
export function addUnique(list, v) { if (!list.includes(v))
    list.push(v); }
export function emit(ctx, kind, meta = null, unitId = null, cells = [], amount = null, reason = null) {
    const event = { sequence: ctx.events.length + 1, rootId: ctx.id, workId: ctx.frames.at(-1)?.id || null, kind, meta, unitId, cells: cells.map(c => ({ ...c })), amount, reason };
    if (['impact', 'suspect-eliminated', 'repeat-ignored', 'unit-destroyed', 'unit-damaged', 'hero-killed', 'resurrection', 'scouted', 'attack-started', 'plague-scheduled', 'work-started'].includes(kind))
        event.statistics = statisticalFacts(ctx, event);
    ctx.events.push(event);
    return event;
}
export function destroyed(state, u) { return u.cells.length > 0 && u.cells.every(c => shot(state, u.ownerId, cellKey(c))); }
export function syncDamage(state, u) { u.damage.cells = u.cells.filter(c => shot(state, u.ownerId, cellKey(c))).map(c => ({ ...c })); u.lifecycle = u.hero ? (u.hero.currentCell ? 'present' : 'destroyed') : destroyed(state, u) ? 'destroyed' : 'present'; }
export function reactionMeta(state, u, source, origin) { const p = seat(state, u.ownerId); return { actorId: u.ownerId, ownerId: u.ownerId, targetPlayerId: p.reactionTarget.playerId, targetBoardId: p.reactionTarget.boardId, sourceUnitId: u.id, source, origin: { ...origin } }; }
export function available(state, boardId, ownerId) { const n = boardSize(state, boardId), out = []; for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
        const k = key(x, y);
        if (!shot(state, ownerId, k))
            out.push(k);
    } return out; }
/** Original Plague scheduling retains its triggering turn tag independently of its later mover. */
export function ruleTurn(ctx) { return ctx.frames.at(-1)?.compatibilityTurnId || ctx.activePlayerId; }
/** Target-local clues: normal and reverse attacks can observe different boards. */
export function targetKnowledge(state, owner, target) { if (!state.ring)
    return seat(state, owner); return state.ring.knowledge[owner + ':' + target] ??= { scouted: [], monkCandidates: [] }; }
