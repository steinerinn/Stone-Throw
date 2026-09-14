import type {ExplicitRng} from '../contracts.js';import {shuffle} from '../rng.js';
export function goblinTargets(available:readonly string[],rng:ExplicitRng):string[]{const candidates=[...available],count=Math.min(candidates.length,Math.max(5,Math.ceil(candidates.length*0.044)));shuffle(candidates,rng,'goblin-shuffle');return candidates.slice(0,count);}
