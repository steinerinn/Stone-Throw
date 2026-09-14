/** Stage 7 legacy-compatible pure rules. Order and quirks are intentional.
 * Explicit readonly inputs; no DOM, RNG, state mutation or AI policy.
 * See extraction-map.json for source hashes and transitive dependencies. */
import { key, parseKey, inBounds } from './coordinates.js';
export function demonPatternFrom(ctx, k) {
    const { x, y } = parseKey(k);
    const cells = [];
    for (let cy = 0; cy < ctx.size; cy++)
        cells.push(key(x, cy)); // F1 -> F10 first
    for (let cx = 0; cx < ctx.size; cx++) {
        const kk = key(cx, y);
        if (kk !== k)
            cells.push(kk);
    } // A6 -> J6 next
    return cells;
}
export function dragonFlightPathsFrom(ctx, k) {
    const { x, y } = parseKey(k);
    const first = [], second = [];
    let sx = x, sy = y;
    while (sx > 0 && sy > 0) {
        sx--;
        sy--;
    }
    while (inBounds(ctx, sx, sy)) {
        first.push(key(sx, sy));
        sx++;
        sy++;
    }
    sx = x;
    sy = y;
    while (sx < ctx.size - 1 && sy > 0) {
        sx++;
        sy--;
    }
    while (inBounds(ctx, sx, sy)) {
        const kk = key(sx, sy);
        if (kk !== k)
            second.push(kk); // origin/intersection only once overall
        sx--;
        sy++;
    }
    return [first, second];
}
export function wizardBlastLayersFrom(ctx, k) {
    const { x, y } = parseKey(k);
    const addLayer = (offsets) => offsets
        .map(([dx, dy]) => [x + dx, y + dy])
        .filter(([tx, ty]) => inBounds(ctx, tx, ty))
        .map(([tx, ty]) => key(tx, ty));
    if (ctx.size <= 5) {
        return [
            [key(x, y)],
            addLayer([[0, -1], [1, 0], [0, 1], [-1, 0]])
        ].filter(layer => layer.length);
    }
    if (ctx.size <= 10) {
        return [
            [key(x, y)],
            addLayer([[0, -1], [1, 0], [0, 1], [-1, 0]]),
            addLayer([
                [0, -2], [1, -1], [2, 0], [1, 1],
                [0, 2], [-1, 1], [-2, 0], [-1, -1]
            ])
        ].filter(layer => layer.length);
    }
    if (ctx.size <= 15) {
        return [
            [key(x, y)],
            addLayer([
                [-1, -1], [0, -1], [1, -1],
                [-1, 0], [1, 0],
                [-1, 1], [0, 1], [1, 1]
            ]),
            addLayer([
                [-1, -2], [0, -2], [1, -2],
                [-2, -1], [2, -1],
                [-2, 0], [2, 0],
                [-2, 1], [2, 1],
                [-1, 2], [0, 2], [1, 2]
            ])
        ].filter(layer => layer.length);
    }
    return [
        [key(x, y)],
        addLayer([
            [-1, -1], [0, -1], [1, -1],
            [-1, 0], [1, 0],
            [-1, 1], [0, 1], [1, 1]
        ]),
        addLayer([
            [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2],
            [-2, -1], [2, -1],
            [-2, 0], [2, 0],
            [-2, 1], [2, 1],
            [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2]
        ]),
        addLayer([
            [-1, -3], [0, -3], [1, -3],
            [-2, -2], [2, -2],
            [-3, -1], [3, -1],
            [-3, 0], [3, 0],
            [-3, 1], [3, 1],
            [-2, 2], [2, 2],
            [-1, 3], [0, 3], [1, 3]
        ])
    ].filter(layer => layer.length);
}
