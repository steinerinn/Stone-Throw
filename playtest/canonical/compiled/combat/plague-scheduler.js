import { seat, boardSize, cellKey, parseKey, emit } from './access.js';
import { neighbors8 } from '../rules/coordinates.js';
import { plagueBranchCount, plagueWeightedChoice, plagueWholeEdgeCandidates } from './units/plague.js';
import { work } from './scheduling.js';
export function plagueProgress(ctx, op) {
    const p = ctx.frames.at(-1).detachedPlague || ctx.state.plagues.find(p => p.targetBoardId === op.targetBoardId && (!op.plagueId || p.outbreaks.some(o => o.statisticsId === op.plagueId)));
    if (!p)
        return;
    const outbreak = p.outbreaks[op.outbreakIndex], frame = ctx.frames.at(-1), insert = (...ops) => frame.current.splice(frame.cursor, 0, ...ops.map(op => work(ctx, op, 'turn-boundary')));
    if (!outbreak) {
        p.announced = true;
        const active = p.outbreaks.some(o => o.round > 0 && o.round < 5 && o.frontier.length > 0);
        if (!active) {
            ctx.state.plagues = ctx.state.plagues.filter(q => q !== p);
            emit(ctx, 'plague-contained');
        }
        return;
    }
    const nextOutbreak = () => insert({ ...op, outbreakIndex: op.outbreakIndex + 1, stage: 'start', oldFrontier: [], nextFrontier: [], reserved: [], parentIndex: 0, childIndex: 0, wanted: 0 });
    if (outbreak.round >= 5) {
        nextOutbreak();
        return;
    }
    const target = seat(ctx.state, p.targetPlayerId), shots = new Set(target.shots), reserved = new Set(op.reserved), size = boardSize(ctx.state, p.targetBoardId);
    const impact = (k) => { const meta = { actorId: p.triggerPlayerId, ownerId: p.ownerId, targetPlayerId: p.targetPlayerId, targetBoardId: p.targetBoardId, sourceUnitId: null, source: 'plague', origin: p.origin }; if (!outbreak.infected.includes(k))
        outbreak.infected.push(k); return { kind: 'impact', meta, cell: parseKey(k), deferReactions: false }; };
    if (op.stage === 'start') {
        if (outbreak.round === 0) {
            let start = outbreak.origin ? cellKey(outbreak.origin) : null;
            if (start && shots.has(start)) {
                const origin = outbreak.origin;
                start = plagueWeightedChoice(size, neighbors8({ size }, origin.x, origin.y).filter(k => !shots.has(k)), shots, new Set(), ctx.rng);
            }
            if (!start) {
                nextOutbreak();
                return;
            }
            insert(impact(start), { kind: 'same-turn-effects' }, { ...op, stage: 'finish', nextFrontier: [start], oldFrontier: [] });
            return;
        }
        insert({ ...op, stage: 'branch', oldFrontier: [...outbreak.frontier], parentIndex: 0, childIndex: 0, wanted: 0, nextFrontier: [], reserved: [] });
        return;
    }
    if (op.stage === 'branch') {
        if (op.parentIndex >= op.oldFrontier.length) {
            insert({ ...op, stage: 'finish' });
            return;
        }
        insert({ ...op, stage: 'child', childIndex: 0, wanted: plagueBranchCount(ctx.rng) });
        return;
    }
    if (op.stage === 'child') {
        if (op.childIndex >= op.wanted) {
            insert({ ...op, stage: 'branch', parentIndex: op.parentIndex + 1 });
            return;
        }
        const parent = parseKey(op.oldFrontier[op.parentIndex]);
        let options = neighbors8({ size }, parent.x, parent.y).filter(k => !shots.has(k) && !reserved.has(k));
        if (!options.length)
            options = plagueWholeEdgeCandidates(size, outbreak, shots, reserved);
        if (!options.length) {
            insert({ ...op, stage: 'branch', parentIndex: op.parentIndex + 1 });
            return;
        }
        const chosen = plagueWeightedChoice(size, options, shots, reserved, ctx.rng);
        if (!chosen) {
            insert({ ...op, stage: 'branch', parentIndex: op.parentIndex + 1 });
            return;
        }
        insert(impact(chosen), { kind: 'same-turn-effects' }, { ...op, childIndex: op.childIndex + 1, nextFrontier: [...op.nextFrontier, chosen], reserved: [...op.reserved, chosen] });
        return;
    }
    outbreak.frontier = [...op.nextFrontier];
    outbreak.round++;
    nextOutbreak();
}
