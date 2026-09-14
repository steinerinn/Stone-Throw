export declare function anyConflictsSingle(ctx: Readonly<{
    occupied: ReadonlySet<string>;
    size: number;
}>, targetKey: string, ignoreKeys?: ReadonlySet<string>): string[];
export declare function anyConflictsMulti(ctx: Readonly<{
    occupied: ReadonlySet<string>;
    size: number;
}>, targetKeys: readonly string[], ignoreKeys?: ReadonlySet<string>): string[];
export declare function canPlaceInf(ctx: Readonly<{
    occupied: ReadonlySet<string>;
    size: number;
}>, x: number, y: number): boolean;
export declare function canPlaceCav(ctx: Readonly<{
    occupied: ReadonlySet<string>;
    size: number;
}>, x: number, y: number, orient: string): {
    ok: boolean;
    offenders: string[];
};
export declare function canPlaceCastleShape(ctx: Readonly<{
    occupied: ReadonlySet<string>;
    size: number;
}>, cells: readonly string[]): {
    ok: boolean;
    offenders: string[];
};
export declare function castleCellsConnected(ctx: Readonly<{
    size: number;
}>, cellsSet: ReadonlySet<string>): boolean;
export declare function validCastleExpansionCells(ctx: Readonly<{
    occupied: ReadonlySet<string>;
    size: number;
}>, castle: Readonly<{
    cells: ReadonlySet<string>;
}>): Set<string>;
export declare function canRemoveCastleCell(ctx: Readonly<{
    size: number;
}>, castle: Readonly<{
    cells: ReadonlySet<string>;
}> | null, k: string): boolean;
