import type {DemonRuneBatch} from './demon-entropy.js';
import type {HostState} from '../host/contracts.js';import {createNormalPolicy} from './normal-legacy.js';import {cellKey,parseKey} from '../combat/access.js';import {neighbors4,neighbors8,cavCellsAt} from '../rules/index.js';import {random} from '../combat/rng.js';
export interface NormalMemory {gaveUp?:true;resultMessage?:string;demonRunes?:DemonRuneBatch[];knownHits:string[];castleHits:string[];scoutKnowledge:[string,string][];heroHunt:string[];eventCursor:number;scoutQueue:string[]}
export const emptyNormalMemory=():NormalMemory=>({knownHits:[],castleHits:[],scoutKnowledge:[],heroHunt:[],eventCursor:0,scoutQueue:[]});
/** Private normal-browser policy; not the Stage 9 Auto Match policy. */
export function normalPolicy(h:HostState,memory:NormalMemory){
 const human=h.state.seats[0]!,enemy=h.state.seats[1]!,own=h.state.match.units.filter(u=>u.ownerId===human.playerId),shots=new Set(human.shots),hero=own.find(u=>u.type==='hero'),monk=own.find(u=>u.type==='monk'),cfg=h.config.players[0]!.roster;
 const at=(k:string)=>own.find(u=>u.cells.some(c=>cellKey(c)===k)),dead=(u:typeof own[number])=>u.cells.every(c=>shots.has(cellKey(c))),count=(type:string)=>own.filter(u=>u.type===type&&dead(u)).length;
 const cavs=new Map(own.filter(u=>u.type==='cav').map(u=>[u.id,{x:u.cells[0]!.x,y:u.cells[0]!.y,orient:u.cells[0]!.y===u.cells[1]!.y?'H':'V',cells:u.cells.map(cellKey)}])),cellToCav=new Map([...cavs].flatMap(([id,u])=>u.cells.map(k=>[k,id] as const)));
 const castleAt=(k:string)=>{const u=at(k);return u?.type==='castle'?{id:u.id,cells:new Set(u.cells.map(cellKey))}:null;},scout=new Map(memory.scoutKnowledge),picked:string[]=[];
 // Group-only authorized exception: a protected multi-cell target is eligible only
 // when it belongs to the final surviving core and no activated Hero survives.
 const survivingCore=own.filter(u=>['inf','cav','archer','monk','castle'].includes(u.type||'')&&!dead(u));
 const groupPlagueFinalCoreCell=h.state.ring?(k:string)=>survivingCore.length===1&&!(hero?.hero?.activated&&hero.hero.currentCell&&hero.hero.hitsTaken<3)&&survivingCore[0]!.cells.some(c=>cellKey(c)===k):undefined;
 // Hero movement breaks placement spacing, including at historical hit locations.
 const heroSpacingExemptCells=new Set(hero?.cells.map(cellKey)||[]);
 if(hero)for(const {event:e} of h.events)if(e.unitId===hero.id)for(const c of e.cells)heroSpacingExemptCells.add(cellKey(c));
 if(hero?.hero?.currentCell)heroSpacingExemptCells.add(cellKey(hero.hero.currentCell));
 const env={heroOnlyCore:survivingCore.length===0,heroSpacingExemptCells,groupPlagueFinalCoreCell,SIZE:h.config.size,PLAGUE_ROUNDS:5,INF_COUNT:cfg.inf||0,ARCHER_COUNT:cfg.archer||0,CAV_COUNT:cfg.cav||0,CASTLE_COUNT:cfg.castle||0,key:(x:number,y:number)=>x+','+y,parseKey,
 neighbors4:(x:number,y:number)=>neighbors4({size:h.config.size},x,y),neighbors8:(x:number,y:number)=>neighbors8({size:h.config.size},x,y),cavCellsAt:(x:number,y:number,orient:'H'|'V')=>cavCellsAt(x,y,orient),cavMap:cavs,cellToCav,
 enemyKnownHits:new Set(memory.knownHits),enemyCastleKnownHits:new Set(memory.castleHits),enemyScoutKnowledge:scout,enemyScoutedPlayerCells:new Set(enemy.scouted),enemyHeroHuntCandidates:new Set(memory.heroHunt),enemyMonkSearchCandidates:new Set(enemy.monkCandidates),enemyShots:shots,
 heroActivated:!!hero?.hero?.activated,heroKey:hero?.hero?.currentCell?cellKey(hero.hero.currentCell):null,playerHeroHitsTaken:hero?.hero?.hitsTaken||0,monkKey:monk?.cells[0]?cellKey(monk.cells[0]):null,
 playerResurrectionSearchActive:human.resurrection.searchActive,playerResurrectionSuspectUnits:human.resurrection.suspects.map(id=>({cells:h.state.match.units.find(u=>u.id===id)!.cells.map(cellKey)})),playerResurrectionSuspects:new Set(human.resurrection.suspects.flatMap(id=>h.state.match.units.find(u=>u.id===id)!.cells.map(cellKey))),
 playerPlaguePending:(()=>{const outbreaks=h.state.plagues.filter(p=>p.targetPlayerId===human.playerId).flatMap(p=>p.outbreaks);return outbreaks.length?{outbreaks:outbreaks.map(o=>({round:o.round,origin:o.origin?cellKey(o.origin):undefined,infected:new Set(o.infected)}))}:null;})(),
 sideCastleByCell:(_side:string,k:string)=>castleAt(k),castleDestroyed:(_side:string,c:{cells:Set<string>})=>[...c.cells].every(k=>shots.has(k)),alreadyShotOnSide:(_side:string,k:string)=>shots.has(k),
 playerInfHits:()=>count('inf'),playerArcherHitCount:()=>count('archer'),playerCavDestroyedCount:()=>count('cav'),playerCastleDestroyedCount:()=>count('castle'),
 enemyRequiredUnitsRemaining:()=>own.filter(u=>['inf','cav','archer','monk','castle'].includes(u.type||'')&&!dead(u)).length+(hero?.hero?.activated&&hero.hero.currentCell&&hero.hero.hitsTaken<3?1:0),
 sideUnitAt:(_side:string,k:string)=>{const t=at(k)?.type;return t==='cav'?'cavalry':t==='inf'?'infantry':t||null;},revealPlayerScoutCellForEnemy:(k:string)=>picked.push(k),eventName:(kind:string)=>kind,damageSummary:(items:string[])=>items.join(', '),addBattleEvent:(_text:string)=>{},x:undefined,y:undefined};
 const legacy=createNormalPolicy(env,()=>random(h.rng,'normal-browser-policy'));
 // Only known Assassin cells are excluded, and only from deliberate ordinary targeting.
 const avoided=new Set([...scout].filter(([k,type])=>type==='special'&&at(k)?.type==='assassin').map(([k])=>k));
 const targeting=avoided.size?createNormalPolicy({...env,enemyShots:new Set([...shots,...avoided]),alreadyShotOnSide:(_side:string,k:string)=>shots.has(k)||avoided.has(k)},()=>random(h.rng,'normal-browser-policy')):legacy;
 return {plagueDiagnostic:(selected:string|null)=>({selected,protectedCells:[...legacy.protectedCells()],finalCoreException:!!selected&&!!groupPlagueFinalCoreCell?.(selected),remainingCore:survivingCore.length,activatedHeroSurvives:!!(hero?.hero?.activated&&hero.hero.currentCell&&hero.hero.hitsTaken<3)}),target:(plagueAware:boolean):string|null=>plagueAware?targeting.plagueTarget():targeting.target(),catapult:(avoid:string[],origins:string[]):string|null=>(legacy.catapult as unknown as (a:string[],b:string[])=>string|null)(avoid,origins),roll:(cells:string[],protect=false):string|null=>legacy.catapultRoll(cells,protect?legacy.protectedCells():new Set()),scout:(count:number):string[]=>{legacy.scout(count);return picked;}};
}

