import type { HostState } from '../host/contracts.js';
import type { SeenCell } from '../client-contract/public.js';
/** Public deduction is independent of combat/AI compatibility candidates. */
export declare function publicMonkClues(h: HostState, seen: readonly SeenCell[]): import("../model.js").Cell[];
