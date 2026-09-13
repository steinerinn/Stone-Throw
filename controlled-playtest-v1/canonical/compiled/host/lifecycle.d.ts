import type { HostState, HostCommand } from './contracts.js';
import type { ResolutionContext } from '../combat/contracts.js';
export interface HostExecution {
    observePresentationStep?: (host: HostState) => void;
    normalTerminalMessage?: (host: HostState) => void;
    reserveNormalDemonRunes?: (ctx: ResolutionContext) => void;
}
export declare function pumpHost(h: HostState, maxSteps?: number, execution?: HostExecution): void;
export declare function acceptCommand(host: HostState, command: HostCommand, execution?: HostExecution): HostState;
