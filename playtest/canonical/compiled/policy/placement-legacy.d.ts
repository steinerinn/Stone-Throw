import type { UnitType } from '../model.js';
import type { ExplicitRng } from '../combat/contracts.js';
type Roster = Partial<Record<UnitType, number>>;
export interface PolicyPlacement {
    type: UnitType;
    cells: string[];
}
/** Mechanically isolated compatibility policy; source provenance records each omitted visual statement. */
export declare function legacyRandomPlacement(profile: 'first-seat' | 'second-seat', SIZE: number, roster: Roster, rng: ExplicitRng, STORY_MODE_ACTIVE?: boolean, STORY_BATTLE_NUMBER?: number, fixedCells?: readonly string[]): PolicyPlacement[];
export {};
