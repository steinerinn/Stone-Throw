/** Caller supplies the defender's occupancy, shots against that board and an
 * optional allowed mask. The legacy player mask must NOT be applied to enemies.
 * Deliberately no bounds, proximity, Plague avoidance or AI preference check. */
export declare function legalHeroRelocation(k: string, input: Readonly<{
    occupied: ReadonlySet<string>;
    shots: ReadonlySet<string>;
    allowed: ReadonlySet<string> | null;
}>): boolean;
