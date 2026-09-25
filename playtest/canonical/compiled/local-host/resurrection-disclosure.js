import { cellKey } from '../combat/access.js';
/** Authorized active enemy-search privacy exception. Never consult the actual
 * resurrected identity, damage, shots, abilities or resurrection count here. */
export function enemyResurrectionSearch(h) {
    const enemy = h.config.players[1], seat = h.state.seats.find(s => s.playerId === enemy.id);
    if (h.status === 'complete' || !seat.resurrection.searchActive)
        return { active: false, cells: [] };
    const cells = seat.resurrection.suspects.flatMap(id => { const u = h.state.match.units.find(u => u.id === id && u.ownerId === enemy.id); if (!u?.type || !['inf', 'cav', 'archer', 'monk'].includes(u.type))
        throw Error('Invalid public resurrection casualty'); return u.cells.map(cell => ({ cell: { ...cell }, kind: u.type })); });
    cells.sort((a, b) => a.cell.y - b.cell.y || a.cell.x - b.cell.x);
    return { active: true, cells };
}
export function maskResurrectionCells(cells, search) {
    if (!search.active)
        return cells;
    const keys = new Set(search.cells.map(c => cellKey(c.cell)));
    return [...cells.filter(c => !keys.has(cellKey(c.cell))), ...search.cells.map(c => ({ cell: { ...c.cell }, kind: c.kind, observation: 'uncertain' }))].sort((a, b) => a.cell.y - b.cell.y || a.cell.x - b.cell.x);
}
export function knownCasualtyCells(h, cells) {
    const enemy = h.config.players[1], seat = h.state.seats.find(s => s.playerId === enemy.id), known = new Set(cells.filter(c => c.kind !== null).map(c => cellKey(c.cell)));
    return cells.map(c => { if (!c.kind)
        return c; const u = h.state.match.units.find(u => u.ownerId === enemy.id && u.cells.some(p => cellKey(p) === cellKey(c.cell))); if (!u || !u.cells.every(p => known.has(cellKey(p)) && seat.shots.includes(cellKey(p))))
        return c; return { ...c, knownDestroyed: true }; });
}
/** Legacy UI permits attempting a click, while the authority validates it.
 * Do not publish which private suspect is accepted by Scout/Catapult. */
export function maskResurrectionChoices(cells, search, scouted) {
    if (!search.active)
        return cells;
    const map = new Map(cells.map(c => [cellKey(c), { ...c }]));
    for (const c of search.cells)
        if (!scouted.includes(cellKey(c.cell)))
            map.set(cellKey(c.cell), { ...c.cell });
    return [...map.values()].sort((a, b) => a.y - b.y || a.x - b.x);
}
/** Existing aim-assist geometry, with private resurrection shot removal masked.
 * Fully destroyed units have already disclosed their complete footprint. */
export function publicAimAssist(h) {
    if (h.status === 'placement' || h.status === 'complete')
        return [];
    const enemy = h.config.players[1], seat = h.state.seats.find(s => s.playerId === enemy.id), units = h.state.match.units.filter(u => u.ownerId === enemy.id), hero = units.find(u => u.type === 'hero');
    // Assassin ignores spacing, but does not disable the ordinary-unit spacing hints.
    // Never subtract its private location from the shaded cells; shots remain legal.
    if (hero?.hero?.activated && hero.hero.currentCell)
        return [];
    const search = enemyResurrectionSearch(h), destroyed = new Set(search.cells.map(c => cellKey(c.cell))), shots = new Set([...seat.shots, ...destroyed]);
    for (const u of units) {
        if (u.type === 'assassin')
            continue;
        if (u.type === 'hero') {
            const c = u.hero?.originalCell;
            if (!u.hero?.currentCell && c && shots.has(cellKey(c)))
                destroyed.add(cellKey(c));
            continue;
        }
        if (u.cells.length && u.cells.every(c => shots.has(cellKey(c))))
            for (const c of u.cells)
                destroyed.add(cellKey(c));
    }
    const impossible = new Set();
    for (const k of destroyed) {
        const [x, y] = k.split(',').map(Number);
        for (let dx = -1; dx <= 1; dx++)
            for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx, ny = y + dy, n = nx + ',' + ny;
                if (nx >= 0 && ny >= 0 && nx < h.config.size && ny < h.config.size && !destroyed.has(n) && !shots.has(n))
                    impossible.add(n);
            }
    }
    return [...impossible].map(k => { const [x, y] = k.split(',').map(Number); return { x: x, y: y }; }).sort((a, b) => a.y - b.y || a.x - b.x);
}
