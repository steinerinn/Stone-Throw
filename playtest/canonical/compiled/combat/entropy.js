import { random } from './rng.js';
/** Compatibility-only entropy reported by an external presentation adapter.
 * No visual operation executes here. Values and their position in the rule RNG
 * stream are checked exactly; unknown or unconsumed entries fail comparison. */
export function consumeCompatibilityEntropy(ctx) { const ordinal = ctx.events.filter(e => e.kind === 'impact').length; while (ctx.externalEntropy[0]?.beforeImpact === ordinal) {
    const entropy = ctx.externalEntropy.shift();
    for (const expected of entropy.values) {
        if (random(ctx.rng, entropy.purpose) !== expected)
            throw Error('Legacy entropy sequence differs');
    }
} }
