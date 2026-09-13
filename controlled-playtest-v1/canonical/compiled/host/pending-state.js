import { id } from '../model.js';
import { cellKey, parseKey, destroyed } from '../combat/access.js';
/** Re-materialize authoritative pending facts from compatibility counters.
 * The compatibility counters remain the execution authority for this stage. */
export function refreshPending(host) {
    const state = host.state, m = state.match, effects = [];
    if (host.status !== 'complete')
        for (const p of state.seats) {
            const add = (kind, count, due, tag) => { if (count > 0)
                effects.push({ id: id('pending-' + p.playerId + '-' + tag), kind, actorId: null, ownerId: p.playerId, targetId: null, boardId: null, origin: null, cells: [], remaining: count, due, status: 'queued' }); };
            add('dwarf', p.dwarfNow, 'same-turn', 'dwarf');
            add('catapult', p.catapultNow, 'same-turn', 'catapult-now');
            add('catapult', p.catapultLater, 'next-turn', 'catapult-later');
            add('elf', p.elfNow ? 5 : 0, 'same-turn', 'scout-now');
            add('elf', p.spyLater, 'next-turn', 'scout-later');
            add('cleric', p.clericNow ? 1 : 0, 'same-turn', 'revive-now');
            add('cleric', p.clericLater ? 1 : 0, 'next-turn', 'revive-later');
            add('plague', p.releaseNow ? 1 : 0, 'same-turn', 'release');
        }
    if (host.status !== 'complete')
        for (const [i, q] of state.heroQueue.entries()) {
            const u = m.units.find(u => u.id === q.unitId);
            effects.push({ id: id('hero-queue-' + i), kind: 'hero-relocation', actorId: null, ownerId: u.ownerId, targetId: u.ownerId, boardId: u.boardId, origin: u.hero?.currentCell || null, cells: [], remaining: 1, due: 'queued-chain', status: 'queued' });
        }
    if (host.status !== 'complete' && host.pendingRoot) {
        for (const frame of host.pendingRoot.frames) {
            const remaining = frame.current.length - frame.cursor + frame.next.length;
            if (remaining > 0)
                effects.push({ id: id('pending-' + frame.id), kind: 'unresolved-chain', actorId: frame.compatibilityTurnId, ownerId: frame.compatibilityTurnId, targetId: null, boardId: null, origin: null, cells: [], remaining, due: 'queued-chain', status: 'active' });
        }
        for (const d of host.pendingRoot.decisions.filter(d => d.status === 'pending')) {
            const kind = d.kind === 'hero-relocation' ? 'hero-relocation' : d.kind === 'scout' ? 'elf' : d.kind === 'resurrection' ? 'cleric' : d.kind.startsWith('catapult-') ? 'catapult' : 'unresolved-chain';
            effects.push({ id: id('pending-' + d.id), kind, actorId: d.actorId, ownerId: d.actorId, targetId: m.boards.find(b => b.id === d.boardId).ownerId, boardId: d.boardId, origin: null, cells: [], remaining: d.remaining, due: 'queued-chain', status: 'active' });
        }
    }
    m.effects = effects;
    for (const r of m.resurrections) {
        const p = state.seats.find(p => p.playerId === r.ownerId);
        r.eligibleUnitIds = ['inf', 'archer', 'monk', 'cav'].flatMap(type => m.units.filter(u => u.ownerId === r.ownerId && u.type === type && destroyed(state, u) && u.cells.every(c => !p.plagueExcluded.includes(cellKey(c)))).map(u => u.id));
    }
    for (const observer of m.players) {
        const own = state.seats.find(p => p.playerId === observer.id), target = state.seats.find(p => p.playerId === own.reactionTarget.playerId), board = m.knowledge[observer.id].boards[target.playerId];
        board.clues = [];
        if (own.monkCandidates.length)
            board.clues.push({ kind: 'monk-candidates', cells: own.monkCandidates.map(parseKey) });
        if (target.resurrection.searchActive)
            board.clues.push({ kind: 'resurrection-search', cells: target.resurrection.suspects.flatMap(uid => m.units.find(u => u.id === uid)?.cells || []) });
        if (own.scouted.length)
            board.clues.push({ kind: 'elf-scout', cells: own.scouted.map(parseKey) });
        for (const key of own.scouted)
            if (!board.cells.some(c => cellKey(c.cell) === key))
                board.cells.push({ cell: parseKey(key), observation: 'uncertain', unitType: null, contactId: null });
    }
}
