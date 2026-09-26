// @ts-nocheck
// Existing pure accounting shared with canonical end-of-round resolution.
// Read-only accounting over canonical facts. Never use animation or narrative events.
// These are the ability sources in combat/contracts.ts RuleSource; generic chain
// contacts require more attribution evidence and are not silently called abilities.
const abilities = new Set(['archer', 'monk-deflect', 'catapult-shot', 'goblin', 'dragon', 'demon-blast', 'wizard', 'plague', 'assassin']);
const direct = new Set(['direct-human', 'direct-ai']);
export function tacticalScoreFacts(d, facts) {
    const result = Object.fromEntries(d.participants.map(p => [p.actor, { scouts: 0, plagueCells: 0, kills: 0, issues: [] }]));
    const eligible = (actor, index) => d.participants.find(p => p.actor === actor && p.kind !== 'ai' && index < (p.cutoff ?? Infinity));
    const issue = (actor, index, reason) => { for (const p of d.participants)
        if ((!actor || p.actor === actor) && eligible(p.actor, index) && !result[p.actor].issues.includes(reason))
            result[p.actor].issues.push(reason); };
    const seen = new Set(), known = new Set(), spread = new Set(), dead = new Set(), lastImpact = new Map();
    for (const f of facts) {
        const e = f.event, s = e.statistics || {}, m = e.meta || {}, identity = f.eventId ?? f.index;
        if (s.environmental) {
            if (e.kind === 'impact' && e.unitId)
                lastImpact.delete(e.unitId);
            if (['unit-destroyed', 'hero-killed'].includes(e.kind))
                dead.add(e.unitId);
            if (e.kind === 'resurrection')
                dead.delete(e.unitId);
            continue;
        }
        if (seen.has(identity))
            continue;
        seen.add(identity);
        if (e.kind === 'scouted') {
            const scout = s.scout;
            if (!scout?.actorId || !scout.boardId || !Array.isArray(scout.cells)) {
                issue(scout?.actorId, f.index, 'scout-success-evidence-unavailable');
                continue;
            }
            let discoveries = 0;
            for (const c of scout.cells) {
                if (!c.cell || !Object.hasOwn(c, 'unitId')) {
                    issue(scout.actorId, f.index, 'scout-success-evidence-unavailable');
                    continue;
                }
                const key = scout.actorId + ':' + scout.boardId + ':' + c.cell.x + ',' + c.cell.y;
                if (c.unitId && !known.has(key) && eligible(scout.actorId, f.index))
                    discoveries++;
                known.add(key);
            }
            result[scout.actorId].scouts += e.reason === 'area-scout' ? Math.min(1, discoveries) : discoveries;
        }
        if (e.kind === 'impact') {
            if (e.unitId)
                lastImpact.set(e.unitId, { meta: m, index: f.index });
            // A shot is already public knowledge and cannot become a new Scout discovery.
            for (const p of d.participants)
                for (const c of e.cells || [])
                    known.add(p.actor + ':' + m.targetBoardId + ':' + c.x + ',' + c.y);
            if (m.source === 'plague') {
                const owner = s.plague?.owner || m.ownerId;
                if (!owner || !m.targetBoardId || !Array.isArray(e.cells))
                    issue(owner, f.index, 'plague-spread-evidence-unavailable');
                else
                    for (const c of e.cells) {
                        // Repeated bookkeeping of an outbreak cell is one spread, independent of its kill.
                        const key = (s.plague?.id || f.plagueOutbreakId || identity) + ':' + m.targetBoardId + ':' + c.x + ',' + c.y;
                        if (!spread.has(key) && eligible(owner, f.index))
                            result[owner].plagueCells++;
                        spread.add(key);
                    }
            }
        }
        if (e.kind === 'resurrection') {
            dead.delete(e.unitId);
            lastImpact.delete(e.unitId);
        }
        if (e.kind === 'unit-destroyed' || e.kind === 'hero-killed') {
            // Hero death is emitted without meta, including deferred queue returns.
            // Reuse the authoritative last-impact attribution used by Registry kills.
            const hit = lastImpact.get(e.unitId), cause = e.kind === 'hero-killed' && ['plague', 'third-hit-queue-return', 'trapped-queue-return'].includes(e.reason) ? hit?.meta : m;
            if (!e.unitId || !cause?.ownerId || !cause.source || !s.unitOwner) {
                issue(cause?.ownerId, f.index, 'special-kill-causality-unavailable');
                continue;
            }
            if (dead.has(e.unitId))
                continue;
            dead.add(e.unitId);
            if (direct.has(cause.source))
                continue;
            if (!abilities.has(cause.source)) {
                issue(cause.ownerId, f.index, 'special-kill-causality-unavailable');
                continue;
            }
            const owner = cause.source === 'plague' ? (s.plague?.owner || cause.ownerId) : cause.ownerId;
            if (owner !== s.unitOwner && eligible(owner, f.index) && (!hit || eligible(owner, hit.index)))
                result[owner].kills++;
        }
    }
    return result;
}
