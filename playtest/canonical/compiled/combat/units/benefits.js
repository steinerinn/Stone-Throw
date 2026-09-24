import { futureBenefit } from '../benefit-ledger.js';
import { ruleTurn, seat, emit } from '../access.js';
export function dwarfRule(ctx, meta) { const p = seat(ctx.state, meta.targetPlayerId); if (meta.source === 'plague')
    return; if (meta.source === 'direct-human' || meta.source === 'direct-ai')
    p.nextShots = 7;
else if (p.playerId === ruleTurn(ctx))
    p.dwarfNow += 5;
else
    p.nextShots += 5; if (meta.source.startsWith('direct-') || p.playerId !== ruleTurn(ctx))
    futureBenefit(ctx, meta, 'dwarf', 5); emit(ctx, 'benefit-scheduled', meta, null, [], 5, 'dwarf'); }
export function catapultBenefit(ctx, meta) { const p = seat(ctx.state, meta.targetPlayerId); if (meta.source === 'plague')
    return; if (p.playerId === ruleTurn(ctx))
    p.catapultNow++;
else {
    p.catapultLater++;
    futureBenefit(ctx, meta, 'catapult', 1);
} emit(ctx, 'benefit-scheduled', meta, null, [], 1, 'catapult'); }
export function elfRule(ctx, meta) { const p = seat(ctx.state, meta.targetPlayerId); if (meta.source === 'plague')
    return; if (!meta.source.startsWith('direct-') && p.playerId === ruleTurn(ctx))
    p.elfNow = true;
else
    p.spyLater = 5; if (meta.source.startsWith('direct-') || p.playerId !== ruleTurn(ctx))
    futureBenefit(ctx, meta, 'scout', 5); emit(ctx, 'benefit-scheduled', meta, null, [], 5, 'scout'); }
