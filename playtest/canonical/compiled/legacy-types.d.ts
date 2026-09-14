import type { Cell, UnitType, HeroState, EffectKind, DecisionKind, Phase } from './model.js';
/** Trusted test-process DTO. Legacy names and tokens end at the adapter boundary. */
export type LegacySide = 'player' | 'enemy';
export interface LegacyUnit {
    token: string;
    type: UnitType;
    cells: Cell[];
    hero: HeroState | null;
    archerSpent: boolean | null;
    monkSpent: boolean | null;
}
export interface LegacySideFrame {
    units: LegacyUnit[];
    shotsAgainst: Cell[];
    scoutedByOther: Cell[];
    monkCluesForOther: Cell[];
    resurrection: {
        pending: boolean;
        searchActive: boolean;
        actualToken: string | null;
        suspects: Cell[];
        eligibleTokens: string[];
    };
    plague: {
        origin: Cell | null;
        moveOn: LegacySide;
        outbreaks: {
            ordinal: number;
            round: number;
            origin: Cell | null;
            frontier: Cell[];
            infected: Cell[];
        }[];
    } | null;
    plagueKilled: Cell[];
    privateAi: {
        knownHits: Cell[];
        heroCandidates: Cell[];
    };
}
export interface LegacyFrame {
    epoch: number;
    size: number;
    phase: Phase;
    rawPhase: string;
    round: number;
    roundStarter: LegacySide | null;
    active: LegacySide | null;
    rosters: Record<LegacySide, Partial<Record<UnitType, number>>>;
    budgets: Record<LegacySide, {
        remaining: number | null;
        next: number | null;
    }>;
    sides: Record<LegacySide, LegacySideFrame>;
    effects: {
        token: string;
        kind: EffectKind;
        owner: LegacySide;
        target: LegacySide | null;
        origin: Cell | null;
        remaining: number | null;
        due: 'same-turn' | 'next-turn' | 'queued-chain' | 'unresolved';
    }[];
    decisions: {
        kind: DecisionKind;
        actor: LegacySide;
        boardOwner: LegacySide;
        unitToken: string | null;
        candidates: Cell[];
        eligibleTokens: string[];
        remaining: number | null;
        complete: boolean;
    }[];
    outcome: 'player' | 'enemy' | 'draw' | 'ongoing' | 'undetermined';
}
