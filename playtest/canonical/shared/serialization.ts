import type {MatchState,MatchConfiguration} from './model.js';
import {assertMatchState} from './invariants.js';
export function freezeConfiguration<T extends MatchConfiguration>(config:T):T{
 const walk=(v:unknown):void=>{if(v&&typeof v==='object'){Object.values(v).forEach(walk);Object.freeze(v);}};walk(config);return config;
}
/** Stable key ordering for fingerprints; this is not a gameplay RNG or event order. */
export function stableJson(v:unknown):string{
 if(v===null||typeof v!=='object')return JSON.stringify(v);
 if(Array.isArray(v))return '['+v.map(stableJson).join(',')+']';
 return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stableJson((v as Record<string,unknown>)[k])).join(',')+'}';
}
export function serializeMatch(state:MatchState):string{assertMatchState(state);return stableJson(state);}
export function deserializeMatch(text:string):MatchState{
 if(text.length>16*1024*1024)throw Error('Snapshot too large');const value:unknown=JSON.parse(text);assertMatchState(value);freezeConfiguration(value.config);return value;
}
