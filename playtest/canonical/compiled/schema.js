const str = { kind: 'str' }, num = { kind: 'num' }, bool = { kind: 'bool' }, nil = { kind: 'null' };
const en = (...values) => ({ kind: 'enum', values }), arr = (item) => ({ kind: 'array', item }), obj = (fields) => ({ kind: 'object', fields }), dict = (item) => ({ kind: 'dict', item }), union = (...items) => ({ kind: 'union', items }), nullable = (s) => union(nil, s);
const cell = obj({ x: num, y: num }), cells = arr(cell), unitType = en('inf', 'cav', 'archer', 'monk', 'castle', 'dwarf', 'goblin', 'catapult', 'elf', 'cleric', 'demon', 'dragon', 'wizard', 'necro', 'hero');
const player = obj({ id: str, boardIds: arr(str) }), board = obj({ id: str, ownerId: str, width: num, height: num }), phase = en('placement', 'ready', 'action', 'resolving', 'decision', 'finished', 'unresolved');
const unit = obj({ id: str, ownerId: str, boardId: str, type: nullable(unitType), cells, lifecycle: en('unplaced', 'present', 'destroyed', 'unresolved'), damage: obj({ cells, hitsTaken: nullable(num) }), hero: nullable(obj({ activated: bool, hitsTaken: num, originalCell: nullable(cell), currentCell: nullable(cell), relocationPending: bool })), abilities: arr(obj({ kind: unitType, spent: bool })), resurrectionCount: nullable(num) });
const outcome = union(obj({ kind: en('undetermined') }), obj({ kind: en('ongoing') }), obj({ kind: en('draw') }), obj({ kind: en('win'), winnerIds: arr(str), eliminatedIds: arr(str) }));
const decisionKind = en('catapult-target', 'scout', 'resurrection', 'hero-relocation', 'hero-confirmation');
const knownBoard = obj({ boardId: str, cells: arr(obj({ cell, observation: en('miss', 'impact', 'occupied', 'empty', 'uncertain'), unitType: nullable(unitType), contactId: nullable(str) })), contacts: arr(obj({ id: str, unitType: nullable(unitType), cells, completeGeometry: bool })), clues: arr(obj({ kind: en('monk-candidates', 'resurrection-search', 'hero-search', 'elf-scout'), cells })) });
const events = arr(obj({ sequence: num, kind: en('impact', 'miss', 'unit-disclosed', 'resurrection-announced', 'hero-moved', 'plague-observed', 'resurrection-rejected', 'resurrection-found'), boardId: str, cell: nullable(cell), unitType: nullable(unitType), contactId: nullable(str) }));
const stats = arr(obj({ kind: en('shots', 'observed-hits'), playerId: str, value: num })), visibleDecisions = arr(obj({ sequence: num, kind: decisionKind, boardId: str, candidates: cells, remaining: nullable(num) })), visibleTurn = nullable(obj({ phase, activePlayerId: nullable(str), round: num }));
const observer = obj({ boards: dict(knownBoard), events, stats, decisions: visibleDecisions, turn: visibleTurn, outcome: nullable(outcome) });
export const stateSchema = obj({ contract: en('match-state-v1'), matchId: str, config: obj({ rulesVersion: str, playerOrder: arr(str), boards: arr(board), initialRosters: dict(dict(num)), format: en('legacy-1v1', 'unspecified-n-player', 'active-ring-v1') }), players: arr(player), boards: arr(board), units: arr(unit), turn: obj({ phase, activePlayerId: nullable(str), round: num, turnIndex: nullable(num), roundStarterId: nullable(str), budgets: arr(obj({ playerId: str, remaining: nullable(num), next: nullable(num) })) }), effects: arr(obj({ id: str, kind: en('archer', 'monk', 'dwarf', 'catapult', 'elf', 'cleric', 'wizard', 'dragon', 'demon', 'goblin', 'plague', 'hero-relocation', 'unresolved-chain'), actorId: nullable(str), ownerId: str, targetId: nullable(str), boardId: nullable(str), origin: nullable(cell), cells, remaining: nullable(num), due: en('same-turn', 'next-turn', 'queued-chain', 'unresolved'), status: en('queued', 'active', 'unresolved') })), decisions: arr(obj({ id: str, kind: decisionKind, actorId: str, boardId: str, unitId: nullable(str), candidates: cells, unitChoices: arr(str), remaining: nullable(num), candidateCoverage: en('complete', 'unavailable') })), plagues: arr(obj({ ownerId: nullable(str), targetId: str, boardId: str, moveOnPlayerId: nullable(str), origin: nullable(cell), outbreaks: arr(obj({ ordinal: num, round: num, origin: nullable(cell), frontier: cells, infected: cells })), killedCells: cells })), resurrections: arr(obj({ ownerId: str, boardId: str, pending: bool, searchActive: bool, actualUnitId: nullable(str), suspects: cells, eligibleUnitIds: arr(str) })), history: arr(obj({ id: str, kind: en('impact', 'damage-restored', 'relocation', 'unit-observed'), actorId: nullable(str), targetId: str, boardId: str, unitId: nullable(str), cell, turnIndex: nullable(num) })), plagueExclusions: arr(obj({ boardId: str, cells })), outcome, rng: union(obj({ kind: en('unavailable') }), obj({ kind: en('lcg32'), seed: num, state: num, draws: num })), knowledge: dict(observer), privateAi: arr(obj({ playerId: str, boardId: str, knownHits: cells, scouted: arr(obj({ cell, unitType: nullable(unitType) })), heroCandidates: cells })) });
export const projectionSchema = obj({ contract: en('observer-snapshot-v1'), matchId: str, rulesVersion: str, observerId: str, players: arr(player), boards: arr(board), ownedUnits: arr(unit), knowledge: dict(knownBoard), events, stats, decisions: visibleDecisions, turn: visibleTurn, outcome: nullable(outcome) });
export function validate(schema, value, path = '$', ancestors = new Set()) {
    if (schema.kind === 'union') {
        for (const s of schema.items) {
            if (s.kind === 'null' && value !== null)
                continue;
            try {
                validate(s, value, path, ancestors);
                return;
            }
            catch { }
        }
        throw Error(path + ': no matching contract');
    }
    if (schema.kind === 'null') {
        if (value !== null)
            throw Error(path + ': expected null');
        return;
    }
    if (schema.kind === 'enum') {
        if (!schema.values.includes(value))
            throw Error(path + ': invalid enum');
        return;
    }
    if (schema.kind === 'str') {
        if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_.-]{0,95}$/.test(value) || ['constructor', 'prototype', '__proto__'].includes(value))
            throw Error(path + ': invalid token');
        return;
    }
    if (schema.kind === 'num') {
        if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
            throw Error(path + ': expected nonnegative integer');
        return;
    }
    if (schema.kind === 'bool') {
        if (typeof value !== 'boolean')
            throw Error(path + ': expected boolean');
        return;
    }
    if (value === null || typeof value !== 'object' || ancestors.has(value))
        throw Error(path + ': expected acyclic JSON object');
    const next = new Set(ancestors);
    next.add(value);
    if (schema.kind === 'array') {
        if (!Array.isArray(value))
            throw Error(path + ': expected array');
        if (Reflect.ownKeys(value).length !== value.length + 1 || Object.keys(value).length !== value.length)
            throw Error(path + ': sparse or extended array');
        for (let i = 0; i < value.length; i++) {
            const d = Object.getOwnPropertyDescriptor(value, String(i));
            if (!d || !('value' in d) || !d.enumerable)
                throw Error(path + ': array accessor');
            validate(schema.item, d.value, path + '.' + i, next);
        }
        return;
    }
    if (Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
        throw Error(path + ': non-JSON object');
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Reflect.ownKeys(value).length !== Object.keys(descriptors).length)
        throw Error(path + ': symbol key');
    for (const [k, d] of Object.entries(descriptors))
        if (!d.enumerable || !('value' in d) || ['__proto__', 'prototype', 'constructor'].includes(k))
            throw Error(path + ': unsafe property');
    const record = value;
    if (schema.kind === 'object') {
        if (Object.keys(record).sort().join('|') !== Object.keys(schema.fields).sort().join('|'))
            throw Error(path + ': unexpected/missing fields');
        for (const [k, s] of Object.entries(schema.fields))
            validate(s, record[k], path + '.' + k, next);
    }
    else if (schema.kind === 'dict') {
        for (const [k, v] of Object.entries(record)) {
            validate(str, k, path + '.key', next);
            validate(schema.item, v, path + '.' + k, next);
        }
    }
}
