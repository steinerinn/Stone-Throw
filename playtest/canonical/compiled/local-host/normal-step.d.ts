import type { HostState } from '../host/contracts.js';
import type { NormalMemory } from './normal-policy.js';
export declare function refreshNormalMemory(h: HostState, m: NormalMemory): void;
export declare function normalEnemyStep(input: HostState, m: NormalMemory, observePresentationStep?: import('../host/lifecycle.js').HostExecution['observePresentationStep']): HostState;
