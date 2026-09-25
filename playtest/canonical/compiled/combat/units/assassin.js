import { seat, unit, cellKey, parseKey, available, emit } from '../access.js';
import { survives } from '../../host/ring.js';
import { random, shuffle } from '../rng.js';
import { pushFrame } from '../scheduling.js';
/** Resume only after every frame, reaction and decision in the preceding chain settles. */
export function settleAssassin(ctx) {
    const pending = ctx.assassinPending?.shift();
    if (!pending)
        return false;
    const assassin = unit(ctx.state, pending.unitId), attacker = pending.meta.ownerId;
    if (!survives(ctx.state, attacker))
        return true;
    const target = seat(ctx.state, attacker), meta = { actorId: assassin.ownerId, ownerId: assassin.ownerId, targetPlayerId: attacker, targetBoardId: target.boardId, sourceUnitId: assassin.id, source: 'assassin', origin: { ...assassin.cells[0] } };
    if (pending.stage === 'activate') {
        const candidates = ctx.state.match.units.filter(u => u.ownerId === assassin.ownerId && ['demon', 'dragon', 'wizard', 'goblin'].includes(u.type || '') && u.cells.some(c => !seat(ctx.state, u.ownerId).shots.includes(cellKey(c))));
        if (candidates.length) {
            const chosen = candidates[Math.floor(random(ctx.rng, 'assassin-activation') * candidates.length)];
            ctx.assassinPending.unshift({ ...pending, stage: 'strike' });
            // A genuine hit applies the selected unit's marker, damage and canonical reaction.
            pushFrame(ctx, 'wave', [{ kind: 'impact', meta: { ...meta, targetPlayerId: chosen.ownerId, targetBoardId: chosen.boardId }, cell: { ...chosen.cells[0] }, deferReactions: false }, { kind: 'hero-queue' }, { kind: 'same-turn-effects' }]);
            return true;
        }
    }
    let cells = available(ctx.state, target.boardId, attacker);
    if (pending.stage === 'strike') {
        const eligible = new Set(ctx.state.match.units.filter(u => u.ownerId === attacker && (u.type === 'hero' ? !!u.hero?.activated && !!u.hero.currentCell : ['inf', 'cav', 'archer', 'monk', 'castle'].includes(u.type || ''))).flatMap(u => u.cells.map(cellKey)));
        cells = cells.filter(k => eligible.has(k) && !target.shots.includes(k));
        if (!cells.length)
            return true;
        cells = [cells[Math.floor(random(ctx.rng, 'assassin-core-cell') * cells.length)]];
    }
    else {
        // Use the same destroyed-footprint spacing evidence as aim assist, never
        // filter misses by secret occupancy. Assassin/active Hero can occupy that space.
        const units = ctx.state.match.units.filter(u => u.ownerId === attacker), freePlacement = units.some(u => u.type === 'assassin' && u.cells.some(c => !target.shots.includes(cellKey(c))) || u.type === 'hero' && u.hero?.activated && u.hero.currentCell);
        if (!freePlacement) {
            const dead = units.filter(u => !(target.resurrection.searchActive && target.resurrection.suspects.includes(u.id)) && u.type !== 'assassin' && u.cells.length && u.cells.every(c => target.shots.includes(cellKey(c)))).flatMap(u => u.cells);
            cells = cells.filter(k => { const c = parseKey(k); return !dead.some(d => Math.abs(d.x - c.x) <= 1 && Math.abs(d.y - c.y) <= 1); });
        }
        shuffle(cells, ctx.rng, 'assassin-fallback');
        cells = cells.slice(0, 3);
    }
    const selected = cells.map(parseKey);
    const event = emit(ctx, 'attack-started', meta, assassin.id, [], null, 'assassin');
    if (event.statistics)
        event.statistics.plannedCells = selected;
    const ops = selected.map(cell => ({ kind: 'impact', meta, cell, deferReactions: false }));
    pushFrame(ctx, 'wave', [...ops, { kind: 'hero-queue' }, { kind: 'same-turn-effects' }]);
    return true;
}
