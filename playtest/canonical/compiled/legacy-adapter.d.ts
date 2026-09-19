import type { PlayerId, BoardId, MatchId, MatchState } from './model.js';
import type { LegacyFrame, LegacySide } from './legacy-types.js';
export interface LegacyMapping {
    matchId: MatchId;
    players: Record<LegacySide, PlayerId>;
    boards: Record<LegacySide, BoardId>;
}
export interface ShadowResult {
    state: MatchState;
    coverage: {
        history: 'sampled-deltas-only';
        rng: 'unavailable';
        visibility: 'conservative-under-disclosure';
        identity: 'stable-within-epoch-legacy-tokens';
        unavailable: string[];
    };
}
/** Offline session; never installed in either browser build. Each setup/restart needs a new session. */
export declare class LegacyShadowSession {
    private mapping;
    private previous;
    private epoch;
    private config;
    private registry;
    private counts;
    constructor(mapping: LegacyMapping);
    snapshot(raw: LegacyFrame): ShadowResult;
}
