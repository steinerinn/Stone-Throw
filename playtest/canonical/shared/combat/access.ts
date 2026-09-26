import {statisticalFacts} from './statistical-facts.js';
import type {PlayerId,BoardId,UnitId,Cell,Unit} from '../model.js';
import type {CombatState,ResolutionContext,SourceMetadata,InternalRuleEvent,EventKind} from './contracts.js';
import {key,parseKey} from '../rules/coordinates.js';
export {key,parseKey};
export const cellKey=(cell:Cell)=>key(cell.x,cell.y);
export function seat(state:CombatState,id:PlayerId){const p=state.seats.find(p=>p.playerId===id);if(!p)throw Error('Unknown player');return p;}
export function boardSize(state:CombatState,id:BoardId){const b=state.match.boards.find(b=>b.id===id);if(!b||b.width!==b.height)throw Error('Unsupported board geometry');return b.width;}
export function unit(state:CombatState,id:UnitId){const u=state.match.units.find(u=>u.id===id);if(!u)throw Error('Unknown unit');return u;}
export function unitAt(state:CombatState,boardId:BoardId,k:string):Unit|null {if(!state.seats.find(p=>p.boardId===boardId)?.occupied.includes(k))return null;return state.match.units.find(u=>u.boardId===boardId&&u.cells.some(c=>cellKey(c)===k))||null;}
export function shot(state:CombatState,ownerId:PlayerId,k:string){return seat(state,ownerId).shots.includes(k);}
export function addUnique<T>(list:T[],v:T){if(!list.includes(v))list.push(v);}
export function emit(ctx:ResolutionContext,kind:EventKind,meta:SourceMetadata|null=null,unitId:UnitId|null=null,cells:Cell[]=[],amount:number|null=null,reason:string|null=null):InternalRuleEvent {
 const event:InternalRuleEvent={sequence:ctx.events.length+1,rootId:ctx.id,workId:ctx.frames.at(-1)?.id||null,kind,meta:meta&&ctx.environmental?{...meta,actorId:null,ownerId:null}:meta,unitId,cells:cells.map(c=>({...c})),amount,reason};if(['impact','suspect-eliminated','repeat-ignored','unit-destroyed','unit-damaged','hero-killed','resurrection','scouted','attack-started','plague-scheduled','work-started'].includes(kind))event.statistics=statisticalFacts(ctx,event);if(ctx.environmental)event.statistics={...event.statistics,environmental:'peasant-revolt',revoltLevel:ctx.environmental.level,rootActorId:null};ctx.events.push(event);return event;
}
export function destroyed(state:CombatState,u:Unit):boolean {return u.cells.length>0&&u.cells.every(c=>shot(state,u.ownerId,cellKey(c)));}
export function syncDamage(state:CombatState,u:Unit){u.damage.cells=u.cells.filter(c=>shot(state,u.ownerId,cellKey(c))).map(c=>({...c}));u.lifecycle=u.hero?(u.hero.currentCell?'present':'destroyed'):destroyed(state,u)?'destroyed':'present';}
export function reactionMeta(state:CombatState,u:Unit,source:SourceMetadata['source'],origin:Cell):SourceMetadata {const p=seat(state,u.ownerId);return {actorId:u.ownerId,ownerId:u.ownerId,targetPlayerId:p.reactionTarget.playerId,targetBoardId:p.reactionTarget.boardId,sourceUnitId:u.id,source,origin:{...origin}};}
/** Previously hit resurrection suspects are unknown again for attack selection. */
export function attackBlockedCells(state:CombatState,ownerId:PlayerId):Set<string>{const p=seat(state,ownerId),blocked=new Set(p.shots);if(p.resurrection.searchActive)for(const id of p.resurrection.suspects)for(const c of unit(state,id).cells)blocked.delete(cellKey(c));return blocked;}
export function available(state:CombatState,boardId:BoardId,ownerId:PlayerId):string[]{const n=boardSize(state,boardId),out:string[]=[],blocked=attackBlockedCells(state,ownerId);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const k=key(x,y);if(!blocked.has(k))out.push(k);}return out;}

/** Original Plague scheduling retains its triggering turn tag independently of its later mover. */
export function ruleTurn(ctx:ResolutionContext):PlayerId{return ctx.frames.at(-1)?.compatibilityTurnId||ctx.activePlayerId;}

/** Target-local clues: normal and reverse attacks can observe different boards. */
export function targetKnowledge(state:CombatState,owner:PlayerId,target:PlayerId){if(!state.ring)return seat(state,owner);return state.ring.knowledge[owner+':'+target]??={scouted:[],monkCandidates:[]};}
