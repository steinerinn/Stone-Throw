import type { HostState } from '../host/contracts.js';
import type { SeenCell } from '../client-contract/public.js';
/** Stationary-unit hit/Scout observations, including Plague casualties.
 * Hero movement has its own retained presentation history.
 * This adapter never projects an unobserved cell or a canonical unit handle. */
export declare function stationaryDisclosure(h: HostState, base: SeenCell[], records?: {
    turnIndex: number;
    event: import("../combat/contracts.js").InternalRuleEvent;
}[]): SeenCell[];
