// Browser-owned legacy Story configuration and progression state.
// Original roster functions and public bridges are copied byte-for-byte.
export function installStoryPolicy({window,document,getComputedStyle,requestAnimationFrame,cancelAnimationFrame,configure,restorePopupPreference,status}){
let phase='place';const playerGrid=document.getElementById('playerGrid'),enemyGrid=document.getElementById('enemyGrid'),pHdrRow=document.getElementById('pHdrRow'),eHdrRow=document.getElementById('eHdrRow'),pHdrCol=document.getElementById('pHdrCol'),eHdrCol=document.getElementById('eHdrCol');
function setup(){return configure(configuration());}function restoreStoryPopupPreference(){restorePopupPreference();}function setStatus(text){status(text);}
let SIZE=15;const PLAGUE_ROUNDS=5;const PLAGUE_SINGLE_PCT=40;const PLAGUE_DOUBLE_PCT=60;const PLAGUE_TRIPLE_PCT=0;const PLAGUE_START_COUNT=1;let INF_COUNT=5;let CAV_COUNT=3;let ARCHER_COUNT=3;let MONK_COUNT=1;let CASTLE_COUNT=2;const CASTLE_SIZE=5;const ARCHER_WEIGHTS=[5,15,40,15,7,6,5,4,2,1];let DWARF_COUNT=1;let GOBLIN_COUNT=1;let CATAPULT_COUNT=2;let ELF_COUNT=1;let CLERIC_COUNT=1;let DEMON_COUNT=1;let DRAGON_COUNT=1;let WIZARD_COUNT=1;let NECRO_COUNT=2;let HERO_COUNT=1;const FULL_GAME_CONFIG={
size:15,inf:5,cav:3,archer:3,monk:1,castle:2,dwarf:1,goblin:1,
catapult:2,elf:1,cleric:1,demon:1,dragon:1,wizard:1,necro:2,hero:1
};const STORY_BATTLE_1_CONFIG={
size:5,inf:1,cav:1,archer:1,monk:0,castle:0,dwarf:0,goblin:0,
catapult:0,elf:0,cleric:0,demon:0,dragon:0,wizard:0,necro:0,hero:0
};let STORY_MODE_ACTIVE=false,STORY_BATTLE_NUMBER=0,STORY_LAST_PLAYER_WON=null,STORY_RESULT_BATTLE=0,STORY_RESULT_PLAYER_WON=null;let SUSPENDED_STORY_FOR_OTHER_MODE=null;let CURRENT_PLAYER_ROSTER={...FULL_GAME_CONFIG},CURRENT_ENEMY_ROSTER={...FULL_GAME_CONFIG};let STORY_CLERIC_UNLOCKED_PLAYER=false,STORY_CLERIC_UNLOCKED_ENEMY=false;
function storyClericUnlocked(side){return side==='player'?STORY_CLERIC_UNLOCKED_PLAYER:side==='enemy'?STORY_CLERIC_UNLOCKED_ENEMY:false;}
function unlockStoryCleric(side){if(side==='player')STORY_CLERIC_UNLOCKED_PLAYER=true;else if(side==='enemy')STORY_CLERIC_UNLOCKED_ENEMY=true;}
function syncStoryClerics(){STORY_CLERIC_UNLOCKED_PLAYER=true;STORY_CLERIC_UNLOCKED_ENEMY=true;return {player:true,enemy:true};}
window.__stoneThrowStoryClericUnlocked=storyClericUnlocked;window.__stoneThrowUnlockStoryClerics=(sides)=>{for(const side of (Array.isArray(sides)?sides:[sides]))unlockStoryCleric(side);return {player:STORY_CLERIC_UNLOCKED_PLAYER,enemy:STORY_CLERIC_UNLOCKED_ENEMY};};window.__stoneThrowSyncStoryClerics=syncStoryClerics;
function applyBattleConfig(cfg,story=false,battle=0,enemyCfg=null){const layoutShell=document.getElementById('stoneThrowShell');if(layoutShell&&!story){layoutShell.style.setProperty('--st-master-width','1418px');window.__stoneThrowStoryCenterNeeded=null;}
SIZE=cfg.size;INF_COUNT=cfg.inf; CAV_COUNT=cfg.cav; ARCHER_COUNT=cfg.archer;MONK_COUNT=cfg.monk; CASTLE_COUNT=cfg.castle; DWARF_COUNT=cfg.dwarf;GOBLIN_COUNT=cfg.goblin; CATAPULT_COUNT=cfg.catapult; ELF_COUNT=cfg.elf;CLERIC_COUNT=cfg.cleric; DEMON_COUNT=cfg.demon; DRAGON_COUNT=cfg.dragon;WIZARD_COUNT=cfg.wizard; NECRO_COUNT=cfg.necro; HERO_COUNT=cfg.hero;CURRENT_PLAYER_ROSTER={...cfg}; CURRENT_ENEMY_ROSTER={...(enemyCfg||cfg)};STORY_MODE_ACTIVE=story; STORY_BATTLE_NUMBER=battle;if(story){if((CURRENT_PLAYER_ROSTER.cleric||0)>0)unlockStoryCleric('player');if((CURRENT_ENEMY_ROSTER.cleric||0)>0)unlockStoryCleric('enemy');}document.body.classList.toggle('story-mode-active',story);document.documentElement.style.setProperty('--cell',story?'22.67px':'22.67px');document.documentElement.style.setProperty('--board-track-count',String(SIZE));if(story) requestAnimationFrame(()=>updateStoryMapGeometry());} window.__stoneThrowSuspendStoryForOtherMode=function(){
if(!STORY_MODE_ACTIVE||phase==='over')return false;
SUSPENDED_STORY_FOR_OTHER_MODE={battle:STORY_BATTLE_NUMBER,player:{...CURRENT_PLAYER_ROSTER},enemy:{...CURRENT_ENEMY_ROSTER}};
return true;};
window.__stoneThrowHasSuspendedStory=()=>!!SUSPENDED_STORY_FOR_OTHER_MODE;
window.__stoneThrowResumeSuspendedStory=function(){
if(!SUSPENDED_STORY_FOR_OTHER_MODE)return false;
const s=SUSPENDED_STORY_FOR_OTHER_MODE;SUSPENDED_STORY_FOR_OTHER_MODE=null;
applyBattleConfig(s.player,true,s.battle,s.enemy);setup();restoreStoryPopupPreference();setStatus(`Story Battle ${s.battle}: place your forces.`);return true;};
window.__stoneThrowClearSuspendedStory=()=>{SUSPENDED_STORY_FOR_OTHER_MODE=null;};
function updateStoryMapGeometry(){
if(!STORY_MODE_ACTIVE)return;
const baseCell=22.67;
const safeInset=26;
const storyHost=Math.min(360,Math.max(160,(SIZE*baseCell)+(safeInset*2)));
document.body.style.setProperty('--story-host-max',`${storyHost}px`);
const shell=document.getElementById('stoneThrowShell');
if(shell){
  /* Horizontal layout budget is independent of marker count.
     Future marker rows may only grow vertically. */
  const centerWidth=(storyHost*2)+18+24;
  const leftSidebar=185;
  const rightSidebar=250;
  const gaps=24;
  window.__stoneThrowStoryCenterNeeded=centerWidth;
  const desired=Math.min(1418,Math.max(900,centerWidth+leftSidebar+rightSidebar+gaps));
  shell.style.setProperty('--st-master-width',`${desired}px`);
}
const hosts=[document.getElementById('stPlayerGridHost'),document.getElementById('stEnemyGridHost')].filter(Boolean);
if(!hosts.length)return;
const host=hosts[0];
  if(!host.clientWidth)return; // Hidden menu/reconnect scaffolds cannot supply a cell size.
const cs=getComputedStyle(host);
const px=v=>Number.parseFloat(v)||0;
const inner=Math.max(1,host.clientWidth-px(cs.paddingLeft)-px(cs.paddingRight));
const maxCell=42;
const cell=Math.max(12,Math.min(maxCell,inner/Math.max(1,SIZE)));
document.documentElement.style.setProperty('--cell',`${cell}px`);
const cols=`repeat(${SIZE},var(--cell))`,rows=`repeat(${SIZE},var(--cell))`;
for(const g of [playerGrid,enemyGrid])if(g){g.style.gridTemplateColumns=cols;g.style.gridTemplateRows=rows;}
for(const h of [pHdrRow,eHdrRow])if(h)h.style.gridTemplateColumns=cols;
for(const h of [pHdrCol,eHdrCol])if(h)h.style.gridTemplateRows=rows;
requestAnimationFrame(()=>window.__stoneThrowUpdateCommandLayoutFit?.());
}
let storyMapResizeRAF=0;window.addEventListener('resize',()=>{if(!STORY_MODE_ACTIVE)return;cancelAnimationFrame(storyMapResizeRAF);storyMapResizeRAF=requestAnimationFrame(updateStoryMapGeometry);});
function storyBattle2Rosters(playerWon){
const base={size:8,inf:1,cav:1,archer:1,monk:0,castle:0,dwarf:0,goblin:0,catapult:0,elf:0,cleric:0,demon:0,dragon:0,wizard:0,necro:0,hero:0};const castle={...base,castle:1};const reinforced={...base,inf:2,cav:3};return playerWon?{player:reinforced,enemy:castle}:{player:castle,enemy:reinforced};}
function storyBattle3Rosters(){
const base={size:8,inf:1,cav:1,archer:1,monk:0,castle:0,dwarf:0,goblin:0,catapult:0,elf:0,cleric:0,demon:0,dragon:0,wizard:0,necro:0,hero:0};const castle={...base,castle:1};const catapultForce={...base,inf:2,cav:2,catapult:1};return (CURRENT_PLAYER_ROSTER.castle||0)>0?{player:castle,enemy:catapultForce}:{player:catapultForce,enemy:castle};}

const STORY_PHASE2_BASE={size:9,inf:2,cav:2,archer:1,monk:0,castle:1,dwarf:0,goblin:0,catapult:1,elf:0,cleric:0,demon:0,dragon:0,wizard:0,necro:0,hero:0};
function storyPhase2Rosters(battle,previousPlayerWon=null){
const base={...STORY_PHASE2_BASE};if(battle>=6)base.size=10;
if(battle===4)return {player:{...base},enemy:{...base}};
if(battle===5){const loserPlayer=previousPlayerWon===false;return {player:{...base,dwarf:loserPlayer?1:0},enemy:{...base,dwarf:loserPlayer?0:1}};}
if(battle===6){const synced={...base,dwarf:1};const loserPlayer=previousPlayerWon===false;return {player:{...synced,elf:loserPlayer?1:0},enemy:{...synced,elf:loserPlayer?0:1}};}
if(battle===7){const synced={...base,dwarf:1,elf:1};const loserPlayer=previousPlayerWon===false;return {player:{...synced,goblin:loserPlayer?1:0},enemy:{...synced,goblin:loserPlayer?0:1}};}
const synced={...base,dwarf:1,elf:1,goblin:1};return {player:{...synced},enemy:{...synced}};
}
const STORY_PHASE3_BASE={size:11,inf:2,cav:2,archer:2,monk:0,castle:1,dwarf:1,goblin:1,catapult:1,elf:1,cleric:0,demon:0,dragon:0,wizard:0,necro:0,hero:0};
function storyPhase3Battle9Rosters(previousPlayerWon){
const base={...STORY_PHASE3_BASE};const playerGetsNecro=previousPlayerWon===false;return {
player:playerGetsNecro?{...base,necro:2}:{...base,inf:base.inf+2},
enemy:playerGetsNecro?{...base,inf:base.inf+2}:{...base,necro:2}
};}
function storyPhase3Battle10Rosters(necroOwnerSide){
const base={...STORY_PHASE3_BASE};const owner=(necroOwnerSide==='player'||necroOwnerSide==='enemy')?necroOwnerSide:((CURRENT_PLAYER_ROSTER.necro||0)>0?'player':((CURRENT_ENEMY_ROSTER.necro||0)>0?'enemy':null));
if(!owner) throw new Error('Story Phase 3 Cleric battle has no Necromancer side.');
const r=owner==='player'?{player:{...base,necro:2},enemy:{...base,inf:base.inf+2}}:{player:{...base,inf:base.inf+2},enemy:{...base,necro:2}};
const clericSide=owner==='player'?'enemy':'player';r[clericSide]={...r[clericSide],inf:Math.max(0,(r[clericSide].inf||0)-1),cleric:1};return r;}
function storyPhase3Rosters(battle,previousPlayerWon=null,necroOwnerSide=null){
if(battle===8)return {player:{...STORY_PHASE3_BASE},enemy:{...STORY_PHASE3_BASE}};
if(battle===9)return storyPhase3Battle9Rosters(previousPlayerWon);
if(battle===10)return storyPhase3Battle10Rosters(necroOwnerSide);
throw new Error(`Unsupported Story Phase 3 battle: ${battle}`);}
const STORY_PHASE4_BASE={size:11,inf:3,cav:2,archer:2,monk:0,castle:1,dwarf:1,goblin:1,catapult:1,elf:1,cleric:0,demon:0,dragon:0,wizard:0,necro:2,hero:0};
function storyPhase4BaseRosters(){const player={...STORY_PHASE4_BASE},enemy={...STORY_PHASE4_BASE};if(storyClericUnlocked('player'))player.cleric=1;if(storyClericUnlocked('enemy'))enemy.cleric=1;return {player,enemy};}
function storyPhase4ApplyNewClerics(r,plagueTargets=[]){for(const side of new Set(Array.isArray(plagueTargets)?plagueTargets:[])){if((side!=='player'&&side!=='enemy')||storyClericUnlocked(side))continue;r[side]={...r[side],inf:Math.max(0,(r[side].inf||0)-1),cleric:1};unlockStoryCleric(side);}return r;}
function storyPhase4Rosters(battle,previousPlayerWon=null,plagueTargets=[]){const r=storyPhase4BaseRosters();if(previousPlayerWon===null)return storyPhase4ApplyNewClerics(r,plagueTargets);const loserSide=previousPlayerWon===false?'player':'enemy';r[loserSide]={...r[loserSide],monk:1};return storyPhase4ApplyNewClerics(r,plagueTargets);}
const STORY_PHASE5_BASE={size:12,inf:3,cav:2,archer:2,monk:1,castle:1,dwarf:1,goblin:1,catapult:1,elf:1,cleric:0,demon:0,dragon:0,wizard:0,necro:2,hero:0};
function storyPhase5BaseRosters(size=12){const player={...STORY_PHASE5_BASE,size},enemy={...STORY_PHASE5_BASE,size};const p=storyClericUnlocked('player'),e=storyClericUnlocked('enemy');if(p&&e){player.cleric=1;enemy.cleric=1;}else if(p){player.cleric=1;player.inf=Math.max(0,player.inf-1);}else if(e){enemy.cleric=1;enemy.inf=Math.max(0,enemy.inf-1);}return {player,enemy};}
function storyPhase5AdvanceClericsFromPreviousBattle(){const pHad=(CURRENT_PLAYER_ROSTER.cleric||0)>0,eHad=(CURRENT_ENEMY_ROSTER.cleric||0)>0;if(pHad!==eHad&&(storyClericUnlocked('player')||storyClericUnlocked('enemy')))syncStoryClerics();}
function storyPhase5ApplyNewClerics(r,plagueTargets=[]){for(const side of new Set(Array.isArray(plagueTargets)?plagueTargets:[])){if((side!=='player'&&side!=='enemy')||storyClericUnlocked(side))continue;r[side]={...r[side],inf:Math.max(0,(r[side].inf||0)-1),cleric:1};unlockStoryCleric(side);}return r;}
function storyPhase5Rosters(stage,previousPlayerWon=null,plagueTargets=[]){if(stage>0)storyPhase5AdvanceClericsFromPreviousBattle();const size=stage<2?12:13;const r=storyPhase5BaseRosters(size);storyPhase5ApplyNewClerics(r,plagueTargets);if(stage===0)return r;const loserSide=previousPlayerWon===false?'player':'enemy';if(stage===1){r[loserSide]={...r[loserSide],dragon:1};return r;}if(stage===2){r.player.dragon=1;r.enemy.dragon=1;r[loserSide]={...r[loserSide],demon:1};return r;}if(stage===3){r.player.dragon=1;r.enemy.dragon=1;r.player.demon=1;r.enemy.demon=1;r[loserSide]={...r[loserSide],wizard:1};return r;}throw new Error(`Unsupported Story Dragon/Demon/Wizard stage: ${stage}`);}
const STORY_PHASE6_BASE={size:14,inf:4,cav:2,archer:1,monk:1,castle:2,dwarf:1,goblin:1,catapult:2,elf:1,cleric:0,demon:1,dragon:1,wizard:1,necro:2,hero:0};
function storyPhase6BaseRosters(){const player={...STORY_PHASE6_BASE},enemy={...STORY_PHASE6_BASE};const p=storyClericUnlocked('player'),e=storyClericUnlocked('enemy');if(p&&e){player.cleric=1;enemy.cleric=1;}else if(p){player.cleric=1;player.inf=Math.max(0,player.inf-1);}else if(e){enemy.cleric=1;enemy.inf=Math.max(0,enemy.inf-1);}return {player,enemy};}
function storyPhase6AdvanceClericsFromPreviousBattle(){const pHad=(CURRENT_PLAYER_ROSTER.cleric||0)>0,eHad=(CURRENT_ENEMY_ROSTER.cleric||0)>0;if(pHad!==eHad&&(storyClericUnlocked('player')||storyClericUnlocked('enemy')))syncStoryClerics();}
function storyPhase6ApplyNewClerics(r,plagueTargets=[]){for(const side of new Set(Array.isArray(plagueTargets)?plagueTargets:[])){if((side!=='player'&&side!=='enemy')||storyClericUnlocked(side))continue;r[side]={...r[side],inf:Math.max(0,(r[side].inf||0)-1),cleric:1};unlockStoryCleric(side);}return r;}
function storyPhase6Rosters(stage,previousPlayerWon=null,plagueTargets=[]){if(stage>0)storyPhase6AdvanceClericsFromPreviousBattle();if(stage===2){syncStoryClerics();return {player:{...FULL_GAME_CONFIG},enemy:{...FULL_GAME_CONFIG}};}const r=storyPhase6BaseRosters();storyPhase6ApplyNewClerics(r,plagueTargets);if(stage===0)return r;if(stage===1){const loserSide=previousPlayerWon===false?'player':'enemy',winnerSide=loserSide==='player'?'enemy':'player';r[loserSide]={...r[loserSide],hero:1};r[winnerSide]={...r[winnerSide],inf:(r[winnerSide].inf||0)+1};return r;}throw new Error(`Unsupported Story Hero/final stage: ${stage}`);}

const STORY_SHARED_COPY=Object.freeze({
firstVictory:'Victory. Your army holds the field.',
firstDefeat:'Defeat. Your army withdraws to regroup.',
castleOpen:capWho=>`${capWho} engineers reach a simple conclusion: standing in an open field while people shoot at you is not a sound defensive strategy.`,
castleRise:'By morning, the first stone walls are already rising.',
nextBattle:'By dawn, both armies are preparing for the next battle.'
});
window.__stoneThrowStoryBattle1Narrative=function(playerWon){
const capWho=playerWon?'The enemy':'Your';return {
title:playerWon?'Victory':'Defeat',
paragraphs:[
playerWon?STORY_SHARED_COPY.firstVictory:STORY_SHARED_COPY.firstDefeat,
STORY_SHARED_COPY.castleOpen(capWho),
STORY_SHARED_COPY.castleRise,
STORY_SHARED_COPY.nextBattle
]
};};
window.__stoneThrowStoryPlayerHasCastle=()=>!!(CURRENT_PLAYER_ROSTER.castle||0);
window.__stoneThrowSetFullGame = function(){
applyBattleConfig(FULL_GAME_CONFIG,false,0);setup();return true;};
window.__stoneThrowResetFullGame = function(){
setup();return true;};
window.__stoneThrowStartStoryBattle1 = function(){
STORY_CLERIC_UNLOCKED_PLAYER=false;STORY_CLERIC_UNLOCKED_ENEMY=false;applyBattleConfig(STORY_BATTLE_1_CONFIG,true,1);STORY_LAST_PLAYER_WON=STORY_RESULT_PLAYER_WON=null;STORY_RESULT_BATTLE=0;setup();restoreStoryPopupPreference();setStatus('Story Battle 1: place your Infantry, Cavalry and Archer.');return true;};
window.__stoneThrowStartStoryBattle2 = function(playerWon){
const r=storyBattle2Rosters(!!playerWon);applyBattleConfig(r.player,true,2,r.enemy);STORY_LAST_PLAYER_WON=STORY_RESULT_PLAYER_WON=null;STORY_RESULT_BATTLE=0;setup();restoreStoryPopupPreference();setStatus(playerWon?'Story Battle 2: reinforcements have joined your army.':'Story Battle 2: place your new Castle.');return true;};
window.__stoneThrowStartStoryBattle3 = function(){
const r=storyBattle3Rosters();applyBattleConfig(r.player,true,3,r.enemy);STORY_LAST_PLAYER_WON=STORY_RESULT_PLAYER_WON=null;STORY_RESULT_BATTLE=0;setup();restoreStoryPopupPreference();setStatus((CURRENT_PLAYER_ROSTER.catapult||0)>0?'Story Battle 3: place your new Catapult.':'Story Battle 3: the enemy has answered with a Catapult.');return true;};
window.__stoneThrowStartStoryPhase2Battle=function(battle,previousPlayerWon=null){
const r=storyPhase2Rosters(battle,previousPlayerWon);applyBattleConfig(r.player,true,battle,r.enemy);STORY_LAST_PLAYER_WON=STORY_RESULT_PLAYER_WON=null;STORY_RESULT_BATTLE=0;setup();restoreStoryPopupPreference();const labels={4:'Both kingdoms are fully mobilized.',5:'Dwarves have entered the war.',6:'Elves have entered the war.',7:'Goblins have entered the war.',8:'Both armies now field the same expanded force.'};setStatus(`Story Battle ${battle}: ${labels[battle]||'Prepare for battle.'}`);return true;};
window.__stoneThrowStartStoryPhase3Battle=function(battle,previousPlayerWon=null,necroOwnerSide=null){
const r=storyPhase3Rosters(battle,previousPlayerWon,necroOwnerSide);applyBattleConfig(r.player,true,battle,r.enemy);STORY_LAST_PLAYER_WON=STORY_RESULT_PLAYER_WON=null;STORY_RESULT_BATTLE=0;setup();restoreStoryPopupPreference();const labels={8:'The armies meet on equal ground again.',9:'Necromancers have entered the war.',10:'A Cleric answers the Plague.'};setStatus(`Story Battle ${battle}: ${labels[battle]||'Prepare for battle.'}`);return true;};
window.__stoneThrowStartStoryPhase4Battle=function(battle,previousPlayerWon=null,plagueTargets=[]){
const r=storyPhase4Rosters(battle,previousPlayerWon,plagueTargets);applyBattleConfig(r.player,true,battle,r.enemy);STORY_LAST_PLAYER_WON=STORY_RESULT_PLAYER_WON=null;STORY_RESULT_BATTLE=0;setup();restoreStoryPopupPreference();const label=previousPlayerWon===null?'Necromancy is now part of both armies.':'A Monk has entered the war.';setStatus(`Story Battle ${battle}: ${label}`);return true;};
window.__stoneThrowStartStoryPhase5Battle=function(battle,stage=0,previousPlayerWon=null,plagueTargets=[]){
const r=storyPhase5Rosters(stage,previousPlayerWon,plagueTargets);applyBattleConfig(r.player,true,battle,r.enemy);STORY_LAST_PLAYER_WON=STORY_RESULT_PLAYER_WON=null;STORY_RESULT_BATTLE=0;setup();restoreStoryPopupPreference();const labels=['The armies meet on equal ground again.','A Dragon has entered the war.','A Demon has entered the war.','A Wizard has entered the war.'];setStatus(`Story Battle ${battle}: ${labels[stage]||'Prepare for battle.'}`);return true;};
window.__stoneThrowStartStoryPhase6Battle=function(battle,stage=0,previousPlayerWon=null,plagueTargets=[]){
const r=storyPhase6Rosters(stage,previousPlayerWon,plagueTargets);applyBattleConfig(r.player,true,battle,r.enemy);STORY_LAST_PLAYER_WON=STORY_RESULT_PLAYER_WON=null;STORY_RESULT_BATTLE=0;setup();restoreStoryPopupPreference();const labels=['The largest armies yet meet on equal ground.','A Hero has entered the war.','The final battle begins.'];setStatus(`Story Battle ${battle}: ${labels[stage]||'Prepare for battle.'}`);return true;};
function configuration(){return {size:SIZE,story:STORY_MODE_ACTIVE,battle:STORY_BATTLE_NUMBER,player:{...CURRENT_PLAYER_ROSTER},enemy:{...CURRENT_ENEMY_ROSTER}};}
return Object.freeze({syncLayout:()=>{if(STORY_MODE_ACTIVE)document.documentElement.style.setProperty('--cell','22.67px');requestAnimationFrame(updateStoryMapGeometry);},restoreConfiguration:next=>{applyBattleConfig(next.player,next.story,next.battle,next.enemy);STORY_CLERIC_UNLOCKED_PLAYER=!!next.player.cleric;STORY_CLERIC_UNLOCKED_ENEMY=!!next.enemy.cleric;},clearResult:()=>{STORY_LAST_PLAYER_WON=null;STORY_RESULT_PLAYER_WON=null;STORY_RESULT_BATTLE=0;},configuration,observePhase:value=>{phase=value;},recordResult:({battle,playerWon})=>{STORY_RESULT_BATTLE=battle;STORY_RESULT_PLAYER_WON=playerWon;if(playerWon!==null)STORY_LAST_PLAYER_WON=playerWon;},result:()=>({battle:STORY_RESULT_BATTLE,playerWon:STORY_RESULT_PLAYER_WON,lastPlayerWon:STORY_LAST_PLAYER_WON})});
}
