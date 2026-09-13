import type { ResolutionContext, Operation, Timing, RuleWork, AttackFrame, ReactionEntry, WorkId } from './contracts.js';
export declare function work(ctx: ResolutionContext, operation: Operation, timing?: Timing, parentId?: WorkId | null): RuleWork;
export declare function pushFrame(ctx: ResolutionContext, kind: AttackFrame['kind'], operations: Operation[], terminalCheck?: boolean): AttackFrame;
export declare function goblinLast(entries: readonly ReactionEntry[]): ReactionEntry[];
export declare function waveOperations(entries: readonly ReactionEntry[]): Operation[];
export declare function complete(ctx: ResolutionContext, reason?: string): void;
/** Called only at a legacy terminal boundary, not whenever a core becomes damaged.
 * Remaining siblings stay auditable as cancelled work, never silently drained. */
export declare function terminalTruncate(ctx: ResolutionContext, reason: string): void;
