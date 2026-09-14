import type { HostExecution } from './lifecycle.js';
import type { HostState } from './contracts.js';
/** Private simulation controller. Policy draws are recorded in the RNG journal;
 * accepted commands still pass the same host legality/decision interface. */
export declare function autoStep(input: HostState, execution?: HostExecution): HostState;
export declare function runAutoMatch(initial: HostState, maxCommands?: number): HostState;
