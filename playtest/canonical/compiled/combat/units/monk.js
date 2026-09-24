import { targetKnowledge, seat, shot, cellKey, boardSize, reactionMeta, emit } from '../access.js';
import { neighbors8, parseKey } from '../../rules/coordinates.js';
export function monkProximity(ctx, meta, k) {
    const observer = targetKnowledge(ctx.state, meta.ownerId, meta.targetPlayerId), target = seat(ctx.state, meta.targetPlayerId), monk = ctx.state.match.units.find(u => u.ownerId === target.playerId && u.type === 'monk'), mk = monk?.cells[0] ? cellKey(monk.cells[0]) : null;
    observer.monkCandidates = observer.monkCandidates.filter(c => c !== k);
    const active = monk && mk && !monk.abilities.some(a => a.kind === 'monk' && a.spent) && !shot(ctx.state, target.playerId, mk), { x, y } = parseKey(k), near = neighbors8({ size: boardSize(ctx.state, meta.targetBoardId) }, x, y);
    if (active && mk !== k && near.includes(mk)) {
        const possible = near.filter(c => !target.shots.includes(c));
        observer.monkCandidates = observer.monkCandidates.length ? observer.monkCandidates.filter(c => possible.includes(c)) : possible;
        emit(ctx, 'monk-clue', { ...meta, origin: parseKey(k) }, monk.id, observer.monkCandidates.map(parseKey), null, 'positive');
        const retaliation = reactionMeta(ctx.state, monk, 'monk-deflect', monk.cells[0]);
        {
            const attacker = seat(ctx.state, meta.ownerId);
            retaliation.targetPlayerId = attacker.playerId;
            retaliation.targetBoardId = attacker.boardId;
        }
        return { kind: 'monk-deflect', meta: retaliation };
    }
    if (mk && mk !== k && observer.monkCandidates.length) {
        const before = [...observer.monkCandidates], impossible = [k, ...near];
        observer.monkCandidates = before.filter(c => !impossible.includes(c) && !target.shots.includes(c));
        if (before.length > 1 && observer.monkCandidates.length === 1)
            observer.monkCandidates = before;
        emit(ctx, 'monk-clue', { ...meta, origin: parseKey(k) }, null, observer.monkCandidates.map(parseKey), null, 'negative');
    }
    return null;
}
