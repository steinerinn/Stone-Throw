import {presentationRecords} from './presentation-records.mjs';
import {publicHeroPresentation} from '../canonical/compiled/local-host/hero-presentation.js';
import { publicUnitStrips } from '../canonical/compiled/local-host/unit-strip-disclosure.js';
import { stationaryDisclosure } from '../canonical/compiled/local-host/stationary-disclosure.js';
import { captureStatistics, publicStatistics, emptyStatistics } from '../canonical/compiled/local-host/public-statistics.js';
import { publicMonkClues } from '../canonical/compiled/local-host/monk-disclosure.js';
import { multiCellDisclosure } from '../canonical/compiled/local-host/multicell-disclosure.js';
import { knownCasualtyCells, publicAimAssist, enemyResurrectionSearch, maskResurrectionCells, maskResurrectionChoices } from '../canonical/compiled/local-host/resurrection-disclosure.js';
import { lossDisclosure } from '../canonical/compiled/local-host/loss-disclosure.js';
import { normalExecution } from '../canonical/compiled/local-host/demon-entropy.js';
import { normalEnemyStep, refreshNormalMemory } from '../canonical/compiled/local-host/normal-step.js';
import { emptyNormalMemory } from '../canonical/compiled/local-host/normal-policy.js';
import { createHost } from '../canonical/compiled/host/initialization.js';
import { acceptCommand } from '../canonical/compiled/host/lifecycle.js';
import { serializeHost, deserializeHost } from '../canonical/compiled/host/serialization.js';
import { refreshHost } from '../canonical/compiled/host/refresh.js';
import { legacyRandomPlacement } from '../canonical/compiled/policy/placement-legacy.js';
import { parseKey } from '../canonical/compiled/combat/access.js';
import { projectObserver } from '../canonical/compiled/visibility.js';
import { id } from '../canonical/compiled/model.js';
// Stage 11 observer projection body reused verbatim; only the seat view and opaque maps vary.
import {measured} from './beta-metrics.mjs';
export function projectSeat(...args){return measured('projection',()=>projectSeatInner(...args));}
function projectSeatInner(h,normalMemory,statistics,epoch,revision,unitHandles,choiceHandles,after=0,indexed=false){const self=h.config.players[0],opponent=h.config.players[1],side=p=>p===self.id?'self':'opponent',battle=()=>`battle-${epoch}`,ownHandle=uid=>unitHandles.get(uid),decision=()=>h.pendingRoot?.decisions.find(d=>d.status==='pending'&&d.actorId===self.id);
    function choice() { const d = decision(); if (!d)
        return null; if (d.kind === 'policy-target')
        throw Error('Private policy decision reached client'); if (!choiceHandles.has(d.id))
        choiceHandles.set(d.id, `choice-${epoch}-${choiceHandles.size + 1}`); return { handle: choiceHandles.get(d.id), kind: d.kind, side: d.boardId === self.boardId ? 'self' : 'opponent', cells: d.boardId === opponent.boardId && (d.kind === 'scout' || d.kind === 'catapult-target') ? maskResurrectionChoices(d.legalCells, enemyResurrectionSearch(h), d.kind === 'scout' ? h.state.seats[0].scouted : []) : structuredClone(d.legalCells), units: d.legalUnitIds.map(uid => { if (!h.state.match.units.some(u => u.id === uid && u.ownerId === self.id))
            throw Error('Opponent unit choice'); return ownHandle(uid); }), remaining: d.remaining }; }
    const records=indexed?presentationRecords(h):null;const observer = projectObserver(h.state.match, self.id);
    function events() { const p = observer; return p.events.map(e => ({ position: e.sequence, kind: e.kind, side: e.boardId === self.boardId ? 'self' : 'opponent', cell: e.cell ? { ...e.cell } : null, unitKind: e.unitType })); }
    function snapshot() { const p = observer, outcome = p.outcome, seat = h.state.seats[0]; const seen=maskResurrectionCells(knownCasualtyCells(h, stationaryDisclosure(h, multiCellDisclosure(h, p.knowledge[opponent.id].cells.map(c => ({ cell: { ...c.cell }, observation: c.observation, kind: c.unitType })),records?.catapult),records?.stationary)), enemyResurrectionSearch(h));return {heroPresentation:publicHeroPresentation(h,records?.hero),plagueCells: records?.plagueCells??([...new Map(h.events.filter(({ event: e }) => e.kind === 'impact' && e.meta?.source === 'plague').flatMap(({ event: e }) => e.cells.map(cell => [e.meta.targetBoardId + ':' + cell.x + ',' + cell.y, { side: side(e.meta.targetPlayerId), cell: { ...cell } }]))).values()]), ...(normalMemory.gaveUp ? { gaveUp: true } : {}), storyPlagueTargets: h.state.storyPlagueTargets.map(side), strips: publicUnitStrips(h), stats: publicStatistics(h, statistics), monkClues: publicMonkClues(h,seen), aimAssistCells: publicAimAssist(h), enemyResurrection: enemyResurrectionSearch(h), lossReveal: lossDisclosure(h), resultMessage: normalMemory.resultMessage ?? null, contract: 'stone-throw-client-v1', battle: battle(), revision, size: h.config.size, phase: h.status === 'placement' ? 'placement' : h.status === 'complete' ? 'finished' : h.status === 'guarded' ? 'guarded' : decision() ? 'decision' : 'action', active: h.activePlayerId ? side(h.activePlayerId) : null, round: h.round, shotsLeft: seat.ordinaryShots, rosters: { self: { ...self.roster }, opponent: { ...opponent.roster } }, owned: p.ownedUnits.map(u => { if (!u.type)
            throw Error('Unresolved own unit'); return { handle: ownHandle(u.id), kind: u.type, cells: structuredClone(u.cells), damaged: structuredClone(u.damage.cells), destroyed: u.lifecycle === 'destroyed', hero: u.hero ? { active: u.hero.activated, hits: u.hero.hitsTaken } : null, spent: u.abilities.some(a => a.spent) }; }), opponent:seen, ownImpacts: seat.shots.map(parseKey), choice: choice(), outcome: !outcome || outcome.kind === 'ongoing' || outcome.kind === 'undetermined' ? 'ongoing' : outcome.kind === 'draw' ? 'draw' : outcome.winnerIds.includes(self.id) ? 'win' : 'loss', demonRunes: (normalMemory.demonRunes || []).map((batch, i) => ({ sequence: i + 1, side: batch.boardId === self.boardId ? 'self' : 'opponent', runes: structuredClone(batch.runes) })), eventPosition: p.events.length }; }

const s=snapshot();if(!Number.isSafeInteger(after)||after<0||after>s.eventPosition)throw Error('invalid-cursor');return structuredClone({accepted:true,error:null,snapshot:s,events:events().filter(e=>e.position>after)});}
