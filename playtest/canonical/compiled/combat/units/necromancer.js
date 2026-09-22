import { ruleTurn, seat, shot, cellKey, emit } from '../access.js';
export function necromancers(ctx, ownerId) { return ctx.state.match.units.filter(u => u.ownerId === ownerId && u.type === 'necro'); }
export function necroHits(ctx, ownerId) { return necromancers(ctx, ownerId).filter(u => u.cells.some(c => shot(ctx.state, ownerId, cellKey(c)))).length; }
export function schedulePlague(ctx, ownerId, origin) {
    const owner = seat(ctx.state, ownerId), target = owner.reactionTarget;
    const plague = { triggerPlayerId: ruleTurn(ctx), ownerId, targetPlayerId: target.playerId, targetBoardId: target.boardId, moveOnPlayerId: ownerId, origin: origin ? { ...origin } : null, outbreaks: [{ statisticsId: ctx.id + '-plague-' + ctx.events.length, origin: origin ? { ...origin } : null, round: 0, frontier: [], infected: [] }], announced: false }; // Every scheduled outbreak retains its own identity, owner and future steps.
    ctx.state.plagues.push(plague);
    if (ctx.state.storyMode && !ctx.state.storyPlagueTargets.includes(target.playerId))
        ctx.state.storyPlagueTargets.push(target.playerId);
    emit(ctx, 'plague-scheduled', null, null, origin ? [origin] : [], null, origin ? 'necro-threshold' : 'zero-necro-empty-origin');
}
export function releaseHeldPlague(ctx, clericOwnerId) { const order = ctx.state.ring?.order, owner = order ? order[(order.indexOf(clericOwnerId) + 1) % order.length] : seat(ctx.state, clericOwnerId).reactionTarget.playerId, total = ctx.state.match.config.initialRosters[owner]?.necro || 0; if (necroHits(ctx, owner) !== total)
    return; const list = necromancers(ctx, owner), last = [...list].reverse().find(u => u.cells.some(c => shot(ctx.state, owner, cellKey(c)))) || list.at(-1); schedulePlague(ctx, owner, last?.cells[0] || null); }
export function necromancerRule(ctx, meta, origin) { const owner = meta.targetPlayerId, total = ctx.state.match.config.initialRosters[owner]?.necro || 0; if (necroHits(ctx, owner) < total)
    return; const target = seat(ctx.state, owner).reactionTarget.playerId, cleric = ctx.state.match.units.find(u => u.ownerId === target && u.type === 'cleric'), hasCleric = (ctx.state.match.config.initialRosters[target]?.cleric || 0) > 0; if (hasCleric && cleric && cleric.cells.some(c => !shot(ctx.state, target, cellKey(c)))) {
    emit(ctx, 'plague-held', meta, cleric.id);
    return;
} schedulePlague(ctx, owner, origin); }
