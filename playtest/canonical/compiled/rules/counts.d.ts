/** Counts roster units, not occupied cells, current survivors or combat HP.
 * Optional units and aliases are deliberately not folded into these five keys. */
export type CoreRoster = Readonly<Partial<Record<'inf' | 'cav' | 'archer' | 'monk' | 'castle', number>>>;
export declare function requiredCoreUnitCount(r: CoreRoster): number;
