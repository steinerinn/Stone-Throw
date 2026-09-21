import { publicPlagueActive } from './plague-presentation.js';
import { animationCue, impactSources } from './animation-cue.js';
import { publicHeroPresentation } from './hero-presentation.js';
import { publicUnitStrips } from './unit-strip-disclosure.js';
import { stationaryDisclosure } from './stationary-disclosure.js';
import { captureStatistics, publicStatistics, emptyStatistics } from './public-statistics.js';
import { publicMonkClues } from './monk-disclosure.js';
import { multiCellDisclosure } from './multicell-disclosure.js';
import { knownCasualtyCells, publicAimAssist, enemyResurrectionSearch, maskResurrectionCells, maskResurrectionChoices } from './resurrection-disclosure.js';
import { lossDisclosure } from './loss-disclosure.js';
import { normalExecution } from './demon-entropy.js';
import { normalEnemyStep, refreshNormalMemory } from './normal-step.js';
import { emptyNormalMemory } from './normal-policy.js';
import { createHost } from '../host/initialization.js';
import { acceptCommand } from '../host/lifecycle.js';
import { serializeHost, deserializeHost } from '../host/serialization.js';
import { refreshHost } from '../host/refresh.js';
import { legacyRandomPlacement } from '../policy/placement-legacy.js';
import { parseKey } from '../combat/access.js';
import { projectObserver } from '../visibility.js';
import { id } from '../model.js';
/** Private authority factory. Only .client is passed to production presentation.
 * Persistence belongs to bootstrap/test authority, never a client remount payload. */
export function createLocalAuthority(config, checkpoint, development = false) {
    let h = checkpoint ? deserializeHost(JSON.parse(checkpoint).host) : createHost(config), revision = 0, epoch = 1, serial = 0;
    let normalMemory = checkpoint ? JSON.parse(checkpoint).normalMemory : emptyNormalMemory();
    let statistics = checkpoint ? JSON.parse(checkpoint).statistics ?? emptyStatistics() : emptyStatistics();
    let presentation = checkpoint ? JSON.parse(checkpoint).presentation ?? [] : [];
    let unitHandles = new Map(), choiceHandles = new Map();
    if (checkpoint) {
        const saved = JSON.parse(checkpoint);
        if (saved.contract !== 'local-authority-checkpoint-v1')
            throw Error('Invalid local checkpoint');
        revision = saved.revision;
        epoch = saved.epoch;
        serial = saved.serial;
        unitHandles = new Map(saved.unitHandles);
        choiceHandles = new Map(saved.choiceHandles);
    }
    const self = h.config.players[0], opponent = h.config.players[1];
    if (self.decisionMode !== 'interactive' || opponent.decisionMode !== 'policy')
        throw Error('Normal local client requires interactive primary and policy secondary');
    const side = (p) => p === self.id ? 'self' : 'opponent', battle = () => `battle-${epoch}`, commandId = () => `client-${++serial}`;
    function ownHandle(uid) { if (!unitHandles.has(uid))
        unitHandles.set(uid, `own-${epoch}-${unitHandles.size + 1}`); return unitHandles.get(uid); }
    function decision() { return h.pendingRoot?.decisions.find(d => d.status === 'pending' && d.actorId === self.id); }
    function choice() { const d = decision(); if (!d)
        return null; if (d.kind === 'policy-target')
        throw Error('Private policy decision reached client'); if (!choiceHandles.has(d.id))
        choiceHandles.set(d.id, `choice-${epoch}-${choiceHandles.size + 1}`); return { handle: choiceHandles.get(d.id), kind: d.kind, side: d.boardId === self.boardId ? 'self' : 'opponent', cells: d.boardId === opponent.boardId && (d.kind === 'scout' || d.kind === 'catapult-target') ? maskResurrectionChoices(d.legalCells, enemyResurrectionSearch(h), d.kind === 'scout' ? h.state.seats[0].scouted : []) : structuredClone(d.legalCells), units: d.legalUnitIds.map(uid => { if (!h.state.match.units.some(u => u.id === uid && u.ownerId === self.id))
            throw Error('Opponent unit choice'); return ownHandle(uid); }), remaining: d.remaining }; }
    function events(p = projectObserver(h.state.match, self.id)) { return p.events.map(e => ({ position: e.sequence, kind: e.kind, side: e.boardId === self.boardId ? 'self' : 'opponent', cell: e.cell ? { ...e.cell } : null, unitKind: e.unitType })); }
    function snapshot(p = projectObserver(h.state.match, self.id)) { const outcome = p.outcome, seat = h.state.seats[0]; const seen = maskResurrectionCells(knownCasualtyCells(h, stationaryDisclosure(h, multiCellDisclosure(h, p.knowledge[opponent.id].cells.map(c => ({ cell: { ...c.cell }, observation: c.observation, kind: c.unitType }))))), enemyResurrectionSearch(h)); return { heroPresentation: publicHeroPresentation(h), plagueActive: publicPlagueActive(h), plagueCells: [...new Map(h.events.filter(({ event: e }) => e.kind === 'impact' && e.meta?.source === 'plague').flatMap(({ event: e }) => e.cells.map(cell => [e.meta.targetBoardId + ':' + cell.x + ',' + cell.y, { side: side(e.meta.targetPlayerId), cell: { ...cell } }]))).values()], ...(normalMemory.gaveUp ? { gaveUp: true } : {}), storyPlagueTargets: h.state.storyPlagueTargets.map(side), strips: publicUnitStrips(h), stats: publicStatistics(h, statistics), monkClues: publicMonkClues(h, seen), aimAssistCells: publicAimAssist(h), enemyResurrection: enemyResurrectionSearch(h), lossReveal: lossDisclosure(h), resultMessage: normalMemory.resultMessage ?? null, contract: 'stone-throw-client-v1', battle: battle(), revision, size: h.config.size, phase: h.status === 'placement' ? 'placement' : h.status === 'complete' ? 'finished' : h.status === 'guarded' ? 'guarded' : decision() ? 'decision' : 'action', active: h.activePlayerId ? side(h.activePlayerId) : null, round: h.round, shotsLeft: seat.ordinaryShots, rosters: { self: { ...self.roster }, opponent: { ...opponent.roster } }, owned: p.ownedUnits.map(u => { if (!u.type)
            throw Error('Unresolved own unit'); return { handle: ownHandle(u.id), kind: u.type, cells: structuredClone(u.cells), damaged: structuredClone(u.damage.cells), destroyed: u.lifecycle === 'destroyed', hero: u.hero ? { active: u.hero.activated, hits: u.hero.hitsTaken } : null, spent: u.abilities.some(a => a.spent) }; }), opponent: seen, ownImpacts: seat.shots.map(parseKey), choice: choice(), outcome: !outcome || outcome.kind === 'ongoing' || outcome.kind === 'undetermined' ? 'ongoing' : outcome.kind === 'draw' ? 'draw' : outcome.winnerIds.includes(self.id) ? 'win' : 'loss', demonRunes: (normalMemory.demonRunes || []).map((batch, i) => ({ sequence: i + 1, side: batch.boardId === self.boardId ? 'self' : 'opponent', runes: structuredClone(batch.runes) })), eventPosition: p.events.length }; }
    let animationEventCursor = 0;
    const animationGroups = new Map();
    function capturePresentation(live) {
        const delta = live.events.slice(animationEventCursor).map(r => r.event), animation = animationCue(live, delta, animationGroups);
        animationEventCursor = live.events.length;
        const position = live.state.match.knowledge[self.id].events.length;
        if (position <= presentationCursor)
            return;
        const before = h;
        try {
            h = { ...live, state: structuredClone(live.state) };
            refreshHost(h);
            const p = projectObserver(h.state.match, self.id), s = snapshot(p), e = impactSources(events(p).filter(e => e.position > presentationCursor), delta, self.boardId, opponent.boardId);
            presentation.push({ snapshot: s, events: e, ...(animation ? { animation } : {}) });
            presentationCursor = position;
        }
        finally {
            h = before;
        }
    }
    let presentationCursor = 0;
    const execution = () => ({ ...normalExecution(normalMemory), settleRootBeforeTerminal: true, observePresentationStep: capturePresentation });
    function response(accepted = true, error = null, after = 0) { const p = projectObserver(h.state.match, self.id); return structuredClone({ accepted, error, snapshot: snapshot(p), events: accepted ? events(p).filter(e => e.position > after) : [], ...(accepted && presentation.length ? { presentation: presentation.filter(f => f.snapshot.eventPosition > after) } : {}) }); }
    function applyPlace(owner, unit, type, cells) { h = acceptCommand(h, { id: commandId(), kind: 'place', placement: { unitId: id(unit), ownerId: owner.id, boardId: owner.boardId, type, cells } }); }
    function rebuild(keep) { const rng = structuredClone(h.rng); h = createHost(h.config); for (const p of keep)
        h = acceptCommand(h, { id: commandId(), kind: 'place', placement: p }); h.rng = rng; refreshHost(h); }
    function randomPlacement(owner) { const keep = h.placements.filter(p => p.ownerId !== owner.id); rebuild(keep); const proposals = legacyRandomPlacement(owner.id === self.id ? 'first-seat' : 'second-seat', h.config.size, owner.roster, h.rng, h.config.story); for (const p of proposals)
        applyPlace(owner, `local-unit-${++serial}`, p.type, p.cells.map(parseKey)); refreshHost(h); }
    let takeover = false;
    function pump() { for (let guard = 0; guard < 10000; guard++) {
        if (h.status === 'complete' || h.status === 'guarded' || h.status === 'placement' || decision() || h.status === 'awaiting-command' && (h.activePlayerId === self.id || takeover))
            return;
        const r = h.round;
        h = normalEnemyStep(h, normalMemory, capturePresentation);
        captureStatistics(h, statistics, r);
    } throw Error('Local host pump guard'); }
    async function execute(intent, onPlayerFrame) {
        const executingRound = h.round;
        if (['place', 'move', 'remove', 'random-placement'].includes(intent.kind) && h.status !== 'placement')
            throw Error('Placement closed');
        if (intent.kind === 'place')
            applyPlace(self, `local-unit-${++serial}`, intent.unit, intent.cells);
        else if (intent.kind === 'remove' || intent.kind === 'move') {
            const uid = [...unitHandles].find(([, v]) => v === intent.unit)?.[0], unit = h.placements.find(p => p.unitId === uid && p.ownerId === self.id);
            if (!unit)
                throw Error('Unknown own handle');
            rebuild(h.placements.filter(p => p.unitId !== uid));
            if (intent.kind === 'move')
                applyPlace(self, unit.unitId, unit.type, intent.cells);
        }
        else if (intent.kind === 'random-placement')
            randomPlacement(self);
        else if (intent.kind === 'start') {
            if (h.status !== 'placement')
                throw Error('Already started');
            randomPlacement(opponent);
            h = acceptCommand(h, { id: commandId(), kind: 'start' }, execution());
            captureStatistics(h, statistics, executingRound);
            pump();
        }
        else if (intent.kind === 'shoot') {
            if (h.status !== 'awaiting-command' || h.activePlayerId !== self.id)
                throw Error('Not awaiting player shot');
            h = acceptCommand(h, { id: commandId(), kind: 'shoot', actorId: self.id, boardId: opponent.boardId, cell: intent.cell }, execution());
            // Only an already-resolved ordinary observation. No prediction, choice, or ability playback.
            if (onPlayerFrame && !decision() && !presentation.some(f => f.animation || f.events.some(e => e.source && e.source !== 'direct' || e.kind === 'hero-moved'))) {
                const frame = presentation.find(f => f.events.some(e => e.side === 'opponent' && e.source === 'direct' && ['impact', 'miss'].includes(e.kind)));
                if (frame)
                    await onPlayerFrame(structuredClone(frame));
            }
            pump();
        }
        else if (intent.kind === 'answer') {
            const d = decision();
            if (!d || choiceHandles.get(d.id) !== intent.choice)
                throw Error('Stale choice');
            const unitId = intent.unit === null ? null : [...unitHandles].find(([, handle]) => handle === intent.unit)?.[0];
            if (unitId === undefined)
                throw Error('Unknown choice unit');
            h = acceptCommand(h, { id: commandId(), kind: 'answer', answer: { decisionId: d.id, actorId: self.id, cell: intent.cell, unitId: unitId === null ? null : id(unitId) } }, execution());
            pump();
        }
        else if (intent.kind === 'give-up') {
            if (h.status === 'placement' || h.status === 'complete')
                throw Error('No active battle to concede');
            h.status = 'complete';
            h.turnStep = 'finish';
            h.pendingRoot = null;
            h.rootPurpose = null;
            h.pendingPolicyCells = [];
            h.state.match.outcome = { kind: 'win', winnerIds: [opponent.id], eliminatedIds: [self.id] };
            normalMemory.gaveUp = true;
            execution().normalTerminalMessage?.(h);
        }
        else if (intent.kind === 'reset') {
            const rng = structuredClone(h.rng);
            h = createHost(h.config);
            h.rng = rng;
            epoch++;
            unitHandles.clear();
            choiceHandles.clear();
            normalMemory = emptyNormalMemory();
            statistics = emptyStatistics();
        }
        else
            throw Error('Unsupported intent');
        refreshNormalMemory(h, normalMemory);
        refreshHost(h);
        captureStatistics(h, statistics);
    }
    function validate(request) { const value = JSON.parse(JSON.stringify(request)); if (Object.keys(request).sort().join(',') !== 'battle,contract,intent,revision')
        throw Error('Unknown envelope'); const fields = { place: ['unit', 'cells'], remove: ['unit'], move: ['unit', 'cells'], 'random-placement': [], start: [], reset: [], 'give-up': [], shoot: ['cell'], answer: ['choice', 'cell', 'unit'] }; const expected = fields[value.intent.kind]; if (!expected || Object.keys(value.intent).sort().join(',') !== ['kind', ...expected].sort().join(','))
        throw Error('Unknown intent'); return value; }
    let queue = Promise.resolve();
    const client = Object.freeze({ read: async (after = 0) => { await queue; if (!Number.isSafeInteger(after) || after < 0 || after > h.state.match.knowledge[self.id].events.length)
            throw Error('Invalid public event cursor'); return response(true, null, after); }, dispatch: (raw, onPlayerFrame) => { const task = queue.then(async () => { let request; try {
            request = validate(raw);
        }
        catch {
            return response(false, 'unsupported');
        } if (request.contract !== 'stone-throw-client-v1' || request.battle !== battle() || request.revision !== revision)
            return response(false, 'stale'); const before = structuredClone(h), oldMemory = structuredClone(normalMemory), oldStatistics = structuredClone(statistics), oldEpoch = epoch, oldSerial = serial, oldUnits = new Map(unitHandles), oldChoices = new Map(choiceHandles), after = h.state.match.knowledge[self.id].events.length; const oldPresentation = presentation; presentation = []; presentationCursor = after; animationEventCursor = h.events.length; animationGroups.clear(); try {
            await execute(request.intent, onPlayerFrame);
            revision++;
            return response(true, null, after);
        }
        catch {
            presentation = oldPresentation;
            h = before;
            normalMemory = oldMemory;
            statistics = oldStatistics;
            epoch = oldEpoch;
            serial = oldSerial;
            unitHandles = oldUnits;
            choiceHandles = oldChoices;
            return response(false, 'illegal', after);
        } }); queue = task.then(() => { }); return task; } });
    refreshHost(h);
    if (!checkpoint || !JSON.parse(checkpoint).statistics)
        captureStatistics(h, statistics);
    const dev = development ? Object.freeze({
        inspect: async () => { await queue; return structuredClone(h); },
        takeover: (enabled) => { const task = queue.then(() => { takeover = enabled; const after = h.state.match.knowledge[self.id].events.length; if (!enabled)
            pump(); refreshHost(h); revision++; return response(true, null, after); }); queue = task.then(() => { }); return task; },
        shoot: (cell) => { const task = queue.then(() => { if (!takeover || h.status !== 'awaiting-command' || h.activePlayerId !== opponent.id)
            return response(false, 'illegal'); const before = structuredClone(h), memory = structuredClone(normalMemory), stats = structuredClone(statistics), oldSerial = serial, oldPresentation = presentation, after = h.state.match.knowledge[self.id].events.length; presentation = []; presentationCursor = after; try {
            h = acceptCommand(h, { id: commandId(), kind: 'shoot', actorId: opponent.id, boardId: self.boardId, cell }, execution());
            pump();
            refreshNormalMemory(h, normalMemory);
            refreshHost(h);
            captureStatistics(h, statistics);
            revision++;
            return response(true, null, after);
        }
        catch {
            h = before;
            normalMemory = memory;
            statistics = stats;
            serial = oldSerial;
            presentation = oldPresentation;
            return response(false, 'illegal', after);
        } }); queue = task.then(() => { }); return task; }
    }) : undefined;
    let checkpointKeys = [], checkpointText = '';
    function serializePrivate() { const keys = [h, normalMemory, statistics, presentation, revision, epoch, serial, unitHandles.size, choiceHandles.size]; if (keys.every((k, i) => k === checkpointKeys[i]) && checkpointText)
        return checkpointText; checkpointText = JSON.stringify({ contract: 'local-authority-checkpoint-v1', host: serializeHost(h), normalMemory, statistics, ...(presentation.length ? { presentation } : {}), revision, epoch, serial, unitHandles: [...unitHandles], choiceHandles: [...choiceHandles] }); checkpointKeys = keys; return checkpointText; }
    return Object.freeze({ ...(dev ? { dev } : {}), client, serializePrivate, visitStatistics: (visitor) => visitor(h, epoch, !!normalMemory.gaveUp), dispatchWithProgress: (request, notify) => client.dispatch(request, notify) });
}
