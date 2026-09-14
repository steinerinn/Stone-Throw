import { assertMatchState } from '../invariants.js';
import { assertResolution } from '../combat/serialization.js';
import { stableJson } from '../serialization.js';
import { createHost } from './initialization.js';
function jsonOnly(value, seen = new Set()) { if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return; if (typeof value === 'number') {
    if (!Number.isFinite(value))
        throw Error('Nonfinite host value');
    return;
} if (!value || typeof value !== 'object' || seen.has(value))
    throw Error('Nonserializable host value'); if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
    throw Error('Host contains nonplain object'); if (Object.getOwnPropertySymbols(value).length)
    throw Error('Host contains symbols'); seen.add(value); for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (Array.isArray(value) && key === 'length')
        continue;
    if (!descriptor.enumerable || descriptor.get || descriptor.set)
        throw Error('Host contains hidden/accessor state');
    jsonOnly(descriptor.value, seen);
} if (Array.isArray(value))
    for (let i = 0; i < value.length; i++)
        if (!(i in value))
            throw Error('Sparse host array'); seen.delete(value); }
export function assertHost(value) { jsonOnly(value); const h = value; if (h?.contract !== 'stone-throw-host-v1')
    throw Error('Unknown host contract'); const empty = createHost(h.config); if (Object.keys(h).sort().join('|') !== Object.keys(empty).sort().join('|'))
    throw Error('Unknown/missing host fields'); assertMatchState(h.state.match); assertMatchState(h.initial.match); if (h.pendingRoot) {
    assertResolution(h.pendingRoot);
    if (stableJson(h.pendingRoot.state) !== stableJson(h.state) || stableJson(h.pendingRoot.rng) !== stableJson(h.rng))
        throw Error('Pending root/state mismatch');
} if (h.status === 'awaiting-decision' && h.pendingRoot?.status !== 'awaiting-decision')
    throw Error('Missing paused root'); if (h.status === 'complete' && (h.pendingRoot || !['win', 'draw'].includes(h.state.match.outcome.kind)))
    throw Error('Invalid completed host'); if (h.rng.cursor !== h.rng.draws.length || h.rng.draws.some((d, i) => d.ordinal !== i))
    throw Error('Invalid host RNG journal'); const ids = new Set(); for (const [i, r] of h.history.entries()) {
    if (r.sequence !== i + 1 || ids.has(r.command.id) || r.rngBefore > r.rngAfter || r.eventStart > r.eventEnd || r.eventEnd > h.events.length)
        throw Error('Invalid host command journal');
    ids.add(r.command.id);
} }
export function serializeHost(host) { assertHost(host); return stableJson(host); }
export function deserializeHost(text) { const value = JSON.parse(text); assertHost(value); return value; }
