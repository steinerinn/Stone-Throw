// Private observation only. No mutation, randomness, or public projection.
export function shotAudit(h, c) {
    const same = (a, b) => a.x === b.x && a.y === b.y;
    const target = h.state.seats.find(s => s.boardId === c.boardId), key = c.cell.x + ',' + c.cell.y;
    const unit = h.state.match.units.find(u => u.boardId === c.boardId && u.lifecycle === 'present' && (u.hero?.currentCell ? same(u.hero.currentCell, c.cell) : u.cells.some(k => same(k, c.cell))));
    const knowledge = Object.values(h.state.match.knowledge[c.actorId]?.boards || {}).find(b => b.boardId === c.boardId);
    const evidence = (cells) => !knowledge || (knowledge.cells.some(k => cells.some(c => same(c, k.cell))) || knowledge.contacts.some(k => k.cells.some(c => cells.some(x => same(c, x)))) || knowledge.clues.some(k => k.cells.some(c => cells.some(x => same(c, x)))));
    // Any prior unit damage counts as information, including partial Castle geometry.
    const unitKnown = !!unit && (unit.damage.cells.length > 0 || !!unit.hero?.hitsTaken || evidence(unit.cells));
    return { version: 1, unitId: unit?.id || null, unitType: unit?.type || null, hit: !!target?.occupied.includes(key) && !target.shots.includes(key), core: !!unit && (['inf', 'cav', 'archer', 'monk', 'castle'].includes(unit.type || '') || !!unit.hero?.activated), previouslyKnown: !!target?.shots.includes(key) || evidence([c.cell]), unitPreviouslyKnown: unitKnown };
}
