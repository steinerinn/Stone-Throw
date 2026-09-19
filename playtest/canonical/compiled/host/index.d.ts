/** Private authoritative simulation entry. Never serve HostState/HostReplay to
 * an observer; public clients receive projectObserver results only. */
export type * from './contracts.js';
export { createHost } from './initialization.js';
export { acceptCommand, pumpHost } from './lifecycle.js';
export { autoStep, runAutoMatch } from './auto-match.js';
export { assertHost, serializeHost, deserializeHost } from './serialization.js';
export { createPrivateReplay, recordReplayStep, replayPrivate, hostFingerprint } from './replay.js';
export type { HostReplay, ReplayAction, ReplayStep } from './replay.js';
export { coreSurvivors, unitsDestroyed } from './statistics.js';
