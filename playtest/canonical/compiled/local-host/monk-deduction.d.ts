import type { Cell } from '../model.js';
import type { SeenCell } from '../client-contract/public.js';
/** Only public evidence enters this module: no host, units, RNG, or private board. */
export declare function updateMonkEvidence(size: number, prior: readonly Cell[], probe: Cell, deflected: boolean): Cell[];
export declare function deduceMonkCandidates(size: number, evidence: readonly Cell[], seen: readonly SeenCell[]): Cell[];
