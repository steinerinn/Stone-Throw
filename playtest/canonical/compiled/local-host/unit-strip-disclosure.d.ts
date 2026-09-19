import type { HostState } from '../host/contracts.js';
import type { UnitKind, Side } from '../client-contract/public.js';
export interface StripState {
    placed: number;
    destroyed: number;
    heroHits: number;
}
/** Aggregate public strip status only. No unit IDs or private geometry cross.
 * During enemy search, already-public candidate casualties remain dead-looking
 * until accepted elimination/discovery reveals a new state. */
export declare function publicUnitStrips(h: HostState): Record<Side, Partial<Record<UnitKind, StripState>>>;
