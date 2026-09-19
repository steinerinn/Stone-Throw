import type { HostState } from '../host/contracts.js';
import type { Cell } from '../model.js';
/** Cosmetic history only: own known positions and public enemy hit sites.
 * Never publish an unscouted enemy relocation destination. No state writes/RNG. */
export declare function publicHeroPresentation(h: HostState, records?: {
    turnIndex: number;
    event: import("../combat/contracts.js").InternalRuleEvent;
}[]): {
    side: "self" | "opponent";
    cell: Cell;
    state: "initial" | "active" | "hit" | "wounded" | "dead";
}[];
