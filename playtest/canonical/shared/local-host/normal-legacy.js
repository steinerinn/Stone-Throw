// Generated compatibility policy; original function provenance is in policy-extraction.json.
export function createNormalPolicy(env,nextRandom){
const {ARCHER_COUNT,CASTLE_COUNT,CAV_COUNT,INF_COUNT,PLAGUE_ROUNDS,SIZE,addBattleEvent,alreadyShotOnSide,castleDestroyed,cavCellsAt,cavMap,cellToCav,damageSummary,enemyCastleKnownHits,enemyHeroHuntCandidates,enemyKnownHits,enemyMonkSearchCandidates,enemyRequiredUnitsRemaining,enemyScoutKnowledge,enemyScoutedPlayerCells,enemyShots,eventName,heroActivated,heroKey,key,monkKey,neighbors4,neighbors8,parseKey,playerArcherHitCount,playerCastleDestroyedCount,playerCavDestroyedCount,playerHeroHitsTaken,playerInfHits,playerPlaguePending,playerResurrectionSearchActive,playerResurrectionSuspectUnits,playerResurrectionSuspects,revealPlayerScoutCellForEnemy,sideCastleByCell,sideUnitAt,x,y}=env;
function enemyOldestUnfinishedMultiHitTarget(protectedCells = null) {
    for (const origin of enemyKnownHits) {
        let unfinished = false;
        const cavId = cellToCav.get(origin);
        if (cavId) {
            const info = cavMap.get(cavId);
            if (info) {
                const cells = cavCellsAt(info.x, info.y, info.orient);
                unfinished = cells.some(k => !enemyShots.has(k));
            }
        }
        else {
            const castle = sideCastleByCell('player', origin);
            if (castle)
                unfinished = !castleDestroyed('player', castle);
        }
        if (!unfinished)
            continue;
        const cluster = new Set([origin]);
        const queue = [origin];
        while (queue.length) {
            const hk = queue.shift();
            const { x, y } = parseKey(hk);
            for (const nk of neighbors4(x, y)) {
                if (cluster.has(nk) || !enemyKnownHits.has(nk))
                    continue;
                cluster.add(nk);
                queue.push(nk);
            }
        }
        const scored = new Map();
        for (const hk of cluster) {
            const { x, y } = parseKey(hk);
            for (const nk of neighbors4(x, y)) {
                if (enemyShots.has(nk) || (protectedCells?.has(nk) && !env.groupPlagueFinalCoreCell(nk)))
                    continue;
                const known = enemyScoutKnowledge.get(nk);
                if (known === 'empty' || known === 'special')
                    continue;
                scored.set(nk, (scored.get(nk) || 0) + 1);
            }
        }
        if (!scored.size)
            continue;
        const best = Math.max(...scored.values());
        const candidates = [...scored].filter(([, score]) => score === best).map(([k]) => k);
        return candidates[Math.floor(nextRandom() * candidates.length)];
    }
    return null;
}
function enemyPlagueProtectedCells() {
    const protectedCells = new Set();
    const p = playerPlaguePending;
    if (!p || !Array.isArray(p.outbreaks))
        return protectedCells;
    for (const outbreak of p.outbreaks) {
        const remaining = Math.max(0, PLAGUE_ROUNDS - (outbreak.round || 0));
        if (remaining <= 0)
            continue;
        const seeds = outbreak.infected && outbreak.infected.size
            ? [...outbreak.infected]
            : [outbreak.origin];
        for (const seed of seeds) {
            const { x: sx, y: sy } = parseKey(seed);
            for (let y = 0; y < SIZE; y++) {
                for (let x = 0; x < SIZE; x++) {
                    if (Math.max(Math.abs(x - sx), Math.abs(y - sy)) <= remaining) {
                        protectedCells.add(key(x, y));
                    }
                }
            }
        }
    }
    return protectedCells;
}
// A relocated Hero may sit beside damaged units, where placement spacing no longer applies.
function prioritizeHeroSearch(legal) {
    const nearHits = new Set();
    for (const hit of enemyKnownHits) {
        const {x, y} = parseKey(hit);
        for (const k of neighbors8(x, y)) nearHits.add(k);
    }
    const nearby = legal.filter(k => nearHits.has(k));
    return nearby.length ? nearby : legal;
}
function enemyChoosePlagueSafeSearchTarget() {
    const unfinishedMultiTarget = enemyOldestUnfinishedMultiHitTarget(env.groupPlagueFinalCoreCell ? enemyPlagueProtectedCells() : null);
    if (unfinishedMultiTarget)
        return unfinishedMultiTarget;
    if (playerResurrectionSearchActive && playerResurrectionSuspectUnits.length) {
        const unit = playerResurrectionSuspectUnits[Math.floor(nextRandom() * playerResurrectionSuspectUnits.length)];
        const cells = unit.cells.filter(k => playerResurrectionSuspects.has(k));
        if (cells.length)
            return cells[Math.floor(nextRandom() * cells.length)];
    }
    const protectedCells = enemyPlagueProtectedCells();
    if ((!heroActivated || env.heroOnlyCore) && heroKey && !enemyShots.has(heroKey) &&
        enemyScoutedPlayerCells.has(heroKey) && !protectedCells.has(heroKey)) {
        return heroKey;
    }
    if (env.heroOnlyCore && playerHeroHitsTaken === 2 && heroActivated && heroKey) {
        const heroHunt = [...enemyHeroHuntCandidates].filter(k => !enemyShots.has(k) && !protectedCells.has(k));
        if (heroHunt.length)
            return heroHunt[Math.floor(nextRandom() * heroHunt.length)];
    }
    if (env.heroOnlyCore && heroActivated && heroKey) {
        const pool = [];
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
            const k = key(x, y);
            if (!enemyShots.has(k) && !protectedCells.has(k)) pool.push(k);
        }
        const preferred = prioritizeHeroSearch(pool);
        return preferred.length ? preferred[Math.floor(nextRandom() * preferred.length)] : null;
    }
    const heatPools = { green: [], blue: [], red: [] };
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const k = key(x, y);
            if (enemyShots.has(k) || protectedCells.has(k))
                continue;
            const known = enemyScoutKnowledge.get(k);
            if (known === 'empty' || known === 'special')
                continue;
            let forbidden = false;
            for (const [sk, type] of enemyScoutKnowledge) {
                if (type !== 'special' || env.heroSpacingExemptCells?.has(sk))
                    continue;
                const { x: sx, y: sy } = parseKey(sk);
                if (neighbors8(sx, sy).includes(k)) {
                    forbidden = true;
                    break;
                }
            }
            if (forbidden)
                continue;
            for (const hk of enemyKnownHits) {
                if (!enemyHitShouldForbidNeighbors(hk))
                    continue;
                const { x: hx, y: hy } = parseKey(hk);
                if (neighbors8(hx, hy).includes(k)) {
                    forbidden = true;
                    break;
                }
            }
            if (forbidden)
                continue;
            const edgeDist = Math.min(x, y, SIZE - 1 - x, SIZE - 1 - y);
            if (edgeDist === 0)
                heatPools.green.push(k);
            else if (edgeDist <= 2)
                heatPools.blue.push(k);
            else
                heatPools.red.push(k);
        }
    }
    const fallback = [...heatPools.green, ...heatPools.blue, ...heatPools.red];
    if (!fallback.length)
        return null;
    const roll = nextRandom();
    const preferred = roll < 0.30 ? 'green' : (roll < 0.69 ? 'blue' : 'red');
    const pool = heatPools[preferred].length ? heatPools[preferred] : fallback;
    return pool[Math.floor(nextRandom() * pool.length)];
}
function enemyEndgameEliminationTarget() {
    if (env.heroOnlyCore && heroActivated && heroKey)
        return null;
    const infantryGone = playerInfHits() >= INF_COUNT;
    const archersGone = playerArcherHitCount() >= ARCHER_COUNT;
    const monkGone = !monkKey || enemyShots.has(monkKey);
    if (!(infantryGone && archersGone && monkGone))
        return null;
    const cavalryRemain = playerCavDestroyedCount() < CAV_COUNT;
    const castlesRemain = playerCastleDestroyedCount() < CASTLE_COUNT;
    if (!cavalryRemain && !castlesRemain)
        return null;
    const legal = [];
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const k = key(x, y);
            if (enemyShots.has(k))
                continue;
            const known = enemyScoutKnowledge.get(k);
            if (known === 'empty' || known === 'special')
                continue;
            let forbidden = false;
            for (const [sk, type] of enemyScoutKnowledge) {
                if (type !== 'special' || env.heroSpacingExemptCells?.has(sk))
                    continue;
                const { x: sx, y: sy } = parseKey(sk);
                if (neighbors8(sx, sy).includes(k)) {
                    forbidden = true;
                    break;
                }
            }
            if (forbidden)
                continue;
            for (const hk of enemyKnownHits) {
                if (!enemyHitShouldForbidNeighbors(hk))
                    continue;
                const { x: hx, y: hy } = parseKey(hk);
                if (neighbors8(hx, hy).includes(k)) {
                    forbidden = true;
                    break;
                }
            }
            if (forbidden)
                continue;
            legal.push(k);
        }
    }
    if (!legal.length)
        return null;
    const legalSet = new Set(legal);
    const multiPossible = legal.filter(k => {
        const { x, y } = parseKey(k);
        return neighbors4(x, y).some(nk => legalSet.has(nk));
    });
    if (!multiPossible.length)
        return null;
    const parity0 = [], parity1 = [];
    for (const k of multiPossible) {
        const { x, y } = parseKey(k);
        ((x + y) & 1 ? parity1 : parity0).push(k);
    }
    let pool;
    if (parity0.length && parity1.length) {
        pool = parity0.length >= parity1.length ? parity0 : parity1;
    }
    else {
        pool = parity0.length ? parity0 : parity1;
    }
    if (!pool.length)
        return null;
    return pool[Math.floor(nextRandom() * pool.length)];
}
function enemyChooseTarget() {
    if (playerResurrectionSearchActive && playerResurrectionSuspectUnits.length) {
        const unit = playerResurrectionSuspectUnits[Math.floor(nextRandom() * playerResurrectionSuspectUnits.length)];
        const cells = unit.cells.filter(k => playerResurrectionSuspects.has(k));
        if (cells.length)
            return cells[Math.floor(nextRandom() * cells.length)];
    }
    if ((!heroActivated || env.heroOnlyCore) && heroKey && !enemyShots.has(heroKey) && enemyScoutedPlayerCells.has(heroKey)) {
        return heroKey;
    }
    if (env.heroOnlyCore && playerHeroHitsTaken === 2 && heroActivated && heroKey) {
        const hunt = [...enemyHeroHuntCandidates].filter(k => !enemyShots.has(k));
        if (hunt.length)
            return hunt[Math.floor(nextRandom() * hunt.length)];
    }
    const oldestMultiTarget = enemyOldestUnfinishedMultiHitTarget();
    if (oldestMultiTarget)
        return oldestMultiTarget;
    const monkTargets = [...enemyMonkSearchCandidates].filter(k => !enemyShots.has(k));
    if (monkTargets.length)
        return monkTargets[Math.floor(nextRandom() * monkTargets.length)];
    for (const [k, type] of enemyScoutKnowledge) {
        if (type === 'core' && !enemyShots.has(k) && (env.heroOnlyCore || k !== heroKey))
            return k;
    }
    const endgameTarget = enemyEndgameEliminationTarget();
    if (endgameTarget)
        return endgameTarget;
    if (env.heroOnlyCore && heroActivated && heroKey) {
        const heroSearchPool = [];
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                const k = key(x, y);
                if (!enemyShots.has(k))
                    heroSearchPool.push(k);
            }
        }
        if (heroSearchPool.length) {
            const preferred = prioritizeHeroSearch(heroSearchPool);
            return preferred[Math.floor(nextRandom() * preferred.length)];
        }
        return null;
    }
    const heatPools = { green: [], blue: [], red: [] };
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const k = key(x, y);
            if (enemyShots.has(k))
                continue;
            const known = enemyScoutKnowledge.get(k);
            if (known === 'empty' || known === 'special')
                continue;
            let forbidden = false;
            for (const [sk, type] of enemyScoutKnowledge) {
                if (type !== 'special' || env.heroSpacingExemptCells?.has(sk))
                    continue;
                const { x: sx, y: sy } = parseKey(sk);
                if (neighbors8(sx, sy).includes(k)) {
                    forbidden = true;
                    break;
                }
            }
            if (forbidden)
                continue;
            for (const hk of enemyKnownHits) {
                if (!enemyHitShouldForbidNeighbors(hk))
                    continue;
                const { x: hx, y: hy } = parseKey(hk);
                if (neighbors8(hx, hy).includes(k)) {
                    forbidden = true;
                    break;
                }
            }
            if (forbidden)
                continue;
            const edgeDist = Math.min(x, y, SIZE - 1 - x, SIZE - 1 - y);
            if (edgeDist === 0)
                heatPools.green.push(k);
            else if (edgeDist <= 2)
                heatPools.blue.push(k);
            else
                heatPools.red.push(k);
        }
    }
    const totalLegal = heatPools.green.length + heatPools.blue.length + heatPools.red.length;
    if (!totalLegal)
        return null;
    const roll = nextRandom();
    const preferred = roll < 0.30 ? 'green' : (roll < 0.69 ? 'blue' : 'red');
    if (heatPools[preferred].length) {
        const pool = heatPools[preferred];
        return pool[Math.floor(nextRandom() * pool.length)];
    }
    const fallback = [...heatPools.green, ...heatPools.blue, ...heatPools.red];
    return fallback[Math.floor(nextRandom() * fallback.length)];
}
function enemyHitShouldForbidNeighbors(k) {
    if (env.heroSpacingExemptCells?.has(k)) return false;
    const castle = sideCastleByCell('player', k);
    if (castle && !castleDestroyed('player', castle))
        return false;
    return true;
}
function enemyKnownUnfinishedMultiHitCells() {
    const out = new Set();
    for (const origin of enemyKnownHits) {
        let unfinished = false;
        const cavId = cellToCav.get(origin);
        if (cavId) {
            const info = cavMap.get(cavId);
            if (info) {
                const cells = cavCellsAt(info.x, info.y, info.orient);
                unfinished = cells.some(k => !enemyShots.has(k));
            }
        }
        else {
            const castle = sideCastleByCell('player', origin);
            if (castle)
                unfinished = !castleDestroyed('player', castle);
        }
        if (unfinished)
            out.add(origin);
    }
    return out;
}
function enemyCatapultFreshOrigin(avoidCastleCells, avoidVolleyOrigins, protectedCells = new Set()) {
    const unfinished = enemyKnownUnfinishedMultiHitCells();
    const castles = new Set(avoidCastleCells || []);
    for (const k of enemyCastleKnownHits)
        castles.add(k);
    const priorOrigins = new Set(avoidVolleyOrigins || []);
    const unshot = [];
    for (let y = 0; y < SIZE; y++)
        for (let x = 0; x < SIZE; x++) {
            const k = key(x, y);
            if (!enemyShots.has(k) && !protectedCells.has(k))
                unshot.push(k);
        }
    if (!unshot.length)
        return null;
    if (enemyRequiredUnitsRemaining() <= 2)
        return null;
    const farEnough = (k, castleDist, multiDist, volleyDist) => {
        const { x, y } = parseKey(k);
        const far = (set, d) => ![...set].some(a => { const p = parseKey(a); return Math.max(Math.abs(x - p.x), Math.abs(y - p.y)) < d; });
        return far(castles, castleDist) && far(unfinished, multiDist) && far(priorOrigins, volleyDist);
    };
    const tiers = [[5, 3, 3], [4, 2, 2], [3, 2, 1], [2, 1, 1]];
    for (const [cd, md, vd] of tiers) {
        const pool = unshot.filter(k => farEnough(k, cd, md, vd));
        if (pool.length)
            return bestEnemyCatapultCell(pool, protectedCells);
    }
    return bestEnemyCatapultCell(unshot, protectedCells);
}
function enemyChooseCatapultOrigin(avoidCastleCells = null, avoidVolleyOrigins = null) {
    const protectedCells = enemyPlagueProtectedCells();
    const fresh = enemyCatapultFreshOrigin(avoidCastleCells, avoidVolleyOrigins, protectedCells);
    if (fresh)
        return fresh;
    let k = playerPlaguePending ? enemyChoosePlagueSafeSearchTarget() : enemyChooseTarget();
    if (k && !alreadyShotOnSide('player', k) && !protectedCells.has(k) && catapultOpenScore('player', k, protectedCells, 5) > 1)
        return k;
    const safe = [];
    const all = [];
    for (let y = 0; y < SIZE; y++)
        for (let x = 0; x < SIZE; x++) {
            const c = key(x, y);
            if (enemyShots.has(c))
                continue;
            all.push(c);
            if (!protectedCells.has(c))
                safe.push(c);
        }
    return bestEnemyCatapultCell(safe.length ? safe : all, protectedCells);
}
function bestEnemyCatapultCell(cells, protectedCells = new Set()) {
    if (!cells?.length)
        return null;
    const safe = cells.filter(k => !protectedCells.has(k));
    const pool = safe.length ? safe : cells;
    let best = -1, bestCells = [];
    for (const k of pool) {
        const score = catapultOpenScore('player', k, protectedCells, 5);
        if (score > best) {
            best = score;
            bestCells = [k];
        }
        else if (score === best)
            bestCells.push(k);
    }
    return bestCells.length ? bestCells[Math.floor(nextRandom() * bestCells.length)] : pool[Math.floor(nextRandom() * pool.length)];
}
function catapultOpenScore(targetSide, start, protectedCells = new Set(), limit = 5) {
    if (!start || alreadyShotOnSide(targetSide, start) || protectedCells.has(start))
        return 0;
    const seen = new Set([start]), queue = [start];
    while (queue.length && seen.size < limit) {
        const cur = queue.shift(), p = parseKey(cur);
        const next = neighbors8(p.x, p.y).filter(k => !seen.has(k) && !alreadyShotOnSide(targetSide, k) && !protectedCells.has(k));
        next.sort((a, b) => { const pa = parseKey(a), pb = parseKey(b); const da = neighbors8(pa.x, pa.y).filter(n => !seen.has(n) && !alreadyShotOnSide(targetSide, n) && !protectedCells.has(n)).length; const db = neighbors8(pb.x, pb.y).filter(n => !seen.has(n) && !alreadyShotOnSide(targetSide, n) && !protectedCells.has(n)).length; return db - da; });
        for (const n of next) {
            seen.add(n);
            queue.push(n);
            if (seen.size >= limit)
                break;
        }
    }
    return seen.size;
}
function performEnemySpy(count) {
    const available = [];
    for (let y = 0; y < SIZE; y++)
        for (let x = 0; x < SIZE; x++) {
            const k = key(x, y);
            if (enemyShots.has(k) || enemyScoutedPlayerCells.has(k))
                continue;
            available.push(k);
        }
    const picked = [];
    const pool = [...available];
    while (picked.length < count && pool.length) {
        let choice = null;
        if (heroActivated && playerHeroHitsTaken === 2 && nextRandom() < 0.75) {
            const hunt = pool.filter(k => enemyHeroHuntCandidates.has(k));
            if (hunt.length) {
                choice = hunt[Math.floor(nextRandom() * hunt.length)];
            }
        }
        if (choice === null) {
            choice = pool[Math.floor(nextRandom() * pool.length)];
        }
        picked.push(choice);
        pool.splice(pool.indexOf(choice), 1);
    }
    for (const k of picked)
        revealPlayerScoutCellForEnemy(k);
    const finds = picked.map(k => sideUnitAt('player', k)).filter(Boolean).map(eventName);
    addBattleEvent(finds.length ? `The enemy scouts your lands — finds ${damageSummary(finds)}.` : 'The enemy scouts your lands but reveals no secrets.');
}

return {target:enemyChooseTarget,plagueTarget:enemyChoosePlagueSafeSearchTarget,catapult:enemyChooseCatapultOrigin,catapultRoll:bestEnemyCatapultCell,scout:performEnemySpy,protectedCells:enemyPlagueProtectedCells};
}
