import { refreshPending } from './pending-state.js';
import { id } from '../model.js';
import { parseKey, cellKey, unitAt } from '../combat/access.js';
import { neighbors8 } from '../rules/coordinates.js';
/** Minimal disclosure: public cells, counts and acting-player decisions. No private
 * source IDs, RNG, hidden unit type or AI targeting memory is copied to observers. */
export function refreshHost(host) {
    const s = host.state, m = s.match;
    const phase = host.status === 'placement' ? 'placement' : host.status === 'complete' ? 'finished' : host.status === 'awaiting-decision' ? 'decision' : host.pendingRoot ? 'resolving' : 'action';
    m.turn = { phase, activePlayerId: host.activePlayerId, round: host.round, turnIndex: host.turnIndex, roundStarterId: host.starterId, budgets: s.seats.map(p => ({ playerId: p.playerId, remaining: p.ordinaryShots, next: p.nextShots })) };
    m.rng = { kind: 'lcg32', seed: host.rng.seed, state: host.rng.state, draws: host.rng.cursor };
    m.plagueExclusions = s.seats.map(p => ({ boardId: p.boardId, cells: p.plagueExcluded.map(parseKey) }));
    m.plagues = s.plagues.map(p => ({ ownerId: p.ownerId, targetId: p.targetPlayerId, boardId: p.targetBoardId, moveOnPlayerId: p.moveOnPlayerId, origin: p.origin, outbreaks: p.outbreaks.map((o, i) => ({ ordinal: i + 1, round: o.round, origin: o.origin, frontier: o.frontier.map(parseKey), infected: o.infected.map(parseKey) })), killedCells: s.seats.find(t => t.playerId === p.targetPlayerId).plagueExcluded.map(parseKey) }));
    m.resurrections = s.seats.filter(p => p.clericLater || p.resurrection.searchActive).map(p => ({ ownerId: p.playerId, boardId: p.boardId, pending: p.clericLater, searchActive: p.resurrection.searchActive, actualUnitId: p.resurrection.actualUnitId, suspects: p.resurrection.suspects.flatMap(uid => m.units.find(u => u.id === uid)?.cells || []), eligibleUnitIds: [] }));
    m.privateAi = host.brains.map(b => ({ playerId: b.playerId, boardId: s.seats.find(p => p.playerId === b.playerId).reactionTarget.boardId, knownHits: b.knownHits.map(parseKey), scouted: b.scoutKnowledge.map(k => ({ cell: parseKey(k.cell), unitType: null })), heroCandidates: b.heroHunt.map(parseKey) }));
    m.decisions = [];
    if (host.pendingRoot)
        for (const d of host.pendingRoot.decisions.filter(d => d.status === 'pending')) {
            if (d.kind === 'policy-target')
                continue;
            m.decisions.push({ id: id(d.id), kind: d.kind === 'catapult-roll' ? 'catapult-target' : d.kind, actorId: d.actorId, boardId: d.boardId, unitId: d.unitId, candidates: structuredClone(d.legalCells), unitChoices: [...d.legalUnitIds], remaining: d.remaining, candidateCoverage: 'complete' });
        }
    refreshPending(host);
    for (const observer of m.players) {
        const knowledge = m.knowledge[observer.id];
        knowledge.turn = { phase, activePlayerId: host.activePlayerId, round: host.round };
        knowledge.outcome = structuredClone(m.outcome);
        knowledge.stats = host.counters.flatMap(c => [{ kind: 'shots', playerId: c.playerId, value: c.shots }]);
        knowledge.decisions = m.decisions.filter(d => d.actorId === observer.id).map((d, i) => ({ sequence: i + 1, kind: d.kind, boardId: d.boardId, candidates: structuredClone(d.candidates), remaining: d.remaining }));
    }
}
export function observeRuleEvent(host, event) {
    host.events.push({ turnIndex: host.turnIndex, event: structuredClone(event) });
    const m = host.state.match, meta = event.meta;
    if (event.kind === 'attack-started') {
        const f = host.statisticsFrames.find(f => f.frameId === event.workId);
        if (f)
            f.count++;
    }
    if ((event.kind === 'impact' || event.kind === 'suspect-eliminated') && meta && !meta.source.startsWith('direct-') && meta.source !== 'plague') {
        let actor = meta.actorId;
        if (meta.source === 'monk-deflect') {
            actor = null;
            for (const frame of [...(host.pendingRoot?.frames || [])].reverse()) {
                if (frame.kind !== 'attack')
                    continue;
                const impact = frame.current.map(w => w.operation).find(o => o.kind === 'impact');
                if (impact?.kind === 'impact' && impact.meta.source !== 'monk-deflect') {
                    actor = impact.meta.actorId;
                    break;
                }
            }
        }
        const counter = host.counters.find(c => c.playerId === actor);
        if (counter)
            counter.cellsAffected++;
    }
    if (event.kind === 'impact' && meta) {
        if (event.unitId) {
            const u = m.units.find(u => u.id === event.unitId);
            if (u?.type === 'hero' && u.hero?.hitsTaken === 2 && event.cells[0]) {
                const observer = host.state.seats.find(p => p.playerId === u.ownerId).reactionTarget.playerId, b = host.brains.find(b => b.playerId === observer), p = host.state.seats.find(p => p.playerId === u.ownerId), c = event.cells[0];
                b.heroHunt = neighbors8({ size: host.config.size }, c.x, c.y).filter(k => !p.shots.includes(k));
            }
        }
        const brain = host.brains.find(b => b.playerId === meta.actorId);
        for (const c of event.cells) {
            const k = cellKey(c);
            if (meta.actorId !== meta.targetPlayerId && event.unitId && brain && !brain.knownHits.includes(k))
                brain.knownHits.push(k);
            m.history.push({ id: id('event-' + (m.history.length + 1)), kind: 'impact', actorId: meta.actorId, targetId: meta.targetPlayerId, boardId: meta.targetBoardId, unitId: event.unitId, cell: { ...c }, turnIndex: host.turnIndex });
            for (const observer of m.players) {
                const known = m.knowledge[observer.id], board = known.boards[meta.targetPlayerId];
                if (board) {
                    const old = board.cells.find(x => cellKey(x.cell) === k);
                    if (old) {
                        old.observation = event.unitId ? 'impact' : 'miss';
                    }
                    else
                        board.cells.push({ cell: { ...c }, observation: event.unitId ? 'impact' : 'miss', unitType: null, contactId: null });
                }
                known.events.push({ sequence: known.events.length + 1, kind: event.unitId ? 'impact' : 'miss', boardId: meta.targetBoardId, cell: { ...c }, unitType: null, contactId: null });
            }
        }
    }
    if ((event.kind === 'resurrection' || event.kind === 'hero-moved') && event.unitId) {
        const u = m.units.find(u => u.id === event.unitId);
        for (const c of event.cells)
            m.history.push({ id: id('event-' + (m.history.length + 1)), kind: event.kind === 'resurrection' ? 'damage-restored' : 'relocation', actorId: u.ownerId, targetId: u.ownerId, boardId: u.boardId, unitId: u.id, cell: { ...c }, turnIndex: host.turnIndex });
        for (const observer of m.players)
            m.knowledge[observer.id].events.push({ sequence: m.knowledge[observer.id].events.length + 1, kind: event.kind === 'resurrection' ? 'resurrection-announced' : 'hero-moved', boardId: u.boardId, cell: null, unitType: null, contactId: null });
    }
    if (event.kind === 'resurrection' && event.unitId) {
        const revived = m.units.find(u => u.id === event.unitId);
        const observer = host.state.seats.find(p => p.playerId === revived.ownerId).reactionTarget.playerId, b = host.brains.find(p => p.playerId === observer);
        b.knownHits = b.knownHits.filter(k => !event.cells.some(c => cellKey(c) === k));
    }
    if (event.kind === 'scouted') {
        const d = host.pendingRoot?.decisions.find(d => d.kind === 'scout' && (d.status === 'pending' || d.status === 'answered'));
        if (d) {
            const b = host.brains.find(b => b.playerId === d.actorId);
            for (const c of event.cells) {
                const key = cellKey(c), u = unitAt(host.state, d.boardId, key), classification = !u ? 'empty' : u.type === 'hero' ? (u.hero?.activated ? 'core' : 'special') : ['dwarf', 'goblin', 'catapult', 'elf', 'cleric', 'necro', 'wizard', 'demon', 'dragon'].includes(u.type || '') ? 'special' : 'core';
                if (!b.scoutKnowledge.some(k => k.cell === key))
                    b.scoutKnowledge.push({ cell: key, classification });
            }
        }
    }
}
