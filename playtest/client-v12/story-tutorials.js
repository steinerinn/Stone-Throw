// Original production tutorial/copy/preference functions; explicit public inputs only.
export function installStoryTutorials(){
let SIZE=15,STORY_MODE_ACTIVE=false,POPUPS_ON=false,TUTORIAL_POPUP_OPEN=false,TUTORIAL_POPUP_RESOLVE=null,TUTORIAL_POPUP_TYPE=null,eventPopupOpen=false,eventPopupResolve=null;
const AUTO_MATCH_MODE=false,STORY_AUTO_RESOLVE_MODE=false,STORY_TUTORIAL_KEY='stoneThrow.storyTutorial.v1',STORY_POPUPS_KEY='stoneThrow.storyPopups.enabled.v1',tutorialShownThisBattle=new Set();let tutorialPrefs={};try{tutorialPrefs=JSON.parse(localStorage.getItem(STORY_TUTORIAL_KEY)||'{}')||{};}catch(_){tutorialPrefs={};}
const parseKey=k=>{const [x,y]=k.split(',').map(Number);return {x,y};},enemyGrid=document.getElementById('enemyGrid'),eventOverlay=document.getElementById('eventOverlay');
const tutorialOverlay=document.getElementById('stTutorialOverlay');
const tutorialArt=document.getElementById('stTutorialArt');
const tutorialName=document.getElementById('stTutorialName');
const tutorialType=document.getElementById('stTutorialType');
const tutorialLead=document.getElementById('stTutorialLead');
const tutorialBody=document.getElementById('stTutorialBody');
const tutorialRemind=document.getElementById('stTutorialRemind');
const tutorialSkip=document.getElementById('stTutorialSkip');
function saveTutorialPrefs(){try{localStorage.setItem(STORY_TUTORIAL_KEY,JSON.stringify(tutorialPrefs));}catch(_){}}
function restoreStoryPopupPreference(){try{const v=localStorage.getItem(STORY_POPUPS_KEY);POPUPS_ON=v===null?true:v==='1';}catch(_){POPUPS_ON=true;}return POPUPS_ON;}
function showEventPopup(title,message,allowStory=false){
/* v1.418: legacy modal combat notifications retired.
   Combat feedback now comes from battlefield overlays + Event Log.
   Decision/confirmation dialogs use separate UI and are intentionally preserved. */
if(eventOverlay) eventOverlay.style.display='none';
eventPopupOpen=false;
eventPopupResolve=null;
return Promise.resolve();
}
function closeEventPopup(){if(!eventPopupOpen)return;eventPopupOpen=false;eventOverlay.style.display='none';const resolve=eventPopupResolve;eventPopupResolve=null;if(resolve)resolve();}
function normalizeTutorialType(type){return type==='infantry'?'inf':type==='cavalry'?'cav':type;}
function tutorialRevealed(targetSide,type,k){
if(targetSide==='player')return true;if(type!=='cav'&&type!=='castle')return true;const p=parseKey(k),cell=enemyGrid.children[p.y*SIZE+p.x];return !!cell&&!cell.classList.contains('cavalry-question')&&!cell.classList.contains('castle-question')&&(type!=='cav'||cell.classList.contains('cav-cell'))&&(type!=='castle'||cell.classList.contains('castle-cell'));}
function closeTutorialPopup(pref){
if(!TUTORIAL_POPUP_OPEN)return;const type=TUTORIAL_POPUP_TYPE;if(type&&pref){tutorialPrefs[type]=pref;saveTutorialPrefs();}
TUTORIAL_POPUP_OPEN=false;TUTORIAL_POPUP_TYPE=null;tutorialOverlay?.classList.remove('open');const resolve=TUTORIAL_POPUP_RESOLVE;TUTORIAL_POPUP_RESOLVE=null;if(resolve)resolve();}
function maybeShowUnitTutorial(type,targetSide,k){
type=normalizeTutorialType(type);const revealed=!!type&&tutorialRevealed(targetSide,type,k);if(STORY_MODE_ACTIVE&&revealed)window.__stoneThrowRecordStoryUnitDiscovery?.(type);if(AUTO_MATCH_MODE||STORY_AUTO_RESOLVE_MODE||!STORY_MODE_ACTIVE||!POPUPS_ON||!type||tutorialPrefs[type]==='skip'||tutorialShownThisBattle.has(type)||!revealed)return Promise.resolve();const data=window.__stoneThrowTutorialData?.(type);if(!data)return Promise.resolve();tutorialShownThisBattle.add(type);TUTORIAL_POPUP_OPEN=true;TUTORIAL_POPUP_TYPE=type;if(tutorialArt){tutorialArt.src=data.art;tutorialArt.alt=data.name+' artwork';}
if(tutorialName)tutorialName.textContent=data.name;if(tutorialType){tutorialType.textContent=data.punch?.tag||data.type;tutorialType.className='st-tutorial-type '+(data.type==='Core unit'?'core':'special');}
if(tutorialLead){if(data.punch){tutorialLead.innerHTML='<div class="st-tutorial-punch">'+data.punch.facts.map(f=>'<div class="st-unit-punch-fact">'+f+'</div>').join('')+'</div><div class="st-tutorial-lead-copy">'+data.lead+'</div>';}else{tutorialLead.textContent=data.lead;}}if(tutorialBody)tutorialBody.innerHTML=data.body.map(p=>'<p>'+p+'</p>').join('');tutorialOverlay?.classList.add('open');return new Promise(resolve=>{TUTORIAL_POPUP_RESOLVE=resolve;setTimeout(()=>tutorialRemind?.focus(),0);});}
function setPopupsEnabled(on){
POPUPS_ON=!!on;if(STORY_MODE_ACTIVE){try{localStorage.setItem(STORY_POPUPS_KEY,POPUPS_ON?'1':'0');}catch(_){}}if(!POPUPS_ON){if(eventPopupOpen)closeEventPopup();if(TUTORIAL_POPUP_OPEN)closeTutorialPopup(null);}return POPUPS_ON;}
tutorialRemind?.addEventListener('click',()=>closeTutorialPopup('remind'));tutorialSkip?.addEventListener('click',()=>closeTutorialPopup('skip'));
window.__stoneThrowPopupsState=()=>POPUPS_ON;window.__stoneThrowTogglePopups=()=>setPopupsEnabled(!POPUPS_ON);window.__stoneThrowResetTutorials=()=>{tutorialPrefs={};try{localStorage.removeItem(STORY_TUTORIAL_KEY);}catch(_){}tutorialShownThisBattle.clear();return true;};
let pendingTutorial=null;
return Object.freeze({wait:()=>pendingTutorial,restorePreference:restoreStoryPopupPreference,reset:({size,story})=>{closeTutorialPopup(null);SIZE=size;STORY_MODE_ACTIVE=story;tutorialShownThisBattle.clear();showEventPopup();},show:(...args)=>{const promise=maybeShowUnitTutorial(...args);pendingTutorial=promise;return promise.finally(()=>{if(pendingTutorial===promise)pendingTutorial=null;});},open:()=>TUTORIAL_POPUP_OPEN});
}
