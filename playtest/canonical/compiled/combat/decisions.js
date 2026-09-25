import { id } from '../model.js';
import { targetKnowledge, emit, cellKey, unit, seat, addUnique } from './access.js';
import { moveHero } from './units/hero.js';
import { resurrect } from './units/cleric.js';
export function requireDecision(ctx, kind, actorId, boardId, unitId, legalCells, legalUnitIds = [], remaining = 1) { if (ctx.decisions.some(d => d.status === 'pending'))
    throw Error('Another decision is pending'); const frame = ctx.frames.at(-1); if (!frame)
    throw Error('Decision requires a root work frame'); const decision = { id: id(`${ctx.id}-decision-${ctx.nextDecision++}`), rootId: ctx.id, workId: frame.id, actorId, boardId, unitId, kind, legalCells: legalCells.map(c => ({ ...c })), legalUnitIds: [...legalUnitIds], remaining, status: 'pending', answer: null }; ctx.decisions.push(decision); ctx.status = 'awaiting-decision'; emit(ctx, 'decision-required', null, unitId, [], remaining, kind); return decision; }
export function answerDecision(ctx, command) {
    if (Object.keys(command).sort().join('|') !== 'actorId|cell|decisionId|unitId')
        throw Error('Invalid command fields');
    if (command.cell && (!Number.isInteger(command.cell.x) || !Number.isInteger(command.cell.y)))
        throw Error('Invalid command coordinates');
    const d = ctx.decisions.find(d => d.id === command.decisionId);
    if (ctx.status !== 'awaiting-decision' || !d || d.status !== 'pending' || d.actorId !== command.actorId || d.rootId !== ctx.id)
        throw Error('Invalid or stale decision');
    if (command.cell !== null && !d.legalCells.some(c => cellKey(c) === cellKey(command.cell)))
        throw Error('Illegal decision cell');
    if (command.unitId !== null && !d.legalUnitIds.includes(command.unitId))
        throw Error('Illegal decision unit');
    if (d.kind === 'resurrection') {
        if (!command.unitId || command.cell)
            throw Error('Resurrection needs a unit');
        resurrect(ctx, d.actorId, command.unitId);
    }
    else {
        if (!command.cell && d.kind === 'hero-relocation' && d.legalCells.length === 0 && seat(ctx.state, d.actorId).decisionMode === 'policy') {
            if (d.unitId) {
                const hero = unit(ctx.state, d.unitId).hero;
                if (hero)
                    hero.relocationPending = false;
            }
            d.answer = { cell: null, unitId: null };
            d.status = 'answered';
            ctx.status = 'running';
            emit(ctx, 'decision-answered', null, d.unitId, [], null, 'legacy-no-destination');
            return;
        }
        if (!command.cell || command.unitId)
            throw Error('Decision needs a cell');
        if (d.kind === 'hero-relocation') {
            if (!d.unitId)
                throw Error('Hero identity missing');
            moveHero(ctx, unit(ctx.state, d.unitId), command.cell);
        }
        else if (d.kind === 'scout' && d.area) {
            const board = ctx.state.match.boards.find(b => b.id === d.boardId), cells = [];
            for (let y = Math.max(0, command.cell.y - 1); y <= Math.min(board.height - 1, command.cell.y + 1); y++)
                for (let x = Math.max(0, command.cell.x - 1); x <= Math.min(board.width - 1, command.cell.x + 1); x++)
                    cells.push({ x, y });
            const known = targetKnowledge(ctx.state, d.actorId, board.ownerId).scouted;
            for (const cell of cells)
                addUnique(known, cellKey(cell));
            emit(ctx, 'scouted', null, null, cells, 1, 'area-scout');
            d.remaining = 0;
        }
        else if (d.kind === 'scout') {
            addUnique(targetKnowledge(ctx.state, d.actorId, ctx.state.match.boards.find(b => b.id === d.boardId).ownerId).scouted, cellKey(command.cell));
            emit(ctx, 'scouted', null, null, [command.cell]);
            d.remaining--;
            d.legalCells = d.legalCells.filter(c => cellKey(c) !== cellKey(command.cell));
            if (d.remaining > 0) {
                d.answer = { cell: { ...command.cell }, unitId: null };
                emit(ctx, 'decision-answered', null, null, [command.cell], d.remaining, 'scout-continues');
                return;
            }
        }
    }
    d.answer = { cell: command.cell ? { ...command.cell } : null, unitId: command.unitId };
    d.status = 'answered';
    ctx.status = 'running';
    emit(ctx, 'decision-answered', null, d.unitId, command.cell ? [command.cell] : [], null, d.kind);
}
