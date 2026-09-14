export declare function cavCellsAt(x: number, y: number, orient: string): string[];
export declare function rotateCastleOffset(dx: number, dy: number, turns: number): {
    dx: number;
    dy: number;
};
export declare function castleMoveCells(anchorX: number, anchorY: number, offsets: ReadonlyArray<Readonly<{
    dx: number;
    dy: number;
}>>, rotation?: number): string[];
