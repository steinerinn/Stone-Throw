/** Private shadow/comparison API. Not an observer API or a live browser bridge. */
export type * from './contracts.js';
export { startResolution, stepResolution, runResolution } from './resolver.js';
export { answerDecision } from './decisions.js';
export { createRuleRng } from './rng.js';
export { assertResolution, serializeResolution, deserializeResolution } from './serialization.js';
