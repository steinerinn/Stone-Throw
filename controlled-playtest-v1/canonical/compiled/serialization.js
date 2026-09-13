import { assertMatchState } from './invariants.js';
export function freezeConfiguration(config) {
    const walk = (v) => { if (v && typeof v === 'object') {
        Object.values(v).forEach(walk);
        Object.freeze(v);
    } };
    walk(config);
    return config;
}
/** Stable key ordering for fingerprints; this is not a gameplay RNG or event order. */
export function stableJson(v) {
    if (v === null || typeof v !== 'object')
        return JSON.stringify(v);
    if (Array.isArray(v))
        return '[' + v.map(stableJson).join(',') + ']';
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stableJson(v[k])).join(',') + '}';
}
export function serializeMatch(state) { assertMatchState(state); return stableJson(state); }
export function deserializeMatch(text) {
    if (text.length > 16 * 1024 * 1024)
        throw Error('Snapshot too large');
    const value = JSON.parse(text);
    assertMatchState(value);
    freezeConfiguration(value.config);
    return value;
}
