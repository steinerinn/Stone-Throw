import type { PlayerId, BoardId, UnitId, Cell } from '../model.js';
import type { ResolutionContext, PendingRuleDecision, DecisionCommand } from './contracts.js';
export declare function requireDecision(ctx: ResolutionContext, kind: PendingRuleDecision['kind'], actorId: PlayerId, boardId: BoardId, unitId: UnitId | null, legalCells: Cell[], legalUnitIds?: UnitId[], remaining?: number): PendingRuleDecision;
export declare function answerDecision(ctx: ResolutionContext, command: DecisionCommand): void;
