import type {Id,MatchState,PlayerId,BoardId,UnitId,UnitType,Cell} from '../model.js';
export type ResolutionId=Id<'resolution'>;
export type WorkId=Id<'rule-work'>;
export type RuleDecisionId=Id<'rule-decision'>;
export type RuleSource='direct-human'|'direct-ai'|'chain'|'archer'|'monk-deflect'|'catapult-shot'|'goblin'|'dragon'|'demon-blast'|'wizard'|'plague';
export type Timing='immediate-interrupt'|'attack-remainder'|'after-attack'|'next-wave'|'same-turn'|'turn-boundary'|'future-turn';
export interface SourceMetadata {actorId:PlayerId;ownerId:PlayerId;targetPlayerId:PlayerId;targetBoardId:BoardId;sourceUnitId:UnitId|null;source:RuleSource;origin:Cell|null}
export interface ExplicitRng {algorithm:'lcg32-with-tape';seed:number;state:number;cursor:number;tape:number[];draws:{ordinal:number;purpose:string;value:number}[]}
/** Compatibility state unavailable from the Stage 6 observation alone. It must be
 * supplied by a trusted adapter. No inference from observer knowledge is allowed. */
export interface CombatSeat {
 playerId:PlayerId;boardId:BoardId;
 reactionTarget:{playerId:PlayerId;boardId:BoardId};
 decisionMode:'interactive'|'policy';
 sameTurnBonusTarget:'ordinary'|'chain';
 releasePriority:number;releaseRevivesPendingFirst:boolean;
 occupied:string[];shots:string[];scouted:string[];monkCandidates:string[];
 nextShots:number;ordinaryShots:number;currentChainBonus:number;
 dwarfNow:number;catapultNow:number;catapultLater:number;elfNow:boolean;spyLater:number;
 clericNow:boolean;clericLater:boolean;releaseNow:boolean;
 resurrection:{searchActive:boolean;actualUnitId:UnitId|null;suspects:UnitId[]};
 plagueExcluded:string[];
}
export interface HeroQueueEntry {unitId:UnitId;kind:'first'|'second'|'third'}
export interface Outbreak {statisticsId?:string;origin:Cell|null;round:number;frontier:string[];infected:string[]}
export interface CompatPlague {triggerPlayerId:PlayerId;ownerId:PlayerId;targetPlayerId:PlayerId;targetBoardId:BoardId;moveOnPlayerId:PlayerId;origin:Cell|null;outbreaks:Outbreak[];announced:boolean}
export interface CombatState {
 ring?:{order:PlayerId[];eliminated:PlayerId[];knowledge:Record<string,{scouted:string[];monkCandidates:string[]}>};match:MatchState;seats:CombatSeat[];heroQueue:HeroQueueEntry[];plagues:CompatPlague[];monkDuelActive:boolean;monkDuelHasHappened:boolean;storyMode:boolean;storyPlagueTargets:PlayerId[]}
export type Reaction='archer'|'monk-deflect'|'goblin'|'dragon'|'demon'|'wizard';
export interface ReactionEntry {kind:Reaction;meta:SourceMetadata}
export type Operation=
 |{kind:'impact';meta:SourceMetadata;cell:Cell;deferReactions:boolean}
 |{kind:'attack';entry:ReactionEntry}
 |{kind:'flush-reactions'}
 |{kind:'monk-continuation';meta:SourceMetadata}
 |{kind:'scheduled-benefit';ownerId:PlayerId;benefit:'dwarf'|'catapult'|'scout'|'resurrection'|'ordinary-shots';amount:number;meta:SourceMetadata;accounting:'already-applied-to-compatibility-counters'}
 |{kind:'direct-shot';meta:SourceMetadata;cell:Cell}
 |{kind:'host-direct-shot';meta:SourceMetadata;cell:Cell}
 |{kind:'turn-resurrection';ownerId:PlayerId}
 |{kind:'turn-scout';ownerId:PlayerId;count:number}
 |{kind:'direct-after';meta:SourceMetadata;cell:Cell}
 |{kind:'direct-finish';meta:SourceMetadata}
 |{kind:'wave';entries:ReactionEntry[];terminalCheck:boolean}
 |{kind:'hero-queue'}
 |{kind:'same-turn-effects'}
 |{kind:'catapult';meta:SourceMetadata;cell:Cell;impact:number;generated:ReactionEntry[]}
 |{kind:'catapult-resume';meta:SourceMetadata;impact:number;generated:ReactionEntry[];decisionId:RuleDecisionId}
 |{kind:'catapult-series';ownerId:PlayerId;remaining:number}
 |{kind:'plague-step';targetBoardId:BoardId;plagueId?:string}
 |{kind:'plague-progress';targetBoardId:BoardId;plagueId?:string;outbreakIndex:number;parentIndex:number;childIndex:number;wanted:number;oldFrontier:string[];nextFrontier:string[];reserved:string[];stage:'start'|'branch'|'child'|'finish'}
 |{kind:'terminal-check';reason:'chain-end'|'direct-end'|'catapult-sibling'|'plague-sibling'};
export interface RuleWork {id:WorkId;rootId:ResolutionId;parentId:WorkId|null;timing:Timing;operation:Operation}
export interface AttackFrame {detachedPlague:CompatPlague|null;compatibilityTurnId:PlayerId;id:WorkId;kind:'root'|'attack'|'wave'|'interrupt'|'catapult'|'plague';current:RuleWork[];next:ReactionEntry[];deferred:{unitId:UnitId;cell:Cell;meta:SourceMetadata}[];cursor:number;terminalCheck:boolean;stage:'body'|'finish'}
export interface PendingRuleDecision {id:RuleDecisionId;rootId:ResolutionId;workId:WorkId;actorId:PlayerId;boardId:BoardId;unitId:UnitId|null;kind:'hero-relocation'|'resurrection'|'catapult-target'|'catapult-roll'|'scout'|'policy-target';legalCells:Cell[];legalUnitIds:UnitId[];remaining:number;status:'pending'|'answered'|'cancelled';answer:{cell:Cell|null;unitId:UnitId|null}|null}
export type EventKind='attack-started'|'impact'|'repeat-ignored'|'unit-damaged'|'unit-destroyed'|'ability-spent'|'reaction-generated'|'benefit-scheduled'|'plague-held'|'plague-scheduled'|'plague-contained'|'hero-activated'|'hero-moved'|'hero-killed'|'resurrection'|'resurrection-discovered'|'suspect-eliminated'|'scouted'|'monk-clue'|'monk-duel'|'decision-required'|'decision-answered'|'decision-cancelled'|'work-started'|'work-finished'|'compatibility-truncation'|'outcome'|'resolution-completed';
/** Internal/private facts only. Public projection is deliberately a later adapter. */
export interface InternalRuleEvent {statistics?:Record<string,unknown>;sequence:number;rootId:ResolutionId;workId:WorkId|null;kind:EventKind;meta:SourceMetadata|null;unitId:UnitId|null;cells:Cell[];amount:number|null;reason:string|null}
export interface ResolutionContext {
 contract:'stone-throw-resolution-v1';scope:'accepted-action'|'boundary-comparison';id:ResolutionId;acceptedActionId:string;activePlayerId:PlayerId;
 compatibility:'golden-v1.427';status:'running'|'awaiting-decision'|'complete';
 state:CombatState;rng:ExplicitRng;frames:AttackFrame[];future:RuleWork[];decisions:PendingRuleDecision[];events:InternalRuleEvent[];generated:ReactionEntry[];
 externalEntropy:{beforeImpact:number;purpose:'legacy-visual'|'legacy-sound';values:number[]}[];
 nextWork:number;nextDecision:number;completedAtEvent:number|null;
}
export interface DecisionCommand {decisionId:RuleDecisionId;actorId:PlayerId;cell:Cell|null;unitId:UnitId|null}
