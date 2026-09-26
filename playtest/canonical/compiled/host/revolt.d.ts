import type { HostState } from './contracts.js';
import type { PlayerId } from '../model.js';
export declare const activeRevoltPlayers: (h: HostState) => PlayerId[];
export declare function heroOnly(h: HostState): boolean;
export declare function observeRevolt(h: HostState): void;
export declare function startRevoltTurn(h: HostState): void;
/** Snapshot the existing score formula, excluding all final-result bonuses. */
export declare function earnedScores(h: HostState): {
    [k: string]: any;
};
export declare function finishRevoltRound(h: HostState, resumeStep?: 'enter' | 'finish'): boolean;
export declare function compareScore(a: {
    n: string;
    d: string;
}, b: {
    n: string;
    d: string;
}): 0 | 1 | -1;
/** One elimination boundary for the entire pulse, including its canonical chains. */
export declare function settleRevolt(h: HostState): boolean;
