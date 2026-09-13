import type { HostState } from './contracts.js';
export declare function assertHost(value: unknown): asserts value is HostState;
export declare function serializeHost(host: HostState): string;
export declare function deserializeHost(text: string): HostState;
