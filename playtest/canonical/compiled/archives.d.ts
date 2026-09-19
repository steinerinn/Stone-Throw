import type { HostState } from './host/contracts.js';
import type { CombatState, ExplicitRng } from './combat/contracts.js';
export declare function isArchive(value: object): boolean;
export declare function archiveValue<T>(value: T): T;
export declare function archiveRows<T>(rows: readonly T[]): T[];
export declare function cloneRng(rng: ExplicitRng): ExplicitRng;
export declare function cloneCombat(state: CombatState): CombatState;
export declare function cloneHost(host: HostState): HostState;
/** Private transport snapshots may seal sequence containers; the first writer takes a mutable copy. */
export declare function archiveSequence<T>(rows: readonly T[]): T[];
export declare function mutableRows<T>(rows: T[]): T[];
