import type {HostState} from '../host/contracts.js';
import type {InternalRuleEvent} from '../combat/contracts.js';
import type {Side,Cell} from '../client-contract/public.js';
export interface AnimationCue {targetSeat?:number;level?:number;pulseId?:string;ownerPlayerId?:string;kind:'revolt'|'double-plague'|'enemy-shot'|'catapult'|'wizard'|'archer'|'goblin'|'demon'|'dragon'|'assassin';side:Side;ownerSide:Side;origin:Cell;cell:Cell;group:number;step?:number}
/** Only resolved, publicly observable impact sites and the public reaction origin.
 * No planned random targets, private unit IDs or hidden geometry leave this adapter. */
export function animationCue(h:HostState,events:InternalRuleEvent[],groups:Map<string,number>):AnimationCue|undefined{
 // A false resurrection candidate is still a visible Dragon path step; omitting its
 // cue splits the flight and makes the remaining diagonal replay from the origin.
 const e=events.find(e=>(e.kind==='impact'||e.kind==='suspect-eliminated'&&e.meta?.source==='dragon')&&e.meta&&(e.meta.source==='revolt'||e.statistics?.doublePlague||['direct-human','direct-ai','catapult-shot','wizard','archer','goblin','demon-blast','dragon','assassin'].includes(e.meta.source)));if(!e?.meta||!e.cells[0])return;
 const m=e.meta,own=h.config.players.findIndex(p=>p.id===m.ownerId),target=h.config.players.findIndex(p=>p.id===m.targetPlayerId);if(m.source==='revolt'){const key=e.rootId+':revolt';if(!groups.has(key))groups.set(key,Math.max(0,...groups.values())+1);return {kind:'revolt',side:target===0?'self':'opponent',ownerSide:'self',origin:{...e.cells[0]},cell:{...e.cells[0]},group:groups.get(key)!,level:Number(e.statistics?.revoltLevel),pulseId:e.rootId,targetSeat:target};}if(own<0||target<0||own>1||target>1||m.source==='assassin'&&own===target)return;
 if(m.source.startsWith('direct-')&&(own!==1||target!==0))return;
 const kind=(e.statistics?.doublePlague?'double-plague':m.source.startsWith('direct-')?'enemy-shot':m.source==='catapult-shot'?'catapult':m.source==='demon-blast'?'demon':m.source) as AnimationCue['kind'];
 const frame=h.pendingRoot?.frames.find(f=>f.id===e.workId),op=frame?.current[Math.max(0,frame.cursor-1)]?.operation;
 const step=op&&(op.kind==='catapult'||op.kind==='catapult-resume')?op.impact:undefined;
 const key=e.rootId+':'+e.workId+':'+m.source;if(step===0||!groups.has(key))groups.set(key,Math.max(0,...groups.values())+1);
 return {kind,...(kind==='double-plague'?{ownerPlayerId:String((e.statistics?.plague as {owner:string})?.owner||m.ownerId)}:{}),side:target===0?'self':'opponent',ownerSide:own===0?'self':'opponent',origin:{...(m.origin||e.cells[0])},cell:{...e.cells[0]},group:groups.get(key)!,...(step!==undefined?{step}:{})};
}

/** Attach only the public cause of an already-visible impact; never identity/geometry/RNG. */
export function impactSources(events:import('../client-contract/public.js').PublicEvent[],delta:InternalRuleEvent[],selfBoard:string,opponentBoard:string){
 const sources:Record<string,import('../client-contract/public.js').PublicEvent['source']>={'direct-human':'direct','direct-ai':'direct',archer:'archer','catapult-shot':'catapult',goblin:'goblin',wizard:'wizard',dragon:'dragon','demon-blast':'demon',plague:'plague','monk-deflect':'monk',assassin:'assassin',revolt:'revolt'};
 return events.map(e=>{if(!e.cell||!['impact','miss'].includes(e.kind))return e;const hit=delta.find(q=>q.kind==='impact'&&q.meta&&(q.statistics?.environmental||[selfBoard,opponentBoard].includes(q.meta.targetBoardId))&&(q.meta.targetBoardId===selfBoard?'self':'opponent')===e.side&&q.cells.some(c=>c.x===e.cell!.x&&c.y===e.cell!.y));const source=hit?.meta&&sources[hit.meta.source];return source?{...e,source,...(hit?.statistics?.environmental?{environmental:true,...(![selfBoard,opponentBoard].includes(hit.meta!.targetBoardId)?{offscreen:true}:{}),revoltLevel:Number(hit.statistics.revoltLevel)}:{})}:e;});
}
