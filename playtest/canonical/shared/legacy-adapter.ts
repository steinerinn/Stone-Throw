import {id} from './model.js';
import type {PlayerId,BoardId,MatchId,MatchState,Unit,UnitId,HistoricalEvent,MatchConfiguration,BoardKnowledge,ObserverKnowledge,EffectId,DecisionId,EventId} from './model.js';
import type {LegacyFrame,LegacySide} from './legacy-types.js';
import {cellKey,assertMatchState} from './invariants.js';import {freezeConfiguration,stableJson,serializeMatch,deserializeMatch} from './serialization.js';
export interface LegacyMapping {matchId:MatchId;players:Record<LegacySide,PlayerId>;boards:Record<LegacySide,BoardId>}
export interface ShadowResult {state:MatchState;coverage:{history:'sampled-deltas-only';rng:'unavailable';visibility:'conservative-under-disclosure';identity:'stable-within-epoch-legacy-tokens';unavailable:string[]}}
/** Offline session; never installed in either browser build. Each setup/restart needs a new session. */
export class LegacyShadowSession {
 private mapping:LegacyMapping;private previous:MatchState|null=null;private epoch:number|null=null;
 private config:MatchConfiguration|null=null;private registry=new Map<string,UnitId>();private counts:Record<LegacySide,number>={player:0,enemy:0};
 constructor(mapping:LegacyMapping){this.mapping=structuredClone(mapping);if(mapping.players.player===mapping.players.enemy||mapping.boards.player===mapping.boards.enemy)throw Error('Distinct legacy mappings required');}
 snapshot(raw:LegacyFrame):ShadowResult{
  if(this.epoch!==null&&this.epoch!==raw.epoch)throw Error('Legacy epoch changed; start a new shadow match');this.epoch=raw.epoch;
  const order:LegacySide[]=['player','enemy'],m=this.mapping;
  const config:MatchConfiguration={rulesVersion:'stone-throw-v1.427',format:'legacy-1v1',playerOrder:order.map(x=>m.players[x]),boards:order.map(x=>({id:m.boards[x],ownerId:m.players[x],width:raw.size,height:raw.size})),initialRosters:Object.fromEntries(order.map(x=>[m.players[x],structuredClone(raw.rosters[x])]))};
  if(this.config&&stableJson(this.config)!==stableJson(config))throw Error('Match configuration changed; start a new shadow match');
  this.config??=freezeConfiguration(config);
  const ref=(side:LegacySide,token:string):UnitId=>{const k=side+':'+token;let v=this.registry.get(k);if(!v){v=id<'unit'>('unit-'+(side==='player'?'a':'b')+'-'+(++this.counts[side]));this.registry.set(k,v);}return v;};
  const find=(side:LegacySide,token:string|null):UnitId|null=>token===null?null:this.registry.get(side+':'+token)??null;
  const units:Unit[]=[];
  for(const side of order){const frame=raw.sides[side],shots=new Set(frame.shotsAgainst.map(cellKey));for(const u of frame.units){const uid=ref(side,u.token),damage=u.cells.filter(c=>shots.has(cellKey(c))),hero=u.hero?structuredClone(u.hero):null;
    units.push({id:uid,ownerId:m.players[side],boardId:m.boards[side],type:u.type,cells:structuredClone(u.cells),lifecycle:hero?(hero.currentCell===null?(hero.activated||hero.originalCell!==null&&raw.phase!=='placement'?'destroyed':hero.originalCell!==null?'unresolved':'unplaced'):'present'):(u.cells.length===0?'unplaced':damage.length===u.cells.length?'destroyed':'present'),damage:{cells:structuredClone(damage),hitsTaken:hero?.hitsTaken??null},hero,abilities:[...(u.archerSpent===null?[]:[{kind:'archer' as const,spent:u.archerSpent}]),...(u.monkSpent===null?[]:[{kind:'monk' as const,spent:u.monkSpent}])],resurrectionCount:null});
  }}
  // Loss of a legacy placement token is not proof of destruction or a new identity.
  for(const old of this.previous?.units??[])if(!units.some(u=>u.id===old.id))units.push({...structuredClone(old),cells:[],damage:{cells:[],hitsTaken:old.damage.hitsTaken},hero:old.hero?{...structuredClone(old.hero),currentCell:null}:null,lifecycle:'unresolved'});
  const knowledge:Record<string,ObserverKnowledge>={};
  // Explicit legacy mapping is confined here; the shared model has no binary-side operations.
  const observedPairs:[LegacySide,LegacySide][]=[['player','enemy'],['enemy','player']];
  for(const [observer,target]of observedPairs){const f=raw.sides[target],suspects=new Set(f.resurrection.searchActive?f.resurrection.suspects.map(cellKey):[]),bk:BoardKnowledge={boardId:m.boards[target],cells:[],contacts:[],clues:[]};
   // Shot membership is not current unit identity. During resurrection, mask the entire
   // search set; publishing the one removed shot would reveal the revived unit.
   const seen=new Set<string>();for(const c of [...f.shotsAgainst,...f.scoutedByOther,...(f.resurrection.searchActive?f.resurrection.suspects:[])]){const key=cellKey(c);if(seen.has(key))continue;seen.add(key);bk.cells.push({cell:{...c},observation:suspects.has(key)||f.scoutedByOther.some(x=>cellKey(x)===key)?'uncertain':'impact',unitType:null,contactId:null});}
   bk.cells.sort((a,b)=>a.cell.y-b.cell.y||a.cell.x-b.cell.x);
   if(f.monkCluesForOther.length)bk.clues.push({kind:'monk-candidates',cells:structuredClone(f.monkCluesForOther)});
   if(f.scoutedByOther.length)bk.clues.push({kind:'elf-scout',cells:structuredClone(f.scoutedByOther)});
   if(f.resurrection.searchActive)bk.clues.push({kind:'resurrection-search',cells:structuredClone(f.resurrection.suspects)});
   knowledge[m.players[observer]]={boards:{[m.players[target]]:bk},events:[],stats:[],decisions:raw.decisions.filter(d=>d.actor===observer).map((d,i)=>({sequence:i+1,kind:d.kind,boardId:m.boards[d.boardOwner],candidates:structuredClone(d.candidates),remaining:d.remaining})),turn:{phase:raw.phase,activePlayerId:raw.active?m.players[raw.active]:null,round:raw.round},outcome:null};
  }
  const history:HistoricalEvent[]=structuredClone(this.previous?.history??[]);
  const record=(kind:HistoricalEvent['kind'],unit:Unit,cell:import('./model.js').Cell)=>history.push({id:id<'event'>('history-'+(history.length+1)),kind,actorId:null,targetId:unit.ownerId,boardId:unit.boardId,unitId:unit.id,cell:{...cell},turnIndex:null});
  if(this.previous)for(const u of units){const old=this.previous.units.find(x=>x.id===u.id);if(!old)continue;const before=new Set(old.damage.cells.map(cellKey)),after=new Set(u.damage.cells.map(cellKey));for(const c of u.damage.cells)if(!before.has(cellKey(c)))record('impact',u,c);for(const c of old.damage.cells)if(!after.has(cellKey(c)))record('damage-restored',u,c);if(u.hero?.currentCell&&old.hero?.currentCell&&cellKey(u.hero.currentCell)!==cellKey(old.hero.currentCell))record('relocation',u,u.hero.currentCell);}
  const effects=raw.effects.map((e,i)=>({id:id<'effect'>('effect-'+(i+1)),kind:e.kind,actorId:null,ownerId:m.players[e.owner],targetId:e.target?m.players[e.target]:null,boardId:e.target?m.boards[e.target]:null,origin:e.target&&e.origin?{...e.origin}:null,cells:[],remaining:e.remaining,due:e.due,status:'unresolved' as const}));
  const state:MatchState={contract:'match-state-v1',matchId:m.matchId,config:structuredClone(this.config),players:order.map(x=>({id:m.players[x],boardIds:[m.boards[x]]})),boards:structuredClone(config.boards) as MatchState['boards'],units,
   turn:{phase:raw.phase,activePlayerId:raw.active?m.players[raw.active]:null,round:raw.round,turnIndex:null,roundStarterId:raw.roundStarter?m.players[raw.roundStarter]:null,budgets:order.map(x=>({playerId:m.players[x],...raw.budgets[x]}))},effects,
   decisions:raw.decisions.map((d,i)=>({id:id<'decision'>('decision-'+(i+1)),kind:d.kind,actorId:m.players[d.actor],boardId:m.boards[d.boardOwner],unitId:find(d.actor,d.unitToken),candidates:structuredClone(d.candidates),unitChoices:d.eligibleTokens.map(t=>find(d.actor,t)).filter((x):x is UnitId=>x!==null),remaining:d.remaining,candidateCoverage:d.complete?'complete':'unavailable'})),
   plagues:order.flatMap(target=>{const p=raw.sides[target].plague;return p?[{ownerId:null,targetId:m.players[target],boardId:m.boards[target],moveOnPlayerId:m.players[p.moveOn],origin:p.origin?{...p.origin}:null,outbreaks:structuredClone(p.outbreaks),killedCells:structuredClone(raw.sides[target].plagueKilled)}]:[];}),
   resurrections:order.map(x=>({ownerId:m.players[x],boardId:m.boards[x],pending:raw.sides[x].resurrection.pending,searchActive:raw.sides[x].resurrection.searchActive,actualUnitId:find(x,raw.sides[x].resurrection.actualToken),suspects:structuredClone(raw.sides[x].resurrection.suspects),eligibleUnitIds:raw.sides[x].resurrection.eligibleTokens.map(t=>find(x,t)).filter((u):u is UnitId=>u!==null)})),
   plagueExclusions:order.map(x=>({boardId:m.boards[x],cells:structuredClone(raw.sides[x].plagueKilled)})),history,outcome:raw.outcome==='player'||raw.outcome==='enemy'?{kind:'win',winnerIds:[m.players[raw.outcome]],eliminatedIds:[]}:{kind:raw.outcome},rng:{kind:'unavailable'},knowledge,
   privateAi:observedPairs.map(([observer,target])=>({playerId:m.players[observer],boardId:m.boards[target],knownHits:structuredClone(raw.sides[observer].privateAi.knownHits),heroCandidates:structuredClone(raw.sides[observer].privateAi.heroCandidates),scouted:[]}))};
  assertMatchState(state);freezeConfiguration(state.config);this.previous=deserializeMatch(serializeMatch(state));
  return {state,coverage:{history:'sampled-deltas-only',rng:'unavailable',visibility:'conservative-under-disclosure',identity:'stable-within-epoch-legacy-tokens',unavailable:['Enemy shot budget is a local variable during enemyTurn.','No complete event chronology before/between captures; deltas are observations, not combat order.','Native Math.random state is not recoverable.','Legacy placement moves without persistent IDs need transaction tracking in later stages.','Raw Event Log HTML, strength statistics and DOM-derived type disclosure are intentionally not projected.','No pending callback, timer, effect continuation or N-player targeting rule is inferred.']}};
 }
}
