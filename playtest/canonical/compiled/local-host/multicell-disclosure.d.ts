import type { HostState } from '../host/contracts.js';
import type { SeenCell } from '../client-contract/public.js';
/** Trusted normal-browser disclosure adapter. Private geometry is used only to
 * reproduce the accepted identification predicates. Only observed cells leave
 * this boundary; an unidentified core carries neither type nor geometry. */
export declare function multiCellDisclosure(h: HostState, base: SeenCell[], records?: {
    turnIndex: number;
    event: import("../combat/contracts.js").InternalRuleEvent;
}[]): SeenCell[];
