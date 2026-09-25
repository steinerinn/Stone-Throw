import { consumeCompatibilityEntropy } from './entropy.js';
import { targetKnowledge, seat, unitAt, unit, cellKey, addUnique, syncDamage, destroyed, reactionMeta, emit } from './access.js';
import { dwarfRule, catapultBenefit, elfRule } from './units/benefits.js';
import { clericRule, discoverResurrection } from './units/cleric.js';
import { necromancerRule } from './units/necromancer.js';
import { heroHit } from './units/hero.js';
export function unitReaction(ctx, u, meta, cell) {
    const source = meta.source;
    if (source === 'plague' && !['demon', 'dragon', 'necro'].includes(u.type || ''))
        return null;
    if (['archer', 'goblin', 'demon', 'dragon', 'wizard'].includes(u.type || '')) {
        if (u.type === 'archer' && u.abilities.some(a => a.kind === 'archer' && a.spent))
            return null;
        const kind = u.type;
        const reaction = { kind, meta: reactionMeta(ctx.state, u, kind === 'demon' ? 'demon-blast' : kind === 'monk-deflect' ? 'monk-deflect' : kind, cell) };
        emit(ctx, 'reaction-generated', meta, u.id, [cell]);
        return reaction;
    }
    if (u.type === 'dwarf')
        dwarfRule(ctx, meta);
    else if (u.type === 'catapult')
        catapultBenefit(ctx, meta);
    else if (u.type === 'elf')
        elfRule(ctx, meta);
    else if (u.type === 'cleric')
        clericRule(ctx, meta);
    else if (u.type === 'necro')
        necromancerRule(ctx, meta, cell);
    return null;
}
/** Direct state transition only. Attack-layer/volley barriers choose when to call
 * unitReaction; interrupts and completion checks belong to the root scheduler. */
export function resolveImpact(ctx, meta, cell, deferReactions = false) {
    const p = seat(ctx.state, meta.targetPlayerId), k = cellKey(cell), u = unitAt(ctx.state, meta.targetBoardId, k), plague = meta.source === 'plague';
    if (p.shots.includes(k)) {
        if (p.resurrection.searchActive) {
            const suspect = p.resurrection.suspects.find(id => unit(ctx.state, id).cells.some(c => cellKey(c) === k));
            if (suspect) {
                p.resurrection.suspects = p.resurrection.suspects.filter(id => id !== suspect);
                emit(ctx, 'suspect-eliminated', meta, suspect, [cell]);
                return { type: null, unitId: null, reaction: null, repeat: false, deferred: null };
            }
        }
        if (!plague) {
            emit(ctx, 'repeat-ignored', meta, u?.id || null, [cell]);
            return { type: u?.type || null, unitId: u?.id || null, reaction: null, repeat: true, deferred: null };
        }
    }
    consumeCompatibilityEntropy(ctx);
    addUnique(p.shots, k);
    emit(ctx, 'impact', meta, u?.id || null, [cell]);
    if (!u)
        return { type: null, unitId: null, reaction: null, repeat: false, deferred: null };
    syncDamage(ctx.state, u);
    if (u.type === 'assassin' && !plague)
        (ctx.assassinPending ??= []).push({ meta: { ...meta }, unitId: u.id, stage: 'activate' });
    if (u.type === 'hero')
        heroHit(ctx, u, meta);
    if (u.type === 'monk') {
        if (meta.source === 'monk-deflect' && ctx.state.monkDuelActive) {
            ctx.state.monkDuelActive = false;
            emit(ctx, 'monk-duel', meta, u.id, [], null, 'defeated');
        }
        let a = u.abilities.find(a => a.kind === 'monk');
        if (!a) {
            a = { kind: 'monk', spent: true };
            u.abilities.push(a);
        }
        else
            a.spent = true;
        if (ctx.state.ring) {
            for (const observer of ctx.state.seats)
                targetKnowledge(ctx.state, observer.playerId, p.playerId).monkCandidates = [];
        }
        else
            targetKnowledge(ctx.state, p.reactionTarget.playerId, p.playerId).monkCandidates = [];
        emit(ctx, 'ability-spent', meta, u.id);
    }
    discoverResurrection(ctx, meta, k);
    if (plague && u.type && ['cav', 'archer', 'monk'].includes(u.type) && destroyed(ctx.state, u)) {
        for (const c of u.type === 'cav' ? u.cells : [cell])
            addUnique(p.plagueExcluded, cellKey(c));
    }
    emit(ctx, u.lifecycle === 'destroyed' ? 'unit-destroyed' : 'unit-damaged', meta, u.id, [cell]);
    const deferred = deferReactions ? { unitId: u.id, cell: { ...cell }, meta: { ...meta } } : null;
    return { type: u.type, unitId: u.id, reaction: deferred ? null : unitReaction(ctx, u, meta, cell), repeat: false, deferred };
}
