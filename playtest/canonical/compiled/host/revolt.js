import { destroyed } from '../combat/access.js';
import { survives, commitEliminations } from './ring.js';
import { calculateScores, add, rational } from '../scoring/match-score.js';
import { mutableRows } from '../archives.js';
export const activeRevoltPlayers = (h) => (h.state.ring?.order || h.config.players.map(p => p.id)).filter(id => survives(h.state, id));
export function heroOnly(h) {
    const ids = activeRevoltPlayers(h);
    return ids.length >= 2 && ids.every(id => {
        const units = h.state.match.units.filter(u => u.ownerId === id);
        return units.some(u => u.type === 'hero' && u.hero?.activated && u.hero.currentCell) && !units.some(u => ['inf', 'cav', 'archer', 'monk', 'castle'].includes(u.type || '') && u.cells.length && !destroyed(h.state, u));
    });
}
export function observeRevolt(h) {
    if (h.rootPurpose === 'revolt')
        return;
    const qualifies = heroOnly(h), r = h.state.revolt;
    if (!qualifies) {
        if (r) {
            r.qualifying = false;
            r.rounds = 0;
            r.waiting = [];
            r.started = [];
        }
        return;
    }
    if (!r || !r.qualifying) {
        h.state.revolt = { qualifying: true, rounds: 0, level: r?.level || 0, waiting: [...activeRevoltPlayers(h)], started: [] };
        return;
    }
    r.waiting = r.waiting.filter(id => activeRevoltPlayers(h).includes(id));
}
export function startRevoltTurn(h) { observeRevolt(h); const r = h.state.revolt; if (r?.qualifying && h.activePlayerId && !r.started.includes(h.activePlayerId))
    r.started.push(h.activePlayerId); }
/** Snapshot the existing score formula, excluding all final-result bonuses. */
export function earnedScores(h) {
    const facts = h.events.map((row, index) => ({ ...row, index, chainId: row.event.rootId, originActor: row.event.statistics?.rootActorId }));
    const d = { mode: 'Battle', participants: h.config.players.map(p => ({ actor: p.id, kind: 'guest', reliability: 'Full', cutoff: facts.length, outcome: null })) };
    return Object.fromEntries(calculateScores(d, facts).scores.map((s) => [s.actor, ['efficiency', 'biggestChain', 'successfulScouting', 'plagueSpread', 'specialAbilityKills', 'directSpecialPenalty'].reduce((sum, k) => add(sum, s.components[k]), rational())]));
}
export function finishRevoltRound(h, resumeStep = 'finish') {
    observeRevolt(h);
    const r = h.state.revolt, id = h.activePlayerId;
    if (!r?.qualifying || !id || (!r.started.includes(id) && r.waiting.length))
        return false;
    r.waiting = r.waiting.filter(p => p !== id);
    r.started = r.started.filter(p => p !== id);
    if (r.waiting.length)
        return false;
    r.rounds++;
    r.waiting = [...activeRevoltPlayers(h)];
    r.started = [];
    if (!r.level && r.rounds < 3)
        return false;
    r.level++;
    const scores = earnedScores(h);
    r.pulse = { resumeStep, level: r.level, players: [...activeRevoltPlayers(h)], scores: Object.fromEntries(activeRevoltPlayers(h).map(id => [id, scores[id]])) };
    return true;
}
export function compareScore(a, b) { const d = BigInt(a.n) * BigInt(b.d) - BigInt(b.n) * BigInt(a.d); return d > 0n ? 1 : d < 0n ? -1 : 0; }
/** One elimination boundary for the entire pulse, including its canonical chains. */
export function settleRevolt(h) {
    const pulse = h.state.revolt?.pulse;
    if (!pulse)
        throw Error('Missing Revolt settlement');
    const dead = pulse.players.filter(id => !survives(h.state, id)), remaining = pulse.players.filter(id => !dead.includes(id));
    const displaced = commitEliminations(h);
    if (dead.length) {
        const last = h.events.at(-1);
        h.events = mutableRows(h.events);
        h.events[h.events.length - 1] = { ...last, event: { ...last.event, statistics: { ...last.event.statistics, eliminationBoundary: { dead, survivors: remaining.length, revolt: true, ...(pulse.players.length > 2 ? { revoltScores: pulse.scores } : {}) } } } };
    }
    if (!remaining.length) {
        if (pulse.players.length === 2)
            h.state.match.outcome = { kind: 'draw' };
        else {
            const best = [...pulse.players].sort((a, b) => compareScore(pulse.scores[b], pulse.scores[a]))[0], winnerIds = pulse.players.filter(id => compareScore(pulse.scores[id], pulse.scores[best]) === 0);
            h.state.match.outcome = { kind: 'win', winnerIds, eliminatedIds: h.config.players.map(p => p.id).filter(id => !winnerIds.includes(id)) };
        }
    }
    else if (remaining.length === 1)
        h.state.match.outcome = { kind: 'win', winnerIds: remaining, eliminatedIds: h.config.players.map(p => p.id).filter(id => !remaining.includes(id)) };
    delete h.state.revolt.pulse;
    return displaced;
}
