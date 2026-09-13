import type { ResolutionContext } from './contracts.js';
export declare function assertResolution(value: unknown): asserts value is ResolutionContext;
export declare function serializeResolution(ctx: ResolutionContext): string;
export declare function deserializeResolution(text: string): ResolutionContext;
