/** Counts roster units, not occupied cells, current survivors or combat HP.
 * Optional units and aliases are deliberately not folded into these five keys. */
export type CoreRoster=Readonly<Partial<Record<'inf'|'cav'|'archer'|'monk'|'castle',number>>>;
export function requiredCoreUnitCount(r:CoreRoster):number {
 return (r.inf||0)+(r.cav||0)+(r.archer||0)+(r.monk||0)+(r.castle||0);
}
