import type { MatchState, Cell } from './model.js';
export declare const cellKey: (c: Cell) => string;
export declare function assertMatchState(value: unknown): asserts value is MatchState;
