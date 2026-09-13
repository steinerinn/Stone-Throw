import { id } from './model.js';
import { validate, stateSchema } from './schema.js';
function requireThat(ok, message) { if (!ok)
    throw Error(message); }
export const cellKey = (c) => `${c.x},${c.y}`;
export function assertMatchState(value) {
    validate(stateSchema, value);
    const s = value;
    const unique = (xs, label) => { requireThat(new Set(xs).size === xs.length, 'Duplicate ' + label); xs.forEach(v => id(v)); };
    unique(s.players.map(p => p.id), 'player');
    unique(s.boards.map(b => b.id), 'board');
    unique(s.units.map(u => u.id), 'unit');
    requireThat(s.players.length >= 1, 'No players');
    requireThat(s.config.format !== 'legacy-1v1' || s.players.length === 2, 'Legacy format requires two players');
    const players = new Set(s.players.map(p => p.id)), boards = new Map(s.boards.map(b => [b.id, b])), units = new Map(s.units.map(u => [u.id, u]));
    const player = (p) => requireThat(p === null || players.has(p), 'Unknown player reference');
    const board = (b) => { const found = boards.get(b); requireThat(found, 'Unknown board reference'); return found; };
    const cell = (b, c) => { const d = board(b); requireThat(c.x < d.width && c.y < d.height, 'Out-of-bounds cell'); };
    const cells = (b, cs) => { requireThat(new Set(cs.map(cellKey)).size === cs.length, 'Duplicate cell'); cs.forEach(c => cell(b, c)); };
    requireThat(JSON.stringify(s.config.playerOrder) === JSON.stringify(s.players.map(p => p.id)), 'Configuration/order mismatch');
    requireThat(JSON.stringify(s.config.boards) === JSON.stringify(s.boards), 'Immutable board configuration mismatch');
    requireThat(Object.keys(s.config.initialRosters).sort().join('|') === [...players].sort().join('|'), 'Roster ownership mismatch');
    const types = new Set(['inf', 'cav', 'archer', 'monk', 'castle', 'dwarf', 'goblin', 'catapult', 'elf', 'cleric', 'demon', 'dragon', 'wizard', 'necro', 'hero']);
    for (const r of Object.values(s.config.initialRosters))
        for (const k of Object.keys(r))
            requireThat(types.has(k), 'Unknown roster unit type');
    for (const p of s.players) {
        unique(p.boardIds, 'owned board');
        requireThat(JSON.stringify([...p.boardIds].sort()) === JSON.stringify(s.boards.filter(b => b.ownerId === p.id).map(b => b.id).sort()), 'Board ownership mismatch');
    }
    for (const b of s.boards) {
        player(b.ownerId);
        requireThat(b.width > 0 && b.height > 0, 'Empty board');
    }
    const occupied = new Set();
    for (const u of s.units) {
        player(u.ownerId);
        requireThat(board(u.boardId).ownerId === u.ownerId, 'Unit/board ownership mismatch');
        cells(u.boardId, u.cells);
        cells(u.boardId, u.damage.cells);
        const shape = new Set(u.cells.map(cellKey));
        for (const c of u.damage.cells)
            requireThat(shape.has(cellKey(c)), 'Damage outside current geometry');
        if (u.lifecycle === 'present') {
            requireThat(u.cells.length > 0, 'Present unit without geometry');
            for (const c of u.cells) {
                const k = u.boardId + ':' + cellKey(c);
                requireThat(!occupied.has(k), 'Overlapping present units');
                occupied.add(k);
            }
        }
        requireThat(u.hero === null || u.type === 'hero', 'Hero state on non-Hero');
        if (u.hero) {
            for (const c of [u.hero.currentCell, u.hero.originalCell])
                if (c)
                    cell(u.boardId, c);
            requireThat(u.hero.currentCell === null || shape.has(cellKey(u.hero.currentCell)), 'Hero location mismatch');
        }
        unique(u.abilities.map(a => a.kind), 'ability');
    }
    player(s.turn.activePlayerId);
    player(s.turn.roundStarterId);
    unique(s.turn.budgets.map(b => b.playerId), 'budget');
    for (const b of s.turn.budgets)
        player(b.playerId);
    const result = (o) => { if (o?.kind === 'win') {
        unique(o.winnerIds, 'winner');
        unique(o.eliminatedIds, 'eliminated');
        requireThat(o.winnerIds.length > 0, 'No winner');
        for (const p of [...o.winnerIds, ...o.eliminatedIds])
            player(p);
        requireThat(!o.winnerIds.some(p => o.eliminatedIds.includes(p)), 'Winner eliminated');
    } };
    result(s.outcome);
    unique(s.effects.map(e => e.id), 'effect');
    for (const e of s.effects) {
        player(e.actorId);
        player(e.ownerId);
        player(e.targetId);
        if (e.boardId) {
            const b = board(e.boardId);
            requireThat(e.targetId === null || b.ownerId === e.targetId, 'Effect target board mismatch');
            if (e.origin)
                cell(e.boardId, e.origin);
            cells(e.boardId, e.cells);
        }
        else
            requireThat(e.origin === null && e.cells.length === 0, 'Geometry without effect board');
    }
    unique(s.decisions.map(d => d.id), 'decision');
    for (const d of s.decisions) {
        player(d.actorId);
        board(d.boardId);
        cells(d.boardId, d.candidates);
        for (const u of [...d.unitChoices, ...(d.unitId ? [d.unitId] : [])])
            requireThat(units.has(u), 'Unknown decision unit');
    }
    for (const p of s.plagues) {
        player(p.ownerId);
        player(p.targetId);
        player(p.moveOnPlayerId);
        requireThat(board(p.boardId).ownerId === p.targetId, 'Plague board mismatch');
        if (p.origin)
            cell(p.boardId, p.origin);
        cells(p.boardId, p.killedCells);
        for (const o of p.outbreaks) {
            if (o.origin)
                cell(p.boardId, o.origin);
            cells(p.boardId, o.frontier);
            cells(p.boardId, o.infected);
        }
    }
    for (const r of s.resurrections) {
        player(r.ownerId);
        requireThat(board(r.boardId).ownerId === r.ownerId, 'Resurrection board mismatch');
        cells(r.boardId, r.suspects);
        for (const u of [...r.eligibleUnitIds, ...(r.actualUnitId ? [r.actualUnitId] : [])])
            requireThat(units.get(u)?.ownerId === r.ownerId && units.get(u)?.boardId === r.boardId, 'Resurrection identity mismatch');
    }
    for (const e of s.plagueExclusions)
        cells(e.boardId, e.cells);
    unique(s.history.map(e => e.id), 'history');
    for (const e of s.history) {
        player(e.actorId);
        player(e.targetId);
        requireThat(board(e.boardId).ownerId === e.targetId, 'History board mismatch');
        cell(e.boardId, e.cell);
        requireThat(e.unitId === null || units.has(e.unitId), 'Unknown historical unit');
    }
    if (s.rng.kind === 'lcg32')
        requireThat(s.rng.seed <= 0xffffffff && s.rng.state <= 0xffffffff, 'Invalid LCG state');
    requireThat(Object.keys(s.knowledge).sort().join('|') === [...players].sort().join('|'), 'Missing/unknown observer');
    for (const [observer, k] of Object.entries(s.knowledge)) {
        player(observer);
        checkKnowledge(k);
    }
    function checkKnowledge(k) {
        if (k.turn)
            player(k.turn.activePlayerId);
        result(k.outcome);
        for (const [owner, bk] of Object.entries(k.boards)) {
            player(owner);
            requireThat(board(bk.boardId).ownerId === owner, 'Knowledge board owner mismatch');
            cells(bk.boardId, bk.cells.map(c => c.cell));
            unique(bk.contacts.map(c => c.id), 'contact');
            for (const c of bk.contacts) {
                requireThat(/^contact-[1-9][0-9]*$/.test(c.id), 'Nonlocal/private contact identifier');
                requireThat(!units.has(c.id), 'Private unit ID in contact');
                cells(bk.boardId, c.cells);
            }
            for (const c of bk.cells)
                requireThat(c.contactId === null || bk.contacts.some(x => x.id === c.contactId), 'Unknown contact');
            for (const clue of bk.clues)
                cells(bk.boardId, clue.cells);
        }
        k.events.forEach((e, i) => { requireThat(e.sequence === i + 1, 'Observer event sequence leaks global offsets'); board(e.boardId); if (e.cell)
            cell(e.boardId, e.cell); if (e.contactId) {
            const bk = k.boards[board(e.boardId).ownerId];
            requireThat(bk?.contacts.some(c => c.id === e.contactId), 'Event contact not disclosed');
        } });
        for (const st of k.stats)
            player(st.playerId);
        k.decisions.forEach((d, i) => { requireThat(d.sequence === i + 1, 'Decision sequence must be observer-local'); cells(d.boardId, d.candidates); });
    }
    for (const a of s.privateAi) {
        player(a.playerId);
        board(a.boardId);
        cells(a.boardId, a.knownHits);
        cells(a.boardId, a.heroCandidates);
        cells(a.boardId, a.scouted.map(c => c.cell));
    }
}
