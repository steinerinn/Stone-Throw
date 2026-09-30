import {installSingleEntry} from './single-entry.js';
import {installLocalGroup} from './local-group.js';
import './startup.js';
import './strength-renderer.js';
import {resolveReturn,coverRematch} from './rejoin.js';
import {installLan} from './lan.js';
import {createHttpSession} from './transport.js';
import {mountStoryBrowser} from './story-browser.js';
for(const name of ['__stoneThrowAutoMatchMode','__stoneThrowStoryAutoResolveMode'])Object.defineProperty(window,name,{get:()=>false,configurable:false});
let localContext=true,lastError=null,onlinePhase=null;function showError(error){lastError=error;if(error.code==='unknown-seat'){showUnavailableSeat();return;}if(error.localRecovery)localContext=true;else if(document.body.classList.contains('st-multiplayer-mode'))localContext=false;if(localContext&&!['seat-handed-to-ai','missing-seat-credential','unknown-seat','rejoin-required'].includes(error.code)){document.body.classList.add('st-main-menu-mode');let notice=document.getElementById('stLocalRecoveryMessage');if(!notice){notice=document.createElement('p');notice.id='stLocalRecoveryMessage';notice.setAttribute('role','alert');document.querySelector('#stMainMenu .st-menu-frame').append(notice);}notice.textContent='Local game unavailable ('+(error.code||'connection-failed')+'). Return through SINGLE PLAYER or CONTINUE STORY to retry. Your saved battle has not been discarded.';return;}let box=document.getElementById('stTransportError');if(!box){box=document.createElement('div');box.id='stTransportError';box.setAttribute('role','alert');box.style.cssText='position:fixed;top:0;left:0;right:0;z-index:100001;background:#211;color:white;padding:12px';document.body.append(box);}box.replaceChildren(document.createTextNode((error.code==='seat-handed-to-ai'?'This seat has already been handed to AI.':error.code==='missing-seat-credential'?'Your multiplayer seat credential is missing.':error.code==='unknown-seat'?'This multiplayer seat is no longer available.':'Local host: '+(error.code||'connection-failed')+'.')+' '));const retry=document.createElement('button');retry.textContent='REJOIN';retry.onclick=()=>location.reload();box.append(retry);if(['seat-handed-to-ai','unknown-seat','missing-seat-credential'].includes(error.code)){retry.hidden=true;const back=document.createElement('button');back.textContent='Multiplayer menu';back.onclick=async()=>{await session.request('pvp/leave');location.reload();};box.append(back);}if(error.code==='unknown-session'){const fresh=document.createElement('button');fresh.textContent='Start new local session';fresh.onclick=async()=>{await session.open(true);location.reload();};box.append(fresh);}}
// Missing seats are recovered explicitly; never send a voluntary leave on restart.
function showUnavailableSeat(){
 document.getElementById('stLoadingScreen')?.remove();
 if(document.getElementById('stSeatUnavailable'))return;
 if(!document.querySelector('link[href="styles-multiplayer.css"]')){const link=document.createElement('link');link.rel='stylesheet';link.href='styles-multiplayer.css';document.head.append(link);}
 const box=document.createElement('div');box.id='stSeatUnavailable';box.className='st-mp-overlay';
 box.innerHTML='<section class="st-mp-dialog st-frame" role="alertdialog" aria-modal="true" aria-labelledby="stSeatUnavailableTitle"><h2 id="stSeatUnavailableTitle">ONLINE SESSION UNAVAILABLE</h2><p>This online seat is no longer available. This can happen when the playtest restarts.</p><p>Refresh to check for a restored session, or return to the Main Menu.</p><div class="st-mp-actions"><button type="button" class="st-btn" data-refresh>REFRESH</button><button type="button" class="st-btn" data-menu>MAIN MENU</button></div><p class="st-mp-error" role="status"></p></section>';
 let recovering=false;
 async function recover(refresh){
  if(recovering)return;recovering=true;for(const button of box.querySelectorAll('button'))button.disabled=true;
  box.querySelector('.st-mp-error').textContent='Checking your online session…';
  try{await session.request('pvp/recover-missing-seat');location.reload();}
  catch(error){if(refresh&&error.code==='seat-still-available'){location.reload();return;}box.querySelector('.st-mp-error').textContent=error.code==='seat-still-available'?'Your seat is still available. Use REFRESH to reconnect.':'Could not reconnect to the server. Please try again.';recovering=false;for(const button of box.querySelectorAll('button'))button.disabled=false;}
 }
 box.querySelector('[data-refresh]').onclick=()=>recover(true);
 box.querySelector('[data-menu]').onclick=()=>recover(false);
 document.body.append(box);box.querySelector('[data-refresh]').focus();
}
const session=createHttpSession();let browserClient,lanClient,localGroupClient,singleEntry,localRecoveryPending=false,retryingLocal=false;
try{let recoveryError;let opening;try{opening=await session.open();}catch(error){if(!['unknown-session','local-recovery-unavailable','local-session-in-use'].includes(error.code))throw error;recoveryError=error;opening=await session.request('open',{menuOnly:true});}localContext=!opening.returning&&!opening.update?.lan;const opened=await resolveReturn(session,opening);browserClient=await mountStoryBrowser(session.client,{initialConfiguration:opened.configuration,localResume:opened.localResume,onError:showError,onPublicUpdate:u=>{localContext=!u.lan;onlinePhase=u.lan?u.snapshot?.phase:null;const restart=document.getElementById('stLocalNewGame');if(restart){const story=!!window.__stoneThrowStoryRuntimeState?.().active;restart.hidden=!!u.lan;restart.textContent='RESTART';}if(u.accepted!==false){document.getElementById('stLocalRecoveryMessage')?.remove();lastError=null;}if(!u.snapshot?.localGroup)localGroupClient?.clear();lanClient?.observe(u);localGroupClient?.observe(u);},additionalBlocked:()=>lanClient?.blocked(),selectMode:mode=>session.request('mode',{mode}),availableModes:opened.modes,initialMode:opened.update?.lan?'multiplayer':undefined,replaceConfiguration:next=>session.configure(next,next.story?window.__stoneThrowStoryContinuationContext?.():undefined)});lanClient=installLan(session,browserClient,opened);if(!localContext&&opened.reconnected&&!opened.multiplayerMenu&&!opened.mainMenu){document.body.classList.remove('st-main-menu-mode');}if(localContext){document.body.classList.add('st-main-menu-mode');document.getElementById('resultOverlay').style.display='none';}document.documentElement.dataset.localHost='connected';localRecoveryPending=!!opening.localRecoveryPending;/* A pending stale save is not a Main Menu error; explicit resume failures still use showError. */if(localRecoveryPending&&localContext&&recoveryError?.code==='local-session-in-use')showError(recoveryError);}
catch(error){showError(error);}
document.addEventListener('click',e=>{const localButton=e.target.closest('#stMenuFull,#stMenuStoryContinue,#stMenuStory');if(localRecoveryPending&&localButton){e.preventDefault();e.stopImmediatePropagation();if(retryingLocal)return;retryingLocal=true;session.request('mode',{mode:localButton.id==='stMenuFull'?'single':'story',fallback:true}).then(()=>{localRecoveryPending=false;lastError=null;document.getElementById('stLocalRecoveryMessage')?.remove();localButton.click();}).catch(error=>showError(Object.assign(error,{localRecovery:true}))).finally(()=>{retryingLocal=false;});return;}if(lastError&&!browserClient&&localContext&&e.target.closest('#stMenuFull,#stMenuStory,#stMenuStoryContinue')){e.preventDefault();e.stopImmediatePropagation();location.reload();return;}if(lastError&&!lanClient&&e.target.closest('#stMenuOnline')){e.preventDefault();e.stopImmediatePropagation();showError(lastError);}},true);

if(browserClient){localGroupClient=installLocalGroup(session,browserClient);singleEntry=installSingleEntry(session,browserClient);}

let matchPrompt=null;
function confirmMatchAction({id,label,message}){
 if(matchPrompt)return Promise.resolve(false);
 return new Promise(resolve=>{
  const previous=document.activeElement,dialog=document.createElement('dialog');matchPrompt=dialog;dialog.id=id;dialog.className='st-mp-dialog st-frame st-game-confirm';dialog.setAttribute('aria-labelledby',id+'Title');dialog.setAttribute('aria-describedby',id+'Text');
  dialog.innerHTML='<h2></h2><p></p><div class="st-mp-actions"><button type="button" class="st-btn" data-confirm="cancel" autofocus>CANCEL</button><button type="button" class="st-btn" data-confirm="start"></button></div>';
  const title=dialog.querySelector('h2'),text=dialog.querySelector('p');title.id=id+'Title';title.textContent=label;text.id=id+'Text';text.textContent=message;dialog.querySelector('[data-confirm="start"]').textContent=label;
  const finish=accepted=>{dialog.close();dialog.remove();matchPrompt=null;if(previous?.isConnected)previous.focus({preventScroll:true});resolve(accepted);};
  dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false);});dialog.querySelector('[data-confirm="cancel"]').onclick=()=>finish(false);dialog.querySelector('[data-confirm="start"]').onclick=()=>finish(true);document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-confirm="cancel"]').focus({preventScroll:true});
 });
}
function confirmRestart(story){return confirmMatchAction({id:'stNewGameConfirm',label:'RESTART',message:'Your current match will be lost. '+(story?'Restart this map?':'Start a new game?')});}
function confirmLeave(){return confirmMatchAction({id:'stLeaveMatchConfirm',label:'LEAVE MATCH',message:onlinePhase==='placement'?'If you leave, you will lose your seat, but you will not receive a Reliability penalty.':'You will leave this match. Leaving while other human opponents remain may lower your Reliability.'});}
function reloadToMainMenu(){location.reload();}
let leavingMatch=false;
window.__stoneThrowLeaveMatch=async({fromResult=false}={})=>{
 if(localContext){if(fromResult)document.getElementById('resultOverlay').style.display='none';window.__stoneThrowOpenMainMenu?.();return;}
 if(leavingMatch||(!fromResult&&!await confirmLeave()))return;
 leavingMatch=true;const uncover=fromResult?coverRematch():null;
 try{await session.request('leave-match');browserClient?.unmount();reloadToMainMenu();}
 catch(error){await uncover?.();window.alert('Could not leave the match. Please try again. ('+(error.code||'connection-failed')+')');leavingMatch=false;}
};
window.addEventListener('click',async e=>{if(localContext&&e.target.closest?.('#stLocalResultMenu')){e.preventDefault();e.stopImmediatePropagation();void window.__stoneThrowLeaveMatch({fromResult:true});return;}if(!e.target.closest?.('#stLocalLeave,#stHeaderLeave,#stGroupLeave,#stLanLeave,#stLanResultMenu,[data-leave-match]'))return;e.preventDefault();e.stopImmediatePropagation();void window.__stoneThrowLeaveMatch({fromResult:!!e.target.closest?.('#resultOverlay,.cs-results')});},true);
const resultActions=document.querySelector('#resultOverlay .result-actions');
if(resultActions&&!document.getElementById('stResultLeave')){const button=document.createElement('button');button.id='stResultLeave';button.type='button';button.className='st-btn';button.textContent='BATTLEFIELD';button.onclick=()=>{document.getElementById('resultOverlay').style.display='none';};resultActions.append(button);}

if(browserClient){const button=document.createElement('button');button.id='stLocalNewGame';button.type='button';button.className='st-btn';const activeStory=()=>!!window.__stoneThrowStoryRuntimeState?.().active;button.textContent='RESTART';button.hidden=!localContext;document.getElementById('stLocalLeave')?.after(button);button.onclick=async()=>{const story=activeStory();if(leavingMatch||!await confirmRestart(story))return;leavingMatch=true;try{await browserClient.restart();}catch(error){window.alert('Could not restart the match. Please try again.');}finally{leavingMatch=false;}};}
