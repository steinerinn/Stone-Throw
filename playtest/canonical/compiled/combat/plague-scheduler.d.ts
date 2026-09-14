import type { ResolutionContext, Operation } from './contracts.js';
type Progress = Extract<Operation, {
    kind: 'plague-progress';
}>;
export declare function plagueProgress(ctx: ResolutionContext, op: Progress): void;
export {};
