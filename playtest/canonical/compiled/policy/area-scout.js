import { random } from '../combat/rng.js';
/** Maximize fresh information, using only shots and this observer's scouting. */
export function areaScoutChoice(h, actor, boardId, legal) {
    const target = h.state.seats.find(s => s.boardId === boardId);
    if (!target || !legal.length)
        return null;
    const known = h.state.ring ? h.state.ring.knowledge[actor + ':' + target.playerId]?.scouted || [] : h.state.seats.find(s => s.playerId === actor)?.scouted || [];
    const explored = new Set([...target.shots, ...known]);
    let best = -1, pool = [];
    for (const center of legal) {
        let fresh = 0;
        for (let y = Math.max(0, center.y - 1); y <= Math.min(h.config.size - 1, center.y + 1); y++)
            for (let x = Math.max(0, center.x - 1); x <= Math.min(h.config.size - 1, center.x + 1); x++)
                if (!explored.has(x + ',' + y))
                    fresh++;
        if (fresh > best) {
            best = fresh;
            pool = [center];
        }
        else if (fresh === best)
            pool.push(center);
    }
    const choice = pool.length === 1 ? pool[0] : pool[Math.floor(random(h.rng, 'area-scout-tie') * pool.length)];
    return { ...choice };
}
