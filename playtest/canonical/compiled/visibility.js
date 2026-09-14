import { assertMatchState } from './invariants.js';
import { validate, projectionSchema } from './schema.js';
import { stableJson } from './serialization.js';
export function assertObserverSnapshot(value) {
    validate(projectionSchema, value);
    const p = value;
    if (!p.players.some(x => x.id === p.observerId))
        throw Error('Unknown observer');
    for (const u of p.ownedUnits)
        if (u.ownerId !== p.observerId || !p.boards.some(b => b.id === u.boardId && b.ownerId === u.ownerId))
            throw Error('Opponent unit in owned projection');
    for (const [owner, k] of Object.entries(p.knowledge)) {
        if (!p.boards.some(b => b.id === k.boardId && b.ownerId === owner))
            throw Error('Projection board mismatch');
        for (const c of k.contacts)
            if (!/^contact-[1-9][0-9]*$/.test(c.id))
                throw Error('Nonlocal contact identifier');
    }
    for (const [i, e] of p.events.entries())
        if (e.sequence !== i + 1 || e.contactId !== null && !/^contact-[1-9][0-9]*$/.test(e.contactId))
            throw Error('Private event metadata');
    for (const [i, d] of p.decisions.entries())
        if (d.sequence !== i + 1)
            throw Error('Nonlocal decision sequence');
}
/** Only a trusted authority/adapter may issue knowledge. Unknown observers fail closed.
 * No auto-reveal from damage, hidden units, history, AI, result or CSS is permitted here.
 */
export function projectObserver(state, observerId) {
    assertMatchState(state);
    if (!state.players.some(p => p.id === observerId))
        throw Error('Unknown observer');
    const k = state.knowledge[observerId];
    if (!k)
        throw Error('Missing observer contract');
    const result = { contract: 'observer-snapshot-v1', matchId: state.matchId, rulesVersion: state.config.rulesVersion, observerId,
        players: state.players.map(p => ({ id: p.id, boardIds: [...p.boardIds] })), boards: state.boards.map(b => ({ id: b.id, ownerId: b.ownerId, width: b.width, height: b.height })),
        ownedUnits: state.units.filter(u => u.ownerId === observerId).map(u => structuredClone(u)), knowledge: structuredClone(k.boards), events: structuredClone(k.events), stats: structuredClone(k.stats), decisions: structuredClone(k.decisions), turn: structuredClone(k.turn), outcome: structuredClone(k.outcome) };
    assertObserverSnapshot(result);
    return result;
}
export function serializeObserver(snapshot) { assertObserverSnapshot(snapshot); return stableJson(snapshot); }
/** Reconnect is the same contract and projection, never serialization of MatchState. */
export function reconnectSnapshot(state, observerId) { return serializeObserver(projectObserver(state, observerId)); }
