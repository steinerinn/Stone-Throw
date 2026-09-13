import { seat, cellKey } from '../combat/access.js';
/** Legacy snapshot counts current damage, not cumulative kills across revivals. */
export function unitsDestroyed(host, ownerId) { const p = seat(host.state, ownerId); return host.state.match.units.filter(u => u.ownerId === ownerId).reduce((n, u) => n + (u.hero ? (u.hero.activated && !u.hero.currentCell ? 1 : 0) : (u.cells.length > 0 && u.cells.every(c => p.shots.includes(cellKey(c))) ? 1 : 0)), 0); }
export function coreSurvivors(host, ownerId) { const p = seat(host.state, ownerId), keys = new Set(); for (const u of host.state.match.units.filter(u => u.ownerId === ownerId)) {
    if (['inf', 'cav', 'castle', 'archer', 'monk'].includes(u.type ?? ""))
        for (const c of u.cells)
            keys.add(cellKey(c));
    else if (u.hero?.activated && u.hero.currentCell)
        keys.add(cellKey(u.hero.currentCell));
} return [...keys].filter(k => !p.shots.includes(k)).length; }
