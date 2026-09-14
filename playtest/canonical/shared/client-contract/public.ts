/** Public presentation protocol. No imports of canonical or private host types. */
export type Side='self'|'opponent';
export type UnitKind='inf'|'cav'|'archer'|'monk'|'castle'|'dwarf'|'goblin'|'catapult'|'elf'|'cleric'|'demon'|'dragon'|'wizard'|'necro'|'hero';
export interface Cell {x:number;y:number}
export interface OwnUnit {handle:string;kind:UnitKind;cells:Cell[];damaged:Cell[];destroyed:boolean;hero:{active:boolean;hits:number}|null;spent:boolean}
export interface SeenCell {unitPresentation?:{hit:boolean;scouted:boolean;scoutArt:boolean};cell:Cell;observation:'miss'|'impact'|'occupied'|'empty'|'uncertain';kind:UnitKind|null;knownDestroyed?:boolean;corePresentation?:'unidentified'|'identified';scouted?:boolean;scoutVisual?:boolean;castleMask?:number}
export interface PublicEvent {source?:'direct'|'archer'|'catapult'|'goblin'|'wizard'|'dragon'|'demon'|'plague'|'monk';position:number;kind:'impact'|'miss'|'unit-disclosed'|'resurrection-announced'|'hero-moved'|'plague-observed'|'resurrection-rejected'|'resurrection-found';side:Side;cell:Cell|null;unitKind:UnitKind|null}
export interface Choice {handle:string;kind:'hero-relocation'|'resurrection'|'catapult-target'|'catapult-roll'|'scout';side:Side;cells:Cell[];units:string[];remaining:number|null}
export interface PublicDemonRunes {sequence:number;side:Side;runes:{cell:Cell;glyph:string;rotation:number}[]}
export interface LossReveal {cell:Cell;kind:UnitKind;castleMask:number|null}
export interface ResurrectionSearch {active:boolean;cells:{cell:Cell;kind:UnitKind}[]}
export interface StrengthSample {round:number;player:number;enemy:number|null;enemyUnknown?:true}
export interface PublicStatistics {playerShots:number;enemyShots:number;playerDirectHits:number;enemyDirectHits:number;playerCells:number;enemyCells:number;playerLongestChain:number;enemyLongestChain:number;playerBiggestAttack:number;enemyBiggestAttack:number;playerUnitsDestroyed:number;enemyUnitsDestroyed:number;playerCoreDestroyed:number;enemyCoreDestroyed:number;rounds:{round:number;player:number;enemy:number}[];strength:StrengthSample[]}
export interface Snapshot {heroPresentation?:{side:Side;cell:Cell;state:"initial"|"active"|"hit"|"wounded"|"dead"}[];plagueCells:{side:Side;cell:Cell}[];gaveUp?:true;storyPlagueTargets:Side[];strips:Record<Side,Partial<Record<UnitKind,{placed:number;destroyed:number;heroHits:number}>>>;stats:PublicStatistics;monkClues:Cell[];aimAssistCells:Cell[];enemyResurrection:ResurrectionSearch;lossReveal:LossReveal[];resultMessage:string|null;demonRunes:PublicDemonRunes[];contract:'stone-throw-client-v1';battle:string;revision:number;size:number;phase:'placement'|'action'|'decision'|'finished'|'guarded';active:Side|null;round:number;shotsLeft:number;rosters:Record<Side,Partial<Record<UnitKind,number>>>;owned:OwnUnit[];opponent:SeenCell[];ownImpacts:Cell[];choice:Choice|null;outcome:'ongoing'|'win'|'loss'|'draw';eventPosition:number}
export type Intent={kind:'place';unit:UnitKind;cells:Cell[]}|{kind:'remove';unit:string}|{kind:'move';unit:string;cells:Cell[]}|{kind:'random-placement'}|{kind:'start'}|{kind:'reset'}|{kind:'give-up'}|{kind:'shoot';cell:Cell}|{kind:'answer';choice:string;cell:Cell|null;unit:string|null};
export interface Request {contract:'stone-throw-client-v1';battle:string;revision:number;intent:Intent}
export interface PresentationFrame {animation?:import("../local-host/animation-cue.js").AnimationCue;snapshot:Snapshot;events:PublicEvent[]}
export interface Update {presentation?:PresentationFrame[];accepted:boolean;error:'stale'|'illegal'|'unsupported'|null;snapshot:Snapshot;events:PublicEvent[]}
/** Asynchronous and request/response-shaped even for the in-process implementation. */
export interface ClientTransport {read(afterEvent?:number):Promise<Update>;dispatch(request:Request):Promise<Update>}
