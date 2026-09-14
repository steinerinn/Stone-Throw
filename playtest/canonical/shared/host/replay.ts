import type {HostState,HostCommand} from './contracts.js';
import {stableJson} from '../serialization.js';
import {assertMatchState} from '../invariants.js';
import {acceptCommand} from './lifecycle.js';
import {autoStep} from './auto-match.js';

/** Private regression format. The exact canonical JSON is a collision-free
 * comparison fingerprint, not a compact cryptographic digest or client payload. */
export function hostFingerprint(host:HostState):string{return stableJson(host);}
export type ReplayAction={kind:'policy-step'}|{kind:'command';command:HostCommand};
export interface ReplayStep {action:ReplayAction;accepted:HostCommand[];rngBefore:number;rngAfter:number;fingerprint:string}
export interface HostReplay {contract:'stone-throw-private-replay-v1';rulesVersion:'stone-throw-v1.427';initial:HostState;initialFingerprint:string;steps:ReplayStep[];finalFingerprint:string}
export function createPrivateReplay(initial:HostState):HostReplay {assertMatchState(initial.state.match);const fingerprint=hostFingerprint(initial);return {contract:'stone-throw-private-replay-v1',rulesVersion:initial.config.rulesVersion,initial:structuredClone(initial),initialFingerprint:fingerprint,steps:[],finalFingerprint:fingerprint};}
function apply(host:HostState,action:ReplayAction):HostState {if(action.kind==='policy-step')return autoStep(host);if(action.kind==='command')return acceptCommand(host,action.command);throw Error('Unknown replay action');}
/** Records policy entry separately, so its private RNG consumption is reproduced
 * rather than injected through an unvalidated command-side entropy gap. */
export function recordReplayStep(replay:HostReplay,host:HostState,action:ReplayAction):HostState {if(hostFingerprint(host)!==replay.finalFingerprint)throw Error('Replay append diverged before step '+(replay.steps.length+1));const next=apply(host,action);assertMatchState(next.state.match);const fingerprint=hostFingerprint(next);replay.steps.push({action:structuredClone(action),accepted:next.history.slice(host.history.length).map(r=>structuredClone(r.command)),rngBefore:host.rng.cursor,rngAfter:next.rng.cursor,fingerprint});replay.finalFingerprint=fingerprint;return next;}
export function replayPrivate(record:HostReplay):HostState {if(record.contract!=='stone-throw-private-replay-v1'||record.rulesVersion!=='stone-throw-v1.427'||record.initial.config.rulesVersion!==record.rulesVersion)throw Error('Unsupported replay version');let host=structuredClone(record.initial);assertMatchState(host.state.match);if(hostFingerprint(host)!==record.initialFingerprint)throw Error('Replay initial state diverged');for(const [index,step]of record.steps.entries()){const prefix='Replay divergence at step '+(index+1)+': ';if(host.rng.cursor!==step.rngBefore)throw Error(prefix+'RNG before');let next:HostState;try{next=apply(host,step.action);}catch(error){throw Error(prefix+String(error));}if(next.rng.cursor!==step.rngAfter)throw Error(prefix+'RNG after');if(stableJson(next.history.slice(host.history.length).map(r=>r.command))!==stableJson(step.accepted))throw Error(prefix+'accepted command');if(hostFingerprint(next)!==step.fingerprint)throw Error(prefix+'state/event/RNG fingerprint');assertMatchState(next.state.match);host=next;}if(hostFingerprint(host)!==record.finalFingerprint)throw Error('Replay final fingerprint diverged');return host;}
