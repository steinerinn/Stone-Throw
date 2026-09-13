/** Stage 7 legacy-compatible pure rules. Order and quirks are intentional.
 * Explicit readonly inputs; no DOM, RNG, state mutation or AI policy.
 * See extraction-map.json for source hashes and transitive dependencies. */
export declare function key(x: number, y: number): string;
export declare function parseKey(k: string): {
    x: number;
    y: number;
};
export declare function inBounds(ctx: Readonly<{
    size: number;
}>, x: number, y: number): boolean;
export declare function neighbors4(ctx: Readonly<{
    size: number;
}>, x: number, y: number): string[];
export declare function neighbors8(ctx: Readonly<{
    size: number;
}>, x: number, y: number): string[];
export declare function ring3x3CellsOf(ctx: Readonly<{
    size: number;
}>, keys: Iterable<string>): Set<string>;
