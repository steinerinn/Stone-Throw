/** DOM-free Stage 6 contracts. No combat rules are implemented here. */
export type Id<K extends string> = string & {readonly __id: K};
export type MatchId=Id<'match'>; export type PlayerId=Id<'player'>;
export type BoardId=Id<'board'>; export type UnitId=Id<'unit'>;
export type EventId=Id<'event'>; export type EffectId=Id<'effect'>;
export type DecisionId=Id<'decision'>; export type ContactId=Id<'contact'>;
export function id<K extends string>(value:string):Id<K>{
  if(!/^[A-Za-z][A-Za-z0-9_-]{0,95}$/.test(value)||['__proto__','constructor','prototype'].includes(value))throw Error('Invalid identifier');
  return value as Id<K>;
}
export interface Cell {x:number;y:number}
export type UnitType='inf'|'cav'|'archer'|'monk'|'castle'|'dwarf'|'goblin'|'catapult'|'elf'|'cleric'|'demon'|'dragon'|'wizard'|'necro'|'hero';
export interface Player {id:PlayerId;boardIds:BoardId[]}
export interface Board {id:BoardId;ownerId:PlayerId;width:number;height:number}
export interface MatchConfiguration {
 readonly rulesVersion:string;
 readonly playerOrder:readonly PlayerId[];
 readonly boards:readonly Readonly<Board>[];
 readonly initialRosters:Readonly<Record<string,Readonly<Partial<Record<UnitType,number>>>>>;
 readonly format:'legacy-1v1'|'unspecified-n-player'|'active-ring-v1';
}
export interface HeroState {activated:boolean;hitsTaken:number;originalCell:Cell|null;currentCell:Cell|null;relocationPending:boolean}
export interface Unit {
 id:UnitId;ownerId:PlayerId;boardId:BoardId;type:UnitType|null;
 cells:Cell[];lifecycle:'unplaced'|'present'|'destroyed'|'unresolved';
 damage:{cells:Cell[];hitsTaken:number|null};
 hero:HeroState|null;abilities:{kind:UnitType;spent:boolean}[];
 resurrectionCount:number|null;
}
export type Phase='placement'|'ready'|'action'|'resolving'|'decision'|'finished'|'unresolved';
export interface Turn {phase:Phase;activePlayerId:PlayerId|null;round:number;turnIndex:number|null;roundStarterId:PlayerId|null;budgets:{playerId:PlayerId;remaining:number|null;next:number|null}[]}
export type EffectKind='archer'|'monk'|'dwarf'|'catapult'|'elf'|'cleric'|'wizard'|'dragon'|'demon'|'goblin'|'plague'|'hero-relocation'|'unresolved-chain';
export interface PendingEffect {id:EffectId;kind:EffectKind;actorId:PlayerId|null;ownerId:PlayerId;targetId:PlayerId|null;boardId:BoardId|null;origin:Cell|null;cells:Cell[];remaining:number|null;due:'same-turn'|'next-turn'|'queued-chain'|'unresolved';status:'queued'|'active'|'unresolved'}
export type DecisionKind='catapult-target'|'scout'|'resurrection'|'hero-relocation'|'hero-confirmation';
export interface PendingDecision {id:DecisionId;kind:DecisionKind;actorId:PlayerId;boardId:BoardId;unitId:UnitId|null;candidates:Cell[];unitChoices:UnitId[];remaining:number|null;candidateCoverage:'complete'|'unavailable'}
export interface PlagueState {ownerId:PlayerId|null;targetId:PlayerId;boardId:BoardId;moveOnPlayerId:PlayerId|null;origin:Cell|null;outbreaks:{ordinal:number;round:number;origin:Cell|null;frontier:Cell[];infected:Cell[]}[];killedCells:Cell[]}
export interface ResurrectionState {ownerId:PlayerId;boardId:BoardId;pending:boolean;searchActive:boolean;actualUnitId:UnitId|null;suspects:Cell[];eligibleUnitIds:UnitId[]}
export type Outcome={kind:'undetermined'}|{kind:'ongoing'}|{kind:'draw'}|{kind:'win';winnerIds:PlayerId[];eliminatedIds:PlayerId[]};
export type RngState={kind:'unavailable'}|{kind:'lcg32';seed:number;state:number;draws:number};
export interface HistoricalEvent {id:EventId;kind:'impact'|'damage-restored'|'relocation'|'unit-observed';actorId:PlayerId|null;targetId:PlayerId;boardId:BoardId;unitId:UnitId|null;cell:Cell;turnIndex:number|null}
export interface KnownCell {cell:Cell;observation:'miss'|'impact'|'occupied'|'empty'|'uncertain';unitType:UnitType|null;contactId:ContactId|null}
/** Contact IDs belong to one observer/board namespace. Never alias authoritative UnitId. */
export interface KnownContact {id:ContactId;unitType:UnitType|null;cells:Cell[];completeGeometry:boolean}
export interface Clue {kind:'monk-candidates'|'resurrection-search'|'hero-search'|'elf-scout';cells:Cell[]}
export interface BoardKnowledge {boardId:BoardId;cells:KnownCell[];contacts:KnownContact[];clues:Clue[]}
/** Public event payloads contain no raw text, server event ID, or private unit reference. */
export interface VisibleEvent {sequence:number;kind:'impact'|'miss'|'unit-disclosed'|'resurrection-announced'|'hero-moved'|'plague-observed';boardId:BoardId;cell:Cell|null;unitType:UnitType|null;contactId:ContactId|null}
export interface VisibleStat {kind:'shots'|'observed-hits';playerId:PlayerId;value:number}
export interface VisibleDecision {sequence:number;kind:DecisionKind;boardId:BoardId;candidates:Cell[];remaining:number|null}
export interface ObserverKnowledge {boards:Record<string,BoardKnowledge>;events:VisibleEvent[];stats:VisibleStat[];decisions:VisibleDecision[];turn:{phase:Phase;activePlayerId:PlayerId|null;round:number}|null;outcome:Outcome|null}
/** Full authoritative-style data: not a client response and not the runtime executor yet. */
export interface MatchState {
 contract:'match-state-v1';matchId:MatchId;config:MatchConfiguration;
 players:Player[];boards:Board[];units:Unit[];turn:Turn;
 effects:PendingEffect[];decisions:PendingDecision[];plagues:PlagueState[];resurrections:ResurrectionState[];
 history:HistoricalEvent[];outcome:Outcome;rng:RngState;
 plagueExclusions:{boardId:BoardId;cells:Cell[]}[];
 knowledge:Record<string,ObserverKnowledge>;
 privateAi:{playerId:PlayerId;boardId:BoardId;knownHits:Cell[];scouted:{cell:Cell;unitType:UnitType|null}[];heroCandidates:Cell[]}[];
}
/** Distinct public contract; there is no field for full units, RNG, AI or private history. */
export interface ObserverSnapshot {
 contract:'observer-snapshot-v1';matchId:MatchId;rulesVersion:string;observerId:PlayerId;
 players:Player[];boards:Board[];ownedUnits:Unit[];
 knowledge:Record<string,BoardKnowledge>;events:VisibleEvent[];stats:VisibleStat[];decisions:VisibleDecision[];
 turn:ObserverKnowledge['turn'];outcome:Outcome|null;
}
