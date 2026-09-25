import type { HostState, HostCommand } from './contracts.js';
/** Private regression format. The exact canonical JSON is a collision-free
 * comparison fingerprint, not a compact cryptographic digest or client payload. */
export declare function hostFingerprint(host: HostState): string;
export type ReplayAction = {
    kind: 'policy-step';
} | {
    kind: 'command';
    command: HostCommand;
};
export interface ReplayStep {
    action: ReplayAction;
    accepted: HostCommand[];
    rngBefore: number;
    rngAfter: number;
    fingerprint: string;
}
export interface HostReplay {
    contract: 'stone-throw-private-replay-v1';
    rulesVersion: HostState['config']['rulesVersion'];
    initial: HostState;
    initialFingerprint: string;
    steps: ReplayStep[];
    finalFingerprint: string;
}
export declare function createPrivateReplay(initial: HostState): HostReplay;
/** Records policy entry separately, so its private RNG consumption is reproduced
 * rather than injected through an unvalidated command-side entropy gap. */
export declare function recordReplayStep(replay: HostReplay, host: HostState, action: ReplayAction): HostState;
export declare function replayPrivate(record: HostReplay): HostState;
