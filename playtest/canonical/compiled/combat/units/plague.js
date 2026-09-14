import { random } from '../rng.js';
import { neighbors8, parseKey } from '../../rules/coordinates.js';
export function plagueBranchCount(rng) { const r = random(rng, 'plague-branches') * 100; if (r < 40)
    return 1; if (r < 100)
    return 2; return 1; }
export function plagueOpenScore(size, k, shots, reserved) { const { x, y } = parseKey(k); return neighbors8({ size }, x, y).filter(n => !shots.has(n) && !reserved.has(n)).length; }
export function plagueWeightedChoice(size, options, shots, reserved, rng) { if (!options.length)
    return null; const weights = options.map(k => 1 + plagueOpenScore(size, k, shots, reserved)), total = weights.reduce((a, b) => a + b, 0); let r = random(rng, 'plague-weighted-cell') * total; for (let i = 0; i < options.length; i++) {
    r -= weights[i];
    if (r <= 0)
        return options[i];
} return options.at(-1); }
export function plagueWholeEdgeCandidates(size, outbreak, shots, reserved) { const set = new Set(); for (const k of outbreak.infected) {
    const { x, y } = parseKey(k);
    for (const n of neighbors8({ size }, x, y))
        if (!shots.has(n) && !reserved.has(n))
            set.add(n);
} return [...set]; }
