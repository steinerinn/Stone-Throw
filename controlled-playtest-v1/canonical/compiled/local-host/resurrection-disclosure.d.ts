import type { HostState } from '../host/contracts.js';
import type { ResurrectionSearch, SeenCell, Cell } from '../client-contract/public.js';
/** Authorized active enemy-search privacy exception. Never consult the actual
 * resurrected identity, damage, shots, abilities or resurrection count here. */
export declare function enemyResurrectionSearch(h: HostState): ResurrectionSearch;
export declare function maskResurrectionCells(cells: SeenCell[], search: ResurrectionSearch): SeenCell[];
export declare function knownCasualtyCells(h: HostState, cells: SeenCell[]): SeenCell[];
/** Legacy UI permits attempting a click, while the authority validates it.
 * Do not publish which private suspect is accepted by Scout/Catapult. */
export declare function maskResurrectionChoices(cells: Cell[], search: ResurrectionSearch, scouted: string[]): Cell[];
/** Existing aim-assist geometry, with private resurrection shot removal masked.
 * Fully destroyed units have already disclosed their complete footprint. */
export declare function publicAimAssist(h: HostState): Cell[];
