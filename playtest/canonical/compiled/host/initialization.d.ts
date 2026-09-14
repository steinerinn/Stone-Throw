import type { HostConfiguration, HostState, Placement } from './contracts.js';
export declare function createHost(config: HostConfiguration): HostState;
export declare function place(host: HostState, p: Placement): void;
