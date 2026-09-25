import { random } from '../combat/rng.js';
import * as legality from '../rules/placement.js';
import * as geometry from '../rules/index.js';
/** Mechanically isolated compatibility policy; source provenance records each omitted visual statement. */
export function legacyRandomPlacement(profile, SIZE, roster, rng, STORY_MODE_ACTIVE = false, STORY_BATTLE_NUMBER = 0, fixedCells = []) {
    if (roster.assassin) {
        const out = legacyRandomPlacement(profile, SIZE, { ...roster, assassin: 0 }, rng, STORY_MODE_ACTIVE, STORY_BATTLE_NUMBER, fixedCells), occupied = new Set([...fixedCells, ...out.flatMap(u => u.cells)]);
        for (let i = 0; i < roster.assassin; i++) {
            const legal = Array.from({ length: SIZE * SIZE }, (_, i) => (i % SIZE) + ',' + Math.floor(i / SIZE)).filter(k => !occupied.has(k));
            if (!legal.length)
                throw Error('No Assassin space');
            const normal = legal.filter(k => { const [x, y] = k.split(',').map(Number); return legality.canPlaceInf({ size: SIZE, occupied }, x, y); }), castleCells = out.filter(u => u.type === 'castle').flatMap(u => u.cells), beside = legal.filter(k => { const [x, y] = k.split(',').map(Number); return castleCells.some(c => { const [cx, cy] = c.split(',').map(Number); return Math.abs(x - cx) + Math.abs(y - cy) === 1; }); }), preferNormal = random(rng, 'placement:assassin-style') < .5, preferred = preferNormal ? normal : beside, other = preferNormal ? beside : normal, pool = preferred.length ? preferred : other.length ? other : legal;
            const k = pool[Math.floor(random(rng, 'placement:assassin') * pool.length)];
            out.push({ type: 'assassin', cells: [k] });
            occupied.add(k);
        }
        return out;
    }
    // The retained legacy policy has singleton Elf bookkeeping. Extend its legal
    // placement result rather than misclassifying a second Elf as Infantry.
    if ((roster.elf || 0) > 1) {
        const out = legacyRandomPlacement(profile, SIZE, { ...roster, elf: 1 }, rng, STORY_MODE_ACTIVE, STORY_BATTLE_NUMBER, fixedCells), occupied = new Set([...fixedCells, ...out.flatMap(u => u.cells)]);
        for (let i = 1; i < (roster.elf || 0); i++) {
            const legal = [];
            for (let y = 0; y < SIZE; y++)
                for (let x = 0; x < SIZE; x++)
                    if (legality.canPlaceInf({ size: SIZE, occupied }, x, y))
                        legal.push(x + ',' + y);
            if (!legal.length)
                throw Error('No legal area Elf placement');
            const k = legal[Math.floor(random(rng, 'placement:area-elf') * legal.length)];
            out.push({ type: 'elf', cells: [k] });
            occupied.add(k);
        }
        return out;
    }
    const nextRandom = () => random(rng, 'placement:' + profile), CASTLE_SIZE = 5;
    const INF_COUNT = roster.inf || 0, CAV_COUNT = roster.cav || 0, ARCHER_COUNT = roster.archer || 0, MONK_COUNT = roster.monk || 0, CASTLE_COUNT = roster.castle || 0, DWARF_COUNT = roster.dwarf || 0, GOBLIN_COUNT = roster.goblin || 0, CATAPULT_COUNT = roster.catapult || 0, ELF_COUNT = roster.elf || 0, CLERIC_COUNT = roster.cleric || 0, DEMON_COUNT = roster.demon || 0, DRAGON_COUNT = roster.dragon || 0, WIZARD_COUNT = roster.wizard || 0, NECRO_COUNT = roster.necro || 0, HERO_COUNT = roster.hero || 0;
    const CURRENT_ENEMY_ROSTER = roster;
    const playerUnits = new Set(), enemyUnits = new Set(), enemyInfKeys = new Set(), playerArcherAbilityUsed = new Set(), enemyArcherAbilityUsed = new Set();
    const cavMap = new Map(), enemyCavMap = new Map(), cellToCav = new Map(), enemyCellToCav = new Map(), playerCastles = new Map(), enemyCastles = new Map();
    const playerArcherKeys = [], enemyArcherKeys = [], playerCatapultKeys = [], enemyCatapultKeys = [], playerNecroKeys = [], enemyNecroKeys = [];
    let cavIdSeq = 0, castleIdSeq = 0, enemyCastleIdSeq = 0;
    let monkKey = null, dwarfKey = null, goblinKey = null, elfKey = null, clericKey = null, demonKey = null, dragonKey = null, wizardKey = null, heroKey = null;
    let enemyMonkKey = null, enemyDwarfKey = null, enemyGoblinKey = null, enemyElfKey = null, enemyClericKey = null, enemyDemonKey = null, enemyDragonKey = null, enemyWizardKey = null, enemyHeroKey = null, heroActivated = false, enemyHeroActivated = false;
    const key = geometry.key, parseKey = geometry.parseKey, inBounds = (x, y) => geometry.inBounds({ size: SIZE }, x, y), neighbors4 = (x, y) => geometry.neighbors4({ size: SIZE }, x, y), ring3x3CellsOf = (cells) => geometry.ring3x3CellsOf({ size: SIZE }, cells), cavCellsAt = (x, y, o) => geometry.cavCellsAt(x, y, o), castleCellsConnected = (cells) => legality.castleCellsConnected({ size: SIZE }, cells);
    const playerCanPlaceSingles = (k) => { const p = parseKey(k); return legality.canPlaceInf({ size: SIZE, occupied: playerUnits }, p.x, p.y); }, enemyCanPlaceSingles = (k) => { const p = parseKey(k); return legality.canPlaceInf({ size: SIZE, occupied: enemyUnits }, p.x, p.y); }, playerCanPlaceCavAt = (x, y, o) => legality.canPlaceCav({ size: SIZE, occupied: playerUnits }, x, y, o).ok, enemyCanPlaceCav = (x, y, o) => legality.canPlaceCav({ size: SIZE, occupied: enemyUnits }, x, y, o).ok;
    const sideCastleByCell = (side, k) => [...(side === 'player' ? playerCastles : enemyCastles).values()].find(c => c.cells.has(k));
    function randomConnectedCastleCells(occupiedSet, maxShapeAttempts = 1200) {
        const cellAllowed = (candidate, own) => {
            if (occupiedSet.has(candidate) || own.has(candidate))
                return false;
            const { x, y } = parseKey(candidate);
            if (!inBounds(x, y))
                return false;
            const around = ring3x3CellsOf([candidate]);
            for (const ak of around) {
                if (own.has(ak))
                    continue;
                if (occupiedSet.has(ak))
                    return false;
            }
            return true;
        };
        for (let attempt = 0; attempt < maxShapeAttempts; attempt++) {
            const sx = Math.floor(nextRandom() * SIZE), sy = Math.floor(nextRandom() * SIZE);
            const start = key(sx, sy);
            if (!cellAllowed(start, new Set()))
                continue;
            const own = new Set([start]);
            let failed = false;
            while (own.size < CASTLE_SIZE) {
                const candidates = new Set();
                for (const ck of own) {
                    const { x, y } = parseKey(ck);
                    for (const nk of neighbors4(x, y)) {
                        if (cellAllowed(nk, own))
                            candidates.add(nk);
                    }
                }
                if (!candidates.size) {
                    failed = true;
                    break;
                }
                const arr = [...candidates];
                own.add(arr[Math.floor(nextRandom() * arr.length)]);
            }
            if (!failed && own.size === CASTLE_SIZE && castleCellsConnected(own))
                return [...own];
        }
        return null;
    }
    function placeRandomPlayerCastles() {
        playerCastles.clear();
        castleIdSeq = 0;
        for (let i = 0; i < CASTLE_COUNT; i++) {
            const cells = randomConnectedCastleCells(playerUnits);
            if (!cells)
                return false;
            const id = `castle-${++castleIdSeq}`;
            const castle = { id, cells: new Set(cells), complete: true };
            playerCastles.set(id, castle);
            for (const k of cells) {
                playerUnits.add(k);
                const { x, y } = parseKey(k);
            }
        }
        return true;
    }
    function placeRandomEnemyCastles() {
        enemyCastles.clear();
        enemyCastleIdSeq = 0;
        for (let i = 0; i < CASTLE_COUNT; i++) {
            const cells = randomConnectedCastleCells(enemyUnits);
            if (!cells)
                return false;
            const id = `ecastle-${++enemyCastleIdSeq}`;
            enemyCastles.set(id, { id, cells: new Set(cells), complete: true });
            for (const k of cells)
                enemyUnits.add(k);
        }
        return true;
    }
    function randomBool() { return nextRandom() < 0.5; }
    function enemyRandomNearMonk(maxDist = 2, avoidOuterEdge = false) {
        if (!enemyMonkKey)
            return null;
        const m = parseKey(enemyMonkKey), candidates = [];
        for (let y = Math.max(0, m.y - maxDist); y <= Math.min(SIZE - 1, m.y + maxDist); y++) {
            for (let x = Math.max(0, m.x - maxDist); x <= Math.min(SIZE - 1, m.x + maxDist); x++) {
                if (avoidOuterEdge && (x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1))
                    continue;
                const k = key(x, y);
                if (enemyCanPlaceSingles(k))
                    candidates.push(k);
            }
        }
        return candidates.length ? candidates[Math.floor(nextRandom() * candidates.length)] : null;
    }
    function enemyMonkPreferredCell(x, y) {
        return x >= 2 && x <= SIZE - 3 && y >= 2 && y <= SIZE - 3;
    }
    function archerAllowedCell(x, y) {
        return x >= 1 && x <= SIZE - 2 && y >= 1 && y <= SIZE - 2;
    }
    function clericFarEnoughFromMonk(clericK, monkK) {
        if (!clericK || !monkK)
            return true;
        const c = parseKey(clericK), m = parseKey(monkK);
        return Math.max(Math.abs(c.x - m.x), Math.abs(c.y - m.y)) >= 3;
    }
    function placeEnemyStoryCoreRoster(roster) {
        for (let attempt = 0; attempt < 500; attempt++) {
            enemyUnits.clear();
            for (const k of fixedCells)
                enemyUnits.add(k);
            enemyInfKeys.clear();
            enemyCavMap.clear();
            enemyCellToCav.clear();
            enemyArcherKeys.length = 0;
            enemyArcherAbilityUsed.clear();
            enemyMonkKey = null;
            enemyCastles.clear();
            enemyCastleIdSeq = 0;
            enemyDwarfKey = null;
            enemyGoblinKey = null;
            enemyCatapultKeys.length = 0;
            enemyElfKey = null;
            enemyClericKey = null;
            enemyDemonKey = null;
            enemyDragonKey = null;
            enemyWizardKey = null;
            enemyNecroKeys.length = 0;
            enemyHeroKey = null;
            enemyHeroActivated = false;
            let castleOK = true;
            for (let i = 0; i < (roster.castle || 0); i++) {
                const cells = randomConnectedCastleCells(enemyUnits);
                if (!cells) {
                    castleOK = false;
                    break;
                }
                const id = `ecastle-${++enemyCastleIdSeq}`;
                enemyCastles.set(id, { id, cells: new Set(cells), complete: true });
                for (const k of cells)
                    enemyUnits.add(k);
            }
            if (!castleOK)
                continue;
            let cav = 0;
            for (let tries = 0; cav < (roster.cav || 0) && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), orient = randomBool() ? 'H' : 'V';
                if (!enemyCanPlaceCav(x, y, orient))
                    continue;
                const cells = cavCellsAt(x, y, orient);
                if (tries < 1900 && cells.some(c => { const p = parseKey(c); return p.x === 0 || p.y === 0 || p.x === SIZE - 1 || p.y === SIZE - 1; }))
                    continue;
                const id = `ecav-${cav + 1}`;
                enemyCavMap.set(id, { x, y, orient, cells });
                for (const k of cells) {
                    enemyUnits.add(k);
                    enemyCellToCav.set(k, id);
                }
                cav++;
            }
            if (cav < (roster.cav || 0))
                continue;
            let cat = 0;
            for (let tries = 0; cat < (roster.catapult || 0) && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!enemyCanPlaceSingles(k))
                    continue;
                enemyUnits.add(k);
                enemyCatapultKeys.push(k);
                cat++;
            }
            if (cat < (roster.catapult || 0))
                continue;
            let dwarf = 0;
            for (let tries = 0; dwarf < (roster.dwarf || 0) && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!enemyCanPlaceSingles(k))
                    continue;
                enemyUnits.add(k);
                enemyDwarfKey = k;
                dwarf++;
            }
            if (dwarf < (roster.dwarf || 0))
                continue;
            let elf = 0;
            for (let tries = 0; elf < (roster.elf || 0) && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!enemyCanPlaceSingles(k))
                    continue;
                enemyUnits.add(k);
                enemyElfKey = k;
                elf++;
            }
            if (elf < (roster.elf || 0))
                continue;
            let gob = 0;
            for (let tries = 0; gob < (roster.goblin || 0) && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!enemyCanPlaceSingles(k))
                    continue;
                enemyUnits.add(k);
                enemyGoblinKey = k;
                gob++;
            }
            if (gob < (roster.goblin || 0))
                continue;
            let cleric = 0;
            for (let tries = 0; cleric < (roster.cleric || 0) && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!enemyCanPlaceSingles(k))
                    continue;
                enemyUnits.add(k);
                enemyClericKey = k;
                cleric++;
            }
            if (cleric < (roster.cleric || 0))
                continue;
            let monk = 0;
            for (let tries = 0; monk < (roster.monk || 0) && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!enemyMonkPreferredCell(x, y) || !clericFarEnoughFromMonk(enemyClericKey, k) || !enemyCanPlaceSingles(k))
                    continue;
                enemyUnits.add(k);
                enemyMonkKey = k;
                monk++;
            }
            if (monk < (roster.monk || 0))
                continue;
            let nec = 0;
            for (let tries = 0; nec < (roster.necro || 0) && tries < 5000; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!enemyCanPlaceSingles(k))
                    continue;
                enemyUnits.add(k);
                enemyNecroKeys.push(k);
                nec++;
            }
            if (nec < (roster.necro || 0))
                continue;
            let dragon = 0;
            const storyEnemyDragonTactical = nextRandom() < 0.85;
            for (let tries = 0; dragon < (roster.dragon || 0) && tries < 2500; tries++) {
                let x, y;
                if (storyEnemyDragonTactical) {
                    x = 3 + Math.floor(nextRandom() * Math.max(1, SIZE - 6));
                    y = 3 + Math.floor(nextRandom() * Math.max(1, SIZE - 6));
                }
                else {
                    x = Math.floor(nextRandom() * SIZE);
                    y = Math.floor(nextRandom() * SIZE);
                }
                const k = key(x, y);
                if (!enemyCanPlaceSingles(k))
                    continue;
                enemyUnits.add(k);
                enemyDragonKey = k;
                dragon++;
            }
            if (dragon < (roster.dragon || 0))
                continue;
            let demon = 0;
            for (let tries = 0; demon < (roster.demon || 0) && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!enemyCanPlaceSingles(k))
                    continue;
                enemyUnits.add(k);
                enemyDemonKey = k;
                demon++;
            }
            if (demon < (roster.demon || 0))
                continue;
            let wizard = 0;
            const storyEnemyWizardBand = nextRandom() < 0.10 ? 1 : 2;
            for (let tries = 0; wizard < (roster.wizard || 0) && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), edgeDist = Math.min(x, y, SIZE - 1 - x, SIZE - 1 - y);
                if ((storyEnemyWizardBand === 1 && edgeDist !== 1) || (storyEnemyWizardBand === 2 && edgeDist < 2))
                    continue;
                const k = key(x, y);
                if (!enemyCanPlaceSingles(k))
                    continue;
                enemyUnits.add(k);
                enemyWizardKey = k;
                wizard++;
            }
            if (wizard < (roster.wizard || 0))
                continue;
            let hero = 0;
            const storyEnemyCastleCells = [...enemyUnits].filter(c => sideCastleByCell('enemy', c));
            for (let tries = 0; hero < (roster.hero || 0) && tries < 3500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y), edgeDist = Math.min(x, y, SIZE - 1 - x, SIZE - 1 - y);
                if (edgeDist < 2 || !enemyCanPlaceSingles(k))
                    continue;
                if (tries < 2500 && storyEnemyCastleCells.length && !nearAnyCells(k, storyEnemyCastleCells, 2))
                    continue;
                enemyUnits.add(k);
                enemyHeroKey = k;
                hero++;
            }
            if (hero < (roster.hero || 0))
                continue;
            let arch = 0;
            for (let tries = 0; arch < (roster.archer || 0) && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!archerAllowedCell(x, y) || !enemyCanPlaceSingles(k))
                    continue;
                enemyUnits.add(k);
                enemyArcherKeys.push(k);
                arch++;
            }
            if (arch < (roster.archer || 0))
                continue;
            let inf = 0;
            for (let tries = 0; inf < (roster.inf || 0) && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!enemyCanPlaceSingles(k))
                    continue;
                enemyUnits.add(k);
                enemyInfKeys.add(k);
                inf++;
            }
            if (inf === (roster.inf || 0))
                return;
        }
        throw new Error(`Story Battle ${STORY_BATTLE_NUMBER} enemy placement failed.`);
    }
    function placeEnemyRandom() {
        if (STORY_MODE_ACTIVE)
            return placeEnemyStoryCoreRoster(CURRENT_ENEMY_ROSTER);
        for (let boardAttempt = 0; boardAttempt < 80; boardAttempt++) {
            enemyUnits.clear();
            for (const k of fixedCells)
                enemyUnits.add(k);
            enemyInfKeys.clear();
            enemyCavMap.clear();
            enemyCellToCav.clear();
            enemyArcherKeys.length = 0;
            enemyArcherAbilityUsed.clear();
            enemyMonkKey = null;
            enemyCastles.clear();
            enemyCastleIdSeq = 0;
            enemyDwarfKey = null;
            enemyGoblinKey = null;
            enemyCatapultKeys.length = 0;
            enemyElfKey = null;
            enemyClericKey = null;
            enemyDemonKey = null;
            enemyDragonKey = null;
            enemyWizardKey = null;
            enemyNecroKeys.length = 0;
            enemyHeroKey = null;
            enemyHeroActivated = false;
            if (!placeRandomEnemyCastles())
                continue;
            let enemyHeroPlacementTries = 0;
            while (!enemyHeroKey && enemyHeroPlacementTries < 5000) {
                enemyHeroPlacementTries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                const edgeDist = Math.min(rx, ry, SIZE - 1 - rx, SIZE - 1 - ry);
                if (edgeDist < 2)
                    continue;
                if (!enemyCanPlaceSingles(k))
                    continue;
                const castleCells = [...enemyUnits].filter(c => sideCastleByCell('enemy', c));
                if (enemyHeroPlacementTries < 3500 && !nearAnyCells(k, castleCells, 2))
                    continue;
                enemyUnits.add(k);
                enemyHeroKey = k;
            }
            if (!enemyHeroKey)
                continue;
            let cid = 0, tries = 0;
            while (cid < CAV_COUNT && tries < 8000) {
                tries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE);
                const orient = randomBool() ? 'H' : 'V';
                if (!enemyCanPlaceCav(rx, ry, orient))
                    continue;
                const cells = cavCellsAt(rx, ry, orient);
                const touchesEdge = cells.some(c => {
                    const p = parseKey(c);
                    return p.x === 0 || p.y === 0 || p.x === SIZE - 1 || p.y === SIZE - 1;
                });
                if (touchesEdge && tries < 6000)
                    continue;
                const id = `ecav-${cid + 1}`;
                enemyCavMap.set(id, { x: rx, y: ry, orient, cells });
                for (const c of cells) {
                    enemyUnits.add(c);
                    enemyCellToCav.set(c, id);
                }
                cid++;
            }
            tries = 0;
            while (!enemyClericKey && tries < 5000) {
                tries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                if (enemyCanPlaceSingles(k)) {
                    enemyUnits.add(k);
                    enemyClericKey = k;
                }
            }
            tries = 0;
            while (!enemyMonkKey && tries < 5000) {
                tries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                if (!enemyMonkPreferredCell(rx, ry))
                    continue;
                if (!clericFarEnoughFromMonk(enemyClericKey, k))
                    continue;
                if (enemyCanPlaceSingles(k)) {
                    enemyUnits.add(k);
                    enemyMonkKey = k;
                }
            }
            let arch = 0;
            tries = 0;
            while (arch < ARCHER_COUNT && tries < 5000) {
                tries++;
                const attracted = nextRandom() < 0.10;
                let k = attracted ? enemyRandomNearMonk(2, true) : null;
                let rx, ry;
                if (k) {
                    ({ x: rx, y: ry } = parseKey(k));
                }
                else {
                    rx = Math.floor(nextRandom() * SIZE);
                    ry = Math.floor(nextRandom() * SIZE);
                    k = key(rx, ry);
                }
                if (!archerAllowedCell(rx, ry))
                    continue;
                if (enemyCanPlaceSingles(k)) {
                    enemyUnits.add(k);
                    enemyArcherKeys.push(k);
                    arch++;
                }
            }
            const enemyDwarfAttracted = nextRandom() < 0.20;
            tries = 0;
            while (!enemyDwarfKey && tries < 5000) {
                tries++;
                let k = enemyDwarfAttracted ? enemyRandomNearMonk(2, false) : null;
                if (!k)
                    k = key(Math.floor(nextRandom() * SIZE), Math.floor(nextRandom() * SIZE));
                if (enemyCanPlaceSingles(k)) {
                    enemyUnits.add(k);
                    enemyDwarfKey = k;
                }
            }
            const enemyGoblinAttracted = nextRandom() < 0.20;
            tries = 0;
            while (!enemyGoblinKey && tries < 5000) {
                tries++;
                let k = enemyGoblinAttracted ? enemyRandomNearMonk(2, false) : null;
                if (!k)
                    k = key(Math.floor(nextRandom() * SIZE), Math.floor(nextRandom() * SIZE));
                if (enemyCanPlaceSingles(k)) {
                    enemyUnits.add(k);
                    enemyGoblinKey = k;
                }
            }
            let cat = 0;
            tries = 0;
            while (cat < CATAPULT_COUNT && tries < 5000) {
                tries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                if (enemyCanPlaceSingles(k)) {
                    enemyUnits.add(k);
                    enemyCatapultKeys.push(k);
                    cat++;
                }
            }
            const enemyElfAttracted = nextRandom() < 0.20;
            tries = 0;
            while (!enemyElfKey && tries < 5000) {
                tries++;
                let k = enemyElfAttracted ? enemyRandomNearMonk(2, false) : null;
                if (!k)
                    k = key(Math.floor(nextRandom() * SIZE), Math.floor(nextRandom() * SIZE));
                if (enemyCanPlaceSingles(k)) {
                    enemyUnits.add(k);
                    enemyElfKey = k;
                }
            }
            const enemyDemonAttracted = nextRandom() < 0.20;
            tries = 0;
            while (!enemyDemonKey && tries < 5000) {
                tries++;
                let k = enemyDemonAttracted ? enemyRandomNearMonk(2, false) : null;
                if (!k)
                    k = key(Math.floor(nextRandom() * SIZE), Math.floor(nextRandom() * SIZE));
                if (enemyCanPlaceSingles(k)) {
                    enemyUnits.add(k);
                    enemyDemonKey = k;
                }
            }
            const enemyDragonAttracted = nextRandom() < 0.20;
            const dragonTacticalPlacement = nextRandom() < 0.85;
            tries = 0;
            while (!enemyDragonKey && tries < 5000) {
                tries++;
                let k = null;
                if (enemyDragonAttracted && enemyMonkKey) {
                    const m = parseKey(enemyMonkKey), candidates = [];
                    for (let y = Math.max(0, m.y - 2); y <= Math.min(SIZE - 1, m.y + 2); y++) {
                        for (let x = Math.max(0, m.x - 2); x <= Math.min(SIZE - 1, m.x + 2); x++) {
                            if (dragonTacticalPlacement && (x < 3 || x >= SIZE - 3 || y < 3 || y >= SIZE - 3))
                                continue;
                            const kk = key(x, y);
                            if (enemyCanPlaceSingles(kk))
                                candidates.push(kk);
                        }
                    }
                    if (candidates.length)
                        k = candidates[Math.floor(nextRandom() * candidates.length)];
                }
                if (!k) {
                    let rx, ry;
                    if (dragonTacticalPlacement) {
                        rx = 3 + Math.floor(nextRandom() * Math.max(1, SIZE - 6));
                        ry = 3 + Math.floor(nextRandom() * Math.max(1, SIZE - 6));
                    }
                    else {
                        rx = Math.floor(nextRandom() * SIZE);
                        ry = Math.floor(nextRandom() * SIZE);
                    }
                    k = key(rx, ry);
                }
                if (enemyCanPlaceSingles(k)) {
                    enemyUnits.add(k);
                    enemyDragonKey = k;
                }
            }
            if (!enemyDragonKey) {
                tries = 0;
                while (!enemyDragonKey && tries < 5000) {
                    tries++;
                    const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                    if (enemyCanPlaceSingles(k)) {
                        enemyUnits.add(k);
                        enemyDragonKey = k;
                    }
                }
            }
            const enemyWizardAttracted = nextRandom() < 0.20;
            const enemyWizardRoll = nextRandom();
            const enemyWizardBand = enemyWizardRoll < 0.10 ? 1 : 2;
            tries = 0;
            while (!enemyWizardKey && tries < 5000) {
                tries++;
                let k = null;
                if (enemyWizardAttracted && enemyMonkKey) {
                    const m = parseKey(enemyMonkKey), candidates = [];
                    for (let y = Math.max(0, m.y - 2); y <= Math.min(SIZE - 1, m.y + 2); y++) {
                        for (let x = Math.max(0, m.x - 2); x <= Math.min(SIZE - 1, m.x + 2); x++) {
                            const edgeDist = Math.min(x, y, SIZE - 1 - x, SIZE - 1 - y);
                            if ((enemyWizardBand === 1 && edgeDist !== 1) || (enemyWizardBand === 2 && edgeDist < 2))
                                continue;
                            const kk = key(x, y);
                            if (enemyCanPlaceSingles(kk))
                                candidates.push(kk);
                        }
                    }
                    if (candidates.length)
                        k = candidates[Math.floor(nextRandom() * candidates.length)];
                }
                if (!k) {
                    const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE);
                    k = key(rx, ry);
                    const edgeDist = Math.min(rx, ry, SIZE - 1 - rx, SIZE - 1 - ry);
                    if ((enemyWizardBand === 1 && edgeDist !== 1) || (enemyWizardBand === 2 && edgeDist < 2))
                        continue;
                }
                if (enemyCanPlaceSingles(k)) {
                    enemyUnits.add(k);
                    enemyWizardKey = k;
                }
            }
            if (!enemyWizardKey) {
                tries = 0;
                while (!enemyWizardKey && tries < 5000) {
                    tries++;
                    const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                    if (Math.min(rx, ry, SIZE - 1 - rx, SIZE - 1 - ry) < 1)
                        continue;
                    if (enemyCanPlaceSingles(k)) {
                        enemyUnits.add(k);
                        enemyWizardKey = k;
                    }
                }
            }
            let nec = 0;
            tries = 0;
            while (nec < NECRO_COUNT && tries < 8000) {
                tries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                if (enemyCanPlaceSingles(k)) {
                    enemyUnits.add(k);
                    enemyNecroKeys.push(k);
                    nec++;
                }
            }
            let inf = 0;
            tries = 0;
            while (inf < INF_COUNT && tries < 5000) {
                tries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE);
                const k = key(rx, ry);
                if (enemyCanPlaceSingles(k)) {
                    enemyUnits.add(k);
                    enemyInfKeys.add(k);
                    inf++;
                }
            }
            const enemyReady = enemyCastles.size === CASTLE_COUNT &&
                cid === CAV_COUNT && arch === ARCHER_COUNT && !!enemyMonkKey &&
                !!enemyDwarfKey && !!enemyGoblinKey && cat === CATAPULT_COUNT &&
                !!enemyElfKey && !!enemyClericKey && !!enemyDemonKey &&
                !!enemyDragonKey && !!enemyWizardKey && nec === NECRO_COUNT && !!enemyHeroKey &&
                inf === INF_COUNT;
            if (enemyReady)
                return;
        }
        throw new Error('Enemy random placement failed after repeated full-board retries.');
    }
    function nearAnyCells(k, cells, maxDist = 2) {
        const p = parseKey(k);
        for (const c of cells) {
            const q = parseKey(c);
            if (Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) <= maxDist)
                return true;
        }
        return false;
    }
    function playerRandomNearMonk(maxDist = 2, avoidOuterEdge = false) {
        if (!monkKey)
            return null;
        const m = parseKey(monkKey), candidates = [];
        for (let y = Math.max(0, m.y - maxDist); y <= Math.min(SIZE - 1, m.y + maxDist); y++) {
            for (let x = Math.max(0, m.x - maxDist); x <= Math.min(SIZE - 1, m.x + maxDist); x++) {
                if (avoidOuterEdge && (x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1))
                    continue;
                const k = key(x, y);
                if (playerCanPlaceSingles(k))
                    candidates.push(k);
            }
        }
        return candidates.length ? candidates[Math.floor(nextRandom() * candidates.length)] : null;
    }
    function randomPlayerStoryCoreRoster() {
        for (let attempt = 0; attempt < 500; attempt++) {
            playerUnits.clear();
            for (const k of fixedCells)
                playerUnits.add(k);
            cavMap.clear();
            cellToCav.clear();
            cavIdSeq = 0;
            playerCastles.clear();
            castleIdSeq = 0;
            playerArcherKeys.length = 0;
            playerArcherAbilityUsed.clear();
            monkKey = null;
            dwarfKey = null;
            goblinKey = null;
            playerCatapultKeys.length = 0;
            elfKey = null;
            clericKey = null;
            demonKey = null;
            dragonKey = null;
            wizardKey = null;
            playerNecroKeys.length = 0;
            heroKey = null;
            heroActivated = false;
            let castleOK = true;
            for (let i = 0; i < CASTLE_COUNT; i++) {
                const cells = randomConnectedCastleCells(playerUnits);
                if (!cells) {
                    castleOK = false;
                    break;
                }
                const id = `castle-${++castleIdSeq}`, castle = { id, cells: new Set(cells), complete: true };
                playerCastles.set(id, castle);
                for (const k of cells) {
                    playerUnits.add(k);
                    const p = parseKey(k);
                }
            }
            if (!castleOK)
                continue;
            let cav = 0;
            for (let tries = 0; cav < CAV_COUNT && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), orient = randomBool() ? 'H' : 'V';
                if (!playerCanPlaceCavAt(x, y, orient))
                    continue;
                const cells = cavCellsAt(x, y, orient);
                if (tries < 1900 && cells.some(c => { const p = parseKey(c); return p.x === 0 || p.y === 0 || p.x === SIZE - 1 || p.y === SIZE - 1; }))
                    continue;
                const id = `cav-${++cavIdSeq}`;
                for (const k of cells) {
                    playerUnits.add(k);
                    cellToCav.set(k, id);
                    const p = parseKey(k);
                }
                cavMap.set(id, { x, y, orient });
                cav++;
            }
            if (cav < CAV_COUNT)
                continue;
            let cat = 0;
            for (let tries = 0; cat < CATAPULT_COUNT && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!playerCanPlaceSingles(k))
                    continue;
                playerUnits.add(k);
                playerCatapultKeys.push(k);
                cat++;
            }
            if (cat < CATAPULT_COUNT)
                continue;
            let dwarf = 0;
            for (let tries = 0; dwarf < DWARF_COUNT && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!playerCanPlaceSingles(k))
                    continue;
                playerUnits.add(k);
                dwarfKey = k;
                dwarf++;
            }
            if (dwarf < DWARF_COUNT)
                continue;
            let elf = 0;
            for (let tries = 0; elf < ELF_COUNT && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!playerCanPlaceSingles(k))
                    continue;
                playerUnits.add(k);
                elfKey = k;
                elf++;
            }
            if (elf < ELF_COUNT)
                continue;
            let gob = 0;
            for (let tries = 0; gob < GOBLIN_COUNT && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!playerCanPlaceSingles(k))
                    continue;
                playerUnits.add(k);
                goblinKey = k;
                gob++;
            }
            if (gob < GOBLIN_COUNT)
                continue;
            let cleric = 0;
            for (let tries = 0; cleric < CLERIC_COUNT && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!playerCanPlaceSingles(k))
                    continue;
                playerUnits.add(k);
                clericKey = k;
                cleric++;
            }
            if (cleric < CLERIC_COUNT)
                continue;
            let monk = 0;
            for (let tries = 0; monk < MONK_COUNT && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!enemyMonkPreferredCell(x, y) || !clericFarEnoughFromMonk(clericKey, k) || !playerCanPlaceSingles(k))
                    continue;
                playerUnits.add(k);
                monkKey = k;
                monk++;
            }
            if (monk < MONK_COUNT)
                continue;
            let nec = 0;
            for (let tries = 0; nec < NECRO_COUNT && tries < 5000; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!playerCanPlaceSingles(k))
                    continue;
                playerUnits.add(k);
                playerNecroKeys.push(k);
                nec++;
            }
            if (nec < NECRO_COUNT)
                continue;
            let dragon = 0;
            const storyPlayerDragonTactical = nextRandom() < 0.85;
            for (let tries = 0; dragon < DRAGON_COUNT && tries < 2500; tries++) {
                let x, y;
                if (storyPlayerDragonTactical) {
                    x = 3 + Math.floor(nextRandom() * Math.max(1, SIZE - 6));
                    y = 3 + Math.floor(nextRandom() * Math.max(1, SIZE - 6));
                }
                else {
                    x = Math.floor(nextRandom() * SIZE);
                    y = Math.floor(nextRandom() * SIZE);
                }
                const k = key(x, y);
                if (!playerCanPlaceSingles(k))
                    continue;
                playerUnits.add(k);
                dragonKey = k;
                dragon++;
            }
            if (dragon < DRAGON_COUNT)
                continue;
            let demon = 0;
            for (let tries = 0; demon < DEMON_COUNT && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!playerCanPlaceSingles(k))
                    continue;
                playerUnits.add(k);
                demonKey = k;
                demon++;
            }
            if (demon < DEMON_COUNT)
                continue;
            let wizard = 0;
            const storyPlayerWizardBand = nextRandom() < 0.10 ? 1 : 2;
            for (let tries = 0; wizard < WIZARD_COUNT && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), edgeDist = Math.min(x, y, SIZE - 1 - x, SIZE - 1 - y);
                if ((storyPlayerWizardBand === 1 && edgeDist !== 1) || (storyPlayerWizardBand === 2 && edgeDist < 2))
                    continue;
                const k = key(x, y);
                if (!playerCanPlaceSingles(k))
                    continue;
                playerUnits.add(k);
                wizardKey = k;
                wizard++;
            }
            if (wizard < WIZARD_COUNT)
                continue;
            let hero = 0;
            const storyPlayerCastleCells = [...playerUnits].filter(c => sideCastleByCell('player', c));
            for (let tries = 0; hero < HERO_COUNT && tries < 3500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y), edgeDist = Math.min(x, y, SIZE - 1 - x, SIZE - 1 - y);
                if (edgeDist < 2 || !playerCanPlaceSingles(k))
                    continue;
                if (tries < 2500 && storyPlayerCastleCells.length && !nearAnyCells(k, storyPlayerCastleCells, 2))
                    continue;
                playerUnits.add(k);
                heroKey = k;
                hero++;
            }
            if (hero < HERO_COUNT)
                continue;
            let arch = 0;
            for (let tries = 0; arch < ARCHER_COUNT && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!archerAllowedCell(x, y) || !playerCanPlaceSingles(k))
                    continue;
                playerUnits.add(k);
                playerArcherKeys.push(k);
                arch++;
            }
            if (arch < ARCHER_COUNT)
                continue;
            let inf = 0;
            for (let tries = 0; inf < INF_COUNT && tries < 2500; tries++) {
                const x = Math.floor(nextRandom() * SIZE), y = Math.floor(nextRandom() * SIZE), k = key(x, y);
                if (!playerCanPlaceSingles(k))
                    continue;
                playerUnits.add(k);
                inf++;
            }
            if (inf < INF_COUNT)
                continue;
            return;
        }
        throw new Error(`Story Battle ${STORY_BATTLE_NUMBER} player placement failed.`);
    }
    function randomPlayerPlacement() {
        if (STORY_MODE_ACTIVE)
            return randomPlayerStoryCoreRoster();
        const MAX_ATTEMPTS = 50;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            playerUnits.clear();
            for (const k of fixedCells)
                playerUnits.add(k);
            cavMap.clear();
            cellToCav.clear();
            cavIdSeq = 0;
            playerCastles.clear();
            castleIdSeq = 0;
            playerArcherKeys.length = 0;
            playerArcherAbilityUsed.clear();
            monkKey = null;
            dwarfKey = null;
            goblinKey = null;
            playerCatapultKeys.length = 0;
            elfKey = null;
            clericKey = null;
            demonKey = null;
            dragonKey = null;
            wizardKey = null;
            playerNecroKeys.length = 0;
            heroKey = null;
            heroActivated = false;
            if (!placeRandomPlayerCastles())
                continue;
            let heroPlaced = false, heroTries = 0;
            while (!heroPlaced && heroTries < 5000) {
                heroTries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                const edgeDist = Math.min(rx, ry, SIZE - 1 - rx, SIZE - 1 - ry);
                if (edgeDist < 2)
                    continue;
                if (!playerCanPlaceSingles(k))
                    continue;
                const castleCells = [...playerUnits].filter(c => sideCastleByCell('player', c));
                if (heroTries < 3500 && !nearAnyCells(k, castleCells, 2))
                    continue;
                playerUnits.add(k);
                heroKey = k;
                heroPlaced = true;
            }
            if (!heroPlaced)
                continue;
            let cav = 0, cavTries = 0;
            while (cav < CAV_COUNT && cavTries < 8000) {
                cavTries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE);
                const orient = randomBool() ? 'H' : 'V';
                if (!playerCanPlaceCavAt(rx, ry, orient))
                    continue;
                const cells = cavCellsAt(rx, ry, orient);
                const touchesEdge = cells.some(c => {
                    const p = parseKey(c);
                    return p.x === 0 || p.y === 0 || p.x === SIZE - 1 || p.y === SIZE - 1;
                });
                if (touchesEdge && cavTries < 6000)
                    continue;
                const id = `cav-${++cavIdSeq}`;
                for (const c of cells) {
                    playerUnits.add(c);
                    cellToCav.set(c, id);
                    const { x, y } = parseKey(c);
                }
                cavMap.set(id, { x: rx, y: ry, orient });
                cav++;
            }
            if (cav < CAV_COUNT)
                continue;
            let clericPlaced = false, clericTries = 0;
            while (!clericPlaced && clericTries < 5000) {
                clericTries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                if (playerCanPlaceSingles(k)) {
                    playerUnits.add(k);
                    clericKey = k;
                    clericPlaced = true;
                }
            }
            if (!clericPlaced)
                continue;
            let monkPlaced = false, monkTries = 0;
            while (!monkPlaced && monkTries < 5000) {
                monkTries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                if (!enemyMonkPreferredCell(rx, ry))
                    continue;
                if (!clericFarEnoughFromMonk(clericKey, k))
                    continue;
                if (playerCanPlaceSingles(k)) {
                    playerUnits.add(k);
                    monkKey = k;
                    monkPlaced = true;
                }
            }
            if (!monkPlaced)
                continue;
            let arch = 0, archTries = 0;
            while (arch < ARCHER_COUNT && archTries < 5000) {
                archTries++;
                const attracted = nextRandom() < 0.10;
                let k = attracted ? playerRandomNearMonk(2, true) : null;
                let rx, ry;
                if (k) {
                    ({ x: rx, y: ry } = parseKey(k));
                }
                else {
                    rx = Math.floor(nextRandom() * SIZE);
                    ry = Math.floor(nextRandom() * SIZE);
                    k = key(rx, ry);
                }
                if (!archerAllowedCell(rx, ry))
                    continue;
                if (playerCanPlaceSingles(k)) {
                    playerUnits.add(k);
                    playerArcherKeys.push(k);
                    arch++;
                }
            }
            if (arch < ARCHER_COUNT)
                continue;
            let dwarfPlaced = false, dwarfTries = 0;
            const playerDwarfAttracted = nextRandom() < 0.20;
            while (!dwarfPlaced && dwarfTries < 5000) {
                dwarfTries++;
                let k = playerDwarfAttracted ? playerRandomNearMonk(2, false) : null;
                if (!k)
                    k = key(Math.floor(nextRandom() * SIZE), Math.floor(nextRandom() * SIZE));
                if (playerCanPlaceSingles(k)) {
                    playerUnits.add(k);
                    dwarfKey = k;
                    const p = parseKey(k);
                    dwarfPlaced = true;
                }
            }
            if (!dwarfPlaced)
                continue;
            let goblinPlaced = false, goblinTries = 0;
            const playerGoblinAttracted = nextRandom() < 0.20;
            while (!goblinPlaced && goblinTries < 5000) {
                goblinTries++;
                let k = playerGoblinAttracted ? playerRandomNearMonk(2, false) : null;
                if (!k)
                    k = key(Math.floor(nextRandom() * SIZE), Math.floor(nextRandom() * SIZE));
                if (playerCanPlaceSingles(k)) {
                    playerUnits.add(k);
                    goblinKey = k;
                    const p = parseKey(k);
                    goblinPlaced = true;
                }
            }
            if (!goblinPlaced)
                continue;
            let cat = 0, catTries = 0;
            while (cat < CATAPULT_COUNT && catTries < 5000) {
                catTries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                if (playerCanPlaceSingles(k)) {
                    playerUnits.add(k);
                    playerCatapultKeys.push(k);
                    cat++;
                }
            }
            if (cat < CATAPULT_COUNT)
                continue;
            let elfPlaced = false, elfTries = 0;
            const playerElfAttracted = nextRandom() < 0.20;
            while (!elfPlaced && elfTries < 5000) {
                elfTries++;
                let k = playerElfAttracted ? playerRandomNearMonk(2, false) : null;
                if (!k)
                    k = key(Math.floor(nextRandom() * SIZE), Math.floor(nextRandom() * SIZE));
                if (playerCanPlaceSingles(k)) {
                    playerUnits.add(k);
                    elfKey = k;
                    const p = parseKey(k);
                    elfPlaced = true;
                }
            }
            if (!elfPlaced)
                continue;
            let demonPlaced = false, demonTries = 0;
            const playerDemonAttracted = nextRandom() < 0.20;
            while (!demonPlaced && demonTries < 5000) {
                demonTries++;
                let k = playerDemonAttracted ? playerRandomNearMonk(2, false) : null;
                if (!k)
                    k = key(Math.floor(nextRandom() * SIZE), Math.floor(nextRandom() * SIZE));
                if (playerCanPlaceSingles(k)) {
                    playerUnits.add(k);
                    demonKey = k;
                    const p = parseKey(k);
                    demonPlaced = true;
                }
            }
            if (!demonPlaced)
                continue;
            let dragonPlaced = false, dragonTries = 0;
            const playerDragonAttracted = nextRandom() < 0.20;
            const playerDragonTacticalPlacement = nextRandom() < 0.85;
            while (!dragonPlaced && dragonTries < 5000) {
                dragonTries++;
                let k = null;
                if (playerDragonAttracted && monkKey) {
                    const m = parseKey(monkKey), candidates = [];
                    for (let y = Math.max(0, m.y - 2); y <= Math.min(SIZE - 1, m.y + 2); y++) {
                        for (let x = Math.max(0, m.x - 2); x <= Math.min(SIZE - 1, m.x + 2); x++) {
                            if (playerDragonTacticalPlacement && (x < 3 || x >= SIZE - 3 || y < 3 || y >= SIZE - 3))
                                continue;
                            const kk = key(x, y);
                            if (playerCanPlaceSingles(kk))
                                candidates.push(kk);
                        }
                    }
                    if (candidates.length)
                        k = candidates[Math.floor(nextRandom() * candidates.length)];
                }
                let rx, ry;
                if (!k) {
                    if (playerDragonTacticalPlacement) {
                        rx = 3 + Math.floor(nextRandom() * Math.max(1, SIZE - 6));
                        ry = 3 + Math.floor(nextRandom() * Math.max(1, SIZE - 6));
                    }
                    else {
                        rx = Math.floor(nextRandom() * SIZE);
                        ry = Math.floor(nextRandom() * SIZE);
                    }
                    k = key(rx, ry);
                }
                if (playerCanPlaceSingles(k)) {
                    playerUnits.add(k);
                    dragonKey = k;
                    const p = parseKey(k);
                    dragonPlaced = true;
                }
            }
            if (!dragonPlaced) {
                dragonTries = 0;
                while (!dragonPlaced && dragonTries < 5000) {
                    dragonTries++;
                    const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                    if (playerCanPlaceSingles(k)) {
                        playerUnits.add(k);
                        dragonKey = k;
                        dragonPlaced = true;
                    }
                }
            }
            if (!dragonPlaced)
                continue;
            let wizardPlaced = false, wizardTries = 0;
            const playerWizardAttracted = nextRandom() < 0.20;
            const wizardRoll = nextRandom();
            const wizardBand = wizardRoll < 0.10 ? 1 : 2;
            while (!wizardPlaced && wizardTries < 5000) {
                wizardTries++;
                let k = null;
                if (playerWizardAttracted && monkKey) {
                    const m = parseKey(monkKey), candidates = [];
                    for (let y = Math.max(0, m.y - 2); y <= Math.min(SIZE - 1, m.y + 2); y++) {
                        for (let x = Math.max(0, m.x - 2); x <= Math.min(SIZE - 1, m.x + 2); x++) {
                            const edgeDist = Math.min(x, y, SIZE - 1 - x, SIZE - 1 - y);
                            if ((wizardBand === 1 && edgeDist !== 1) || (wizardBand === 2 && edgeDist < 2))
                                continue;
                            const kk = key(x, y);
                            if (playerCanPlaceSingles(kk))
                                candidates.push(kk);
                        }
                    }
                    if (candidates.length)
                        k = candidates[Math.floor(nextRandom() * candidates.length)];
                }
                let rx, ry;
                if (k) {
                    ({ x: rx, y: ry } = parseKey(k));
                }
                else {
                    rx = Math.floor(nextRandom() * SIZE);
                    ry = Math.floor(nextRandom() * SIZE);
                    k = key(rx, ry);
                    const edgeDist = Math.min(rx, ry, SIZE - 1 - rx, SIZE - 1 - ry);
                    if ((wizardBand === 1 && edgeDist !== 1) || (wizardBand === 2 && edgeDist < 2))
                        continue;
                }
                if (playerCanPlaceSingles(k)) {
                    playerUnits.add(k);
                    wizardKey = k;
                    wizardPlaced = true;
                }
            }
            if (!wizardPlaced) {
                wizardTries = 0;
                while (!wizardPlaced && wizardTries < 5000) {
                    wizardTries++;
                    const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                    if (Math.min(rx, ry, SIZE - 1 - rx, SIZE - 1 - ry) < 1)
                        continue;
                    if (playerCanPlaceSingles(k)) {
                        playerUnits.add(k);
                        wizardKey = k;
                        wizardPlaced = true;
                    }
                }
            }
            if (!wizardPlaced)
                continue;
            let necroPlaced = 0, necroTries = 0;
            while (necroPlaced < NECRO_COUNT && necroTries < 8000) {
                necroTries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE), k = key(rx, ry);
                if (playerCanPlaceSingles(k)) {
                    playerUnits.add(k);
                    playerNecroKeys.push(k);
                    necroPlaced++;
                }
            }
            if (necroPlaced < NECRO_COUNT)
                continue;
            let inf = 0, infTries = 0;
            while (inf < INF_COUNT && infTries < 5000) {
                infTries++;
                const rx = Math.floor(nextRandom() * SIZE), ry = Math.floor(nextRandom() * SIZE);
                const k = key(rx, ry);
                if (playerCanPlaceSingles(k)) {
                    playerUnits.add(k);
                    const { x, y } = parseKey(k);
                    inf++;
                }
            }
            if (inf < INF_COUNT)
                continue;
            return;
        }
        playerUnits.clear();
        for (const k of fixedCells)
            playerUnits.add(k);
        cavMap.clear();
        cellToCav.clear();
        cavIdSeq = 0;
        playerCastles.clear();
        castleIdSeq = 0;
        monkKey = null;
        dwarfKey = null;
        goblinKey = null;
        playerArcherKeys.length = 0;
        playerArcherAbilityUsed.clear();
        playerCatapultKeys.length = 0;
        elfKey = null;
        clericKey = null;
        demonKey = null;
        dragonKey = null;
        wizardKey = null;
        playerNecroKeys.length = 0;
        heroKey = null;
        heroActivated = false;
        dwarfKey = null;
    }
    if (profile === 'first-seat')
        randomPlayerPlacement();
    else
        placeEnemyRandom();
    const units = profile === 'first-seat' ? playerUnits : enemyUnits, cavs = profile === 'first-seat' ? cavMap : enemyCavMap, byCell = profile === 'first-seat' ? cellToCav : enemyCellToCav, castles = profile === 'first-seat' ? playerCastles : enemyCastles, archers = profile === 'first-seat' ? playerArcherKeys : enemyArcherKeys, catapults = profile === 'first-seat' ? playerCatapultKeys : enemyCatapultKeys, necros = profile === 'first-seat' ? playerNecroKeys : enemyNecroKeys;
    const singles = profile === 'first-seat' ? { monk: monkKey, dwarf: dwarfKey, goblin: goblinKey, elf: elfKey, cleric: clericKey, demon: demonKey, dragon: dragonKey, wizard: wizardKey, hero: heroKey } : { monk: enemyMonkKey, dwarf: enemyDwarfKey, goblin: enemyGoblinKey, elf: enemyElfKey, cleric: enemyClericKey, demon: enemyDemonKey, dragon: enemyDragonKey, wizard: enemyWizardKey, hero: enemyHeroKey };
    const seen = new Set(), out = [];
    for (const k of units) {
        if (fixedCells.includes(k) || seen.has(k))
            continue;
        const castle = [...castles.values()].find(c => c.cells.has(k)), cav = cavs.get(byCell.get(k) || '');
        let cells = [k], type = 'inf';
        if (castle) {
            cells = [...castle.cells];
            type = 'castle';
        }
        else if (cav) {
            cells = cav.cells || cavCellsAt(cav.x, cav.y, cav.orient);
            type = 'cav';
        }
        else if (archers.includes(k))
            type = 'archer';
        else if (catapults.includes(k))
            type = 'catapult';
        else if (necros.includes(k))
            type = 'necro';
        else {
            const single = Object.entries(singles).find(([, v]) => v === k);
            if (single)
                type = single[0];
        }
        for (const c of cells)
            seen.add(c);
        out.push({ type, cells });
    }
    return out;
}
