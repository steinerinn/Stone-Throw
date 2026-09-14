/** Only resolved, publicly observable impact sites and the public reaction origin.
 * No planned random targets, private unit IDs or hidden geometry leave this adapter. */
export function animationCue(h, events, groups) {
    const e = events.find(e => e.kind === 'impact' && e.meta && ['direct-human', 'direct-ai', 'catapult-shot', 'wizard', 'archer', 'goblin', 'demon-blast', 'dragon'].includes(e.meta.source));
    if (!e?.meta || !e.cells[0])
        return;
    const m = e.meta, own = h.config.players.findIndex(p => p.id === m.ownerId), target = h.config.players.findIndex(p => p.id === m.targetPlayerId);
    if (own < 0 || target < 0 || own > 1 || target > 1)
        return;
    if (m.source.startsWith('direct-') && (own !== 1 || target !== 0))
        return;
    const kind = (m.source.startsWith('direct-') ? 'enemy-shot' : m.source === 'catapult-shot' ? 'catapult' : m.source === 'demon-blast' ? 'demon' : m.source);
    const frame = h.pendingRoot?.frames.find(f => f.id === e.workId), op = frame?.current[Math.max(0, frame.cursor - 1)]?.operation;
    const step = op && (op.kind === 'catapult' || op.kind === 'catapult-resume') ? op.impact : undefined;
    const key = e.rootId + ':' + e.workId + ':' + m.source;
    if (step === 0 || !groups.has(key))
        groups.set(key, Math.max(0, ...groups.values()) + 1);
    return { kind, side: target === 0 ? 'self' : 'opponent', ownerSide: own === 0 ? 'self' : 'opponent', origin: { ...(m.origin || e.cells[0]) }, cell: { ...e.cells[0] }, group: groups.get(key), ...(step !== undefined ? { step } : {}) };
}
/** Attach only the public cause of an already-visible impact; never identity/geometry/RNG. */
export function impactSources(events, delta, selfBoard, opponentBoard) {
    const sources = { 'direct-human': 'direct', 'direct-ai': 'direct', archer: 'archer', 'catapult-shot': 'catapult', goblin: 'goblin', wizard: 'wizard', dragon: 'dragon', 'demon-blast': 'demon', plague: 'plague', 'monk-deflect': 'monk' };
    return events.map(e => { if (!e.cell || !['impact', 'miss'].includes(e.kind))
        return e; const hit = delta.find(q => q.kind === 'impact' && q.meta && [selfBoard, opponentBoard].includes(q.meta.targetBoardId) && (q.meta.targetBoardId === selfBoard ? 'self' : 'opponent') === e.side && q.cells.some(c => c.x === e.cell.x && c.y === e.cell.y)); const source = hit?.meta && sources[hit.meta.source]; return source ? { ...e, source } : e; });
}
