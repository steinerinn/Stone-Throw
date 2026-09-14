/** Caller supplies the defender's occupancy, shots against that board and an
 * optional allowed mask. The legacy player mask must NOT be applied to enemies.
 * Deliberately no bounds, proximity, Plague avoidance or AI preference check. */
export function legalHeroRelocation(k, input) {
    if (input.occupied.has(k) || input.shots.has(k))
        return false;
    if (input.allowed && !input.allowed.has(k))
        return false;
    return true;
}
