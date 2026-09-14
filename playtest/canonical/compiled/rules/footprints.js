/** Stage 7 legacy-compatible pure rules. Order and quirks are intentional.
 * Explicit readonly inputs; no DOM, RNG, state mutation or AI policy.
 * See extraction-map.json for source hashes and transitive dependencies. */
import { key } from './coordinates.js';
export function cavCellsAt(x, y, orient) { if (orient === 'H')
    return [key(x, y), key(x + 1, y)];
else
    return [key(x, y), key(x, y + 1)]; }
export function rotateCastleOffset(dx, dy, turns) {
    let x = dx, y = dy;
    const t = ((turns % 4) + 4) % 4;
    for (let i = 0; i < t; i++) {
        const nx = -y, ny = x;
        x = nx;
        y = ny;
    }
    return { dx: x, dy: y };
}
export function castleMoveCells(anchorX, anchorY, offsets, rotation = 0) {
    return offsets.map(o => {
        const r = rotateCastleOffset(o.dx, o.dy, rotation);
        return key(anchorX + r.dx, anchorY + r.dy);
    });
}
