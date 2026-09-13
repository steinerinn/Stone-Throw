import type {ResolutionContext,SourceMetadata} from './contracts.js';import {work} from './scheduling.js';
/** Future work is carried by the root journal. Activation by the legacy turn
 * driver remains a separate action; this must not be drained as same-turn work. */
export function futureBenefit(ctx:ResolutionContext,meta:SourceMetadata,benefit:'dwarf'|'catapult'|'scout'|'resurrection'|'ordinary-shots',amount:number){ctx.future.push(work(ctx,{kind:'scheduled-benefit',ownerId:meta.targetPlayerId,benefit,amount,meta:{...meta},accounting:'already-applied-to-compatibility-counters'},'future-turn'));}
