// Completed journal records are immutable values. Current boards, counters, pending
// work, and the appendable arrays are always copied. No input record is frozen.
const sealed = new WeakSet();
export function isArchive(value) { return sealed.has(value); }
export function archiveValue(value) {
    if (value === null || typeof value !== 'object')
        return value;
    if (sealed.has(value))
        return value;
    const copy = structuredClone(value);
    const freeze = (v) => { if (v && typeof v === 'object') {
        for (const child of Object.values(v))
            freeze(child);
        Object.freeze(v);
        sealed.add(v);
    } };
    freeze(copy);
    return copy;
}
export function archiveRows(rows) { return rows.map(archiveValue); }
export function cloneRng(rng) { return { ...rng, draws: archiveRows(rng.draws) }; }
export function cloneCombat(state) {
    const m = state.match, copy = structuredClone({ ...state, match: { ...m, history: [], knowledge: Object.fromEntries(Object.entries(m.knowledge).map(([id, k]) => [id, { ...k, events: [], boards: Object.fromEntries(Object.entries(k.boards).map(([owner, b]) => [owner, { ...b, cells: [] }])) }])) } });
    copy.match.history = archiveRows(m.history);
    for (const [id, k] of Object.entries(m.knowledge)) {
        copy.match.knowledge[id].events = archiveRows(k.events);
        for (const [owner, b] of Object.entries(k.boards))
            copy.match.knowledge[id].boards[owner].cells = archiveRows(b.cells);
    }
    return copy;
}
export function cloneHost(host) {
    const copy = structuredClone({ ...host, state: null, rng: null, history: [], events: [], initial: null, initialRng: null, pendingRoot: host.pendingRoot ? { ...host.pendingRoot, state: null, rng: null } : null });
    copy.state = cloneCombat(host.state);
    copy.rng = cloneRng(host.rng);
    copy.history = archiveRows(host.history);
    copy.events = archiveRows(host.events);
    copy.initial = archiveValue(host.initial);
    copy.initialRng = archiveValue(host.initialRng);
    if (copy.pendingRoot) {
        copy.pendingRoot.state = copy.state;
        copy.pendingRoot.rng = copy.rng;
    }
    return copy;
}
/** Private transport snapshots may seal sequence containers; the first writer takes a mutable copy. */
export function archiveSequence(rows) { const out = archiveRows(rows); Object.freeze(out); sealed.add(out); return out; }
export function mutableRows(rows) { return Object.isFrozen(rows) ? rows.slice() : rows; }
