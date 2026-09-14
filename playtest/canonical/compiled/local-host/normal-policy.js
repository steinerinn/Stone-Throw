import { createNormalPolicy } from './normal-legacy.js';
import { cellKey, parseKey } from '../combat/access.js';
import { neighbors4, neighbors8, cavCellsAt } from '../rules/index.js';
import { random } from '../combat/rng.js';
export const emptyNormalMemory = () => ({ knownHits: [], castleHits: [], scoutKnowledge: [], heroHunt: [], eventCursor: 0, scoutQueue: [] });
/** Private normal-browser policy; not the Stage 9 Auto Match policy. */
export function normalPolicy(h, memory) {
    const human = h.state.seats[0], enemy = h.state.seats[1], own = h.state.match.units.filter(u => u.ownerId === human.playerId), shots = new Set(human.shots), hero = own.find(u => u.type === 'hero'), monk = own.find(u => u.type === 'monk'), cfg = h.config.players[0].roster;
    const at = (k) => own.find(u => u.cells.some(c => cellKey(c) === k)), dead = (u) => u.cells.every(c => shots.has(cellKey(c))), count = (type) => own.filter(u => u.type === type && dead(u)).length;
    const cavs = new Map(own.filter(u => u.type === 'cav').map(u => [u.id, { x: u.cells[0].x, y: u.cells[0].y, orient: u.cells[0].y === u.cells[1].y ? 'H' : 'V', cells: u.cells.map(cellKey) }])), cellToCav = new Map([...cavs].flatMap(([id, u]) => u.cells.map(k => [k, id])));
    const castleAt = (k) => { const u = at(k); return u?.type === 'castle' ? { id: u.id, cells: new Set(u.cells.map(cellKey)) } : null; }, scout = new Map(memory.scoutKnowledge), picked = [];
    const env = { SIZE: h.config.size, PLAGUE_ROUNDS: 5, INF_COUNT: cfg.inf || 0, ARCHER_COUNT: cfg.archer || 0, CAV_COUNT: cfg.cav || 0, CASTLE_COUNT: cfg.castle || 0, key: (x, y) => x + ',' + y, parseKey,
        neighbors4: (x, y) => neighbors4({ size: h.config.size }, x, y), neighbors8: (x, y) => neighbors8({ size: h.config.size }, x, y), cavCellsAt: (x, y, orient) => cavCellsAt(x, y, orient), cavMap: cavs, cellToCav,
        enemyKnownHits: new Set(memory.knownHits), enemyCastleKnownHits: new Set(memory.castleHits), enemyScoutKnowledge: scout, enemyScoutedPlayerCells: new Set(enemy.scouted), enemyHeroHuntCandidates: new Set(memory.heroHunt), enemyMonkSearchCandidates: new Set(enemy.monkCandidates), enemyShots: shots,
        heroActivated: !!hero?.hero?.activated, heroKey: hero?.hero?.currentCell ? cellKey(hero.hero.currentCell) : null, playerHeroHitsTaken: hero?.hero?.hitsTaken || 0, monkKey: monk?.cells[0] ? cellKey(monk.cells[0]) : null,
        playerResurrectionSearchActive: human.resurrection.searchActive, playerResurrectionSuspectUnits: human.resurrection.suspects.map(id => ({ cells: h.state.match.units.find(u => u.id === id).cells.map(cellKey) })), playerResurrectionSuspects: new Set(human.resurrection.suspects.flatMap(id => h.state.match.units.find(u => u.id === id).cells.map(cellKey))),
        playerPlaguePending: (() => { const p = h.state.plagues.find(p => p.targetPlayerId === human.playerId); return p ? { outbreaks: p.outbreaks.map(o => ({ round: o.round, origin: o.origin ? cellKey(o.origin) : undefined, infected: new Set(o.infected) })) } : null; })(),
        sideCastleByCell: (_side, k) => castleAt(k), castleDestroyed: (_side, c) => [...c.cells].every(k => shots.has(k)), alreadyShotOnSide: (_side, k) => shots.has(k),
        playerInfHits: () => count('inf'), playerArcherHitCount: () => count('archer'), playerCavDestroyedCount: () => count('cav'), playerCastleDestroyedCount: () => count('castle'),
        enemyRequiredUnitsRemaining: () => own.filter(u => ['inf', 'cav', 'archer', 'monk', 'castle'].includes(u.type || '') && !dead(u)).length + (hero?.hero?.activated && hero.hero.currentCell && hero.hero.hitsTaken < 3 ? 1 : 0),
        sideUnitAt: (_side, k) => { const t = at(k)?.type; return t === 'cav' ? 'cavalry' : t === 'inf' ? 'infantry' : t || null; }, revealPlayerScoutCellForEnemy: (k) => picked.push(k), eventName: (kind) => kind, damageSummary: (items) => items.join(', '), addBattleEvent: (_text) => { }, x: undefined, y: undefined };
    const legacy = createNormalPolicy(env, () => random(h.rng, 'normal-browser-policy'));
    return { target: (plagueAware) => plagueAware ? legacy.plagueTarget() : legacy.target(), catapult: (avoid, origins) => legacy.catapult(avoid, origins), roll: (cells, protect = false) => legacy.catapultRoll(cells, protect ? legacy.protectedCells() : new Set()), scout: (count) => { legacy.scout(count); return picked; } };
}
