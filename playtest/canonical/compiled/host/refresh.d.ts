import type { HostState } from './contracts.js';
import type { InternalRuleEvent } from '../combat/contracts.js';
/** Minimal disclosure: public cells, counts and acting-player decisions. No private
 * source IDs, RNG, hidden unit type or AI targeting memory is copied to observers. */
export declare function refreshHost(host: HostState): void;
export declare function observeResurrectionFeedback(host: HostState, boardId: HostState['state']['seats'][number]['boardId'], cell: {
    x: number;
    y: number;
}, found: boolean): void;
export declare function observeRuleEvent(host: HostState, event: InternalRuleEvent): void;
