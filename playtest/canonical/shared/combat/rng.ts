import {mutableRows} from '../archives.js';
import type {ExplicitRng} from './contracts.js';
export function createRuleRng(seed=1427,tape:readonly number[]=[]):ExplicitRng {
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid RNG seed');
 if(tape.some(x=>!Number.isFinite(x)||x<0||x>=1))throw Error('Invalid RNG tape');
 return {algorithm:'lcg32-with-tape',seed,state:seed,cursor:0,tape:[...tape],draws:[]};
}
export function random(rng:ExplicitRng,purpose:string):number {
 rng.state=(Math.imul(1664525,rng.state)+1013904223)>>>0;
 const value=rng.cursor<rng.tape.length?rng.tape[rng.cursor]!:rng.state/4294967296;
 (rng.draws=mutableRows(rng.draws)).push({ordinal:rng.cursor,purpose,value});rng.cursor++;return value;
}
/** Golden Fisher–Yates order; no draw for empty/singleton pools. */
export function shuffle<T>(values:T[],rng:ExplicitRng,purpose:string):void {
 for(let i=values.length-1;i>0;i--){const j=Math.floor(random(rng,purpose)*(i+1));[values[i],values[j]]=[values[j]!,values[i]!];}
}
