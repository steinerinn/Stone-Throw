export * from './model.js';
export {assertMatchState} from './invariants.js';
export {serializeMatch,deserializeMatch,freezeConfiguration} from './serialization.js';
export {projectObserver,reconnectSnapshot,serializeObserver,assertObserverSnapshot} from './visibility.js';
// The legacy adapter is deliberately a separate import and is never a browser bridge.
