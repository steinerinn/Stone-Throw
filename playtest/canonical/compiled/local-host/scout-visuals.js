import { cellKey } from '../combat/access.js';
/** Legacy markScoutedShot is called by direct/Archer paths only. Generic
 * chains and Plague deliberately retain the ring. This is presentation history,
 * not a new scouting rule or a recomputation of authoritative knowledge. */
export function publicEnemyScoutVisuals(h) {
    const self = h.config.players[0].id, enemy = h.config.players[1].id, lastScout = new Map();
    for (const k of h.state.seats[0].scouted)
        lastScout.set(k, -1);
    for (const r of h.history)
        if (r.command.kind === 'answer' && r.command.answer.actorId === self) {
            for (let i = r.eventStart; i < r.eventEnd; i++) {
                const e = h.events[i]?.event;
                if (e?.kind === 'scouted')
                    for (const c of e.cells)
                        lastScout.set(cellKey(c), i);
            }
        }
    const visible = new Set(lastScout.keys());
    for (let i = 0; i < h.events.length; i++) {
        const e = h.events[i].event;
        if (e.kind === 'impact' && e.meta?.targetPlayerId === enemy && ['direct-human', 'direct-ai', 'archer'].includes(e.meta.source))
            for (const c of e.cells) {
                const k = cellKey(c);
                if (i > (lastScout.get(k) ?? Infinity))
                    visible.delete(k);
            }
    }
    return visible;
}
