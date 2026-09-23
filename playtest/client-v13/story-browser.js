import {refreshAccountStory} from './story-account.js';
import {installStoryPolicy} from './story-policy.js';
import {installStoryTutorials} from './story-tutorials.js';
import {mountClient} from './presentation.js';

// Bootstrap owns replaceConfiguration; this adapter only receives public updates.
export async function mountStoryBrowser(transport,{replaceConfiguration,selectMode,availableModes,initialMode,initialConfiguration,localResume=[],onError,onPublicUpdate,additionalBlocked}){
 const localSlots=new Set(localResume);const tutorials=installStoryTutorials(),modePlayback=new Map();let playback={pending:null},currentMode=initialMode||(initialConfiguration?.story?'story':'single'),restoring=false;let storySessionIdentity=null,accountContinuation=false,refreshedResult=null;let renderer,policy,active={size:15,story:false,battle:0},replacement=Promise.resolve(),latestReplacement=Promise.resolve(),busy=false,paused=false,lastSnapshot=null;
 // Battle numbers are room-local. Never share playback/terminal cursors across seats or rooms.
 const scope=(mode,u)=>mode==='multiplayer'?JSON.stringify([mode,u.lan.code,u.lan.self,u.lan.recoveryBattle||u.snapshot.battle]):mode;let playbackKey=currentMode;
 const status=text=>{document.getElementById('status').textContent=text;};
 async function replace(next){
  busy=true;
  try{await replaceConfiguration(next);modePlayback.set(playbackKey,playback);currentMode=next.story?'story':'single';playbackKey=currentMode;playback={pending:null};callbacks.playback=playback;paused=false;accountContinuation=false;refreshedResult=null;active=structuredClone(next);localSlots.add(next.story?'story':'single');if(next.story)storySessionIdentity=window.__stoneThrowStoryAccount?.().playerId||null;playback.pending=null;playback.startedAt=null;playback.endedAt=null;tutorials.reset(active);if(renderer)renderer.unmount();renderer=await mountClient(transport,callbacks);policy?.syncLayout();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}
  finally{busy=false;const shots=document.getElementById('shotsLeft');shots.textContent=shots.textContent;}
 }
 async function resumeMode(mode){if(busy||window.__stoneThrowViewState?.().inputLocked)return false;busy=true;try{const result=await selectMode?.(mode);if(!result?.available){localSlots.delete(mode);return false;}return await mountOpened(result,mode);}finally{restoring=false;busy=false;}}
 async function mountOpened(result,mode,fresh=false){renderer?.unmount();modePlayback.set(playbackKey,playback);currentMode=mode;playbackKey=scope(mode,result.update);playback=fresh?{pending:null}:modePlayback.get(playbackKey)||{pending:null};callbacks.playback=playback;active=structuredClone(result.configuration);accountContinuation=false;if(active.story){storySessionIdentity=window.__stoneThrowStoryAccount?.().playerId||null;if(result.storyContext)window.__stoneThrowRestoreStoryContinuationContext?.(result.storyContext);}policy.restoreConfiguration(active);paused=false;tutorials.reset(active);restoring=true;let first=true;const resumedTransport={...transport,read:after=>{if(first){first=false;return Promise.resolve({...result.update,presentation:[]});}return transport.read(after);}};renderer=await mountClient(resumedTransport,callbacks);policy.syncLayout();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return true;}

 const schedule=next=>{const task=replacement.then(()=>replace(next));latestReplacement=task;replacement=task.catch(error=>{console.error('Story battle replacement failed',error);});return task;};
 const callbacks={onError,playback,externalSession:true,inputLocked:()=>busy||tutorials.open(),blocked:()=>busy||paused||tutorials.open()||additionalBlocked?.(),configuration:()=>active,
  reset:()=>window.__stoneThrowResetFullGame(),playAgain:()=>resultButtonClick(),
  async onUpdate(update,view){
   if(currentMode==='multiplayer'&&update.lan)playbackKey=scope(currentMode,update);
   if(currentMode!=='multiplayer'){if(update.snapshot.phase==='finished')localSlots.delete(currentMode);else if(active.story||update.snapshot.phase!=='placement'||update.snapshot.owned.length)localSlots.add(currentMode);}onPublicUpdate?.(update);lastSnapshot=update.snapshot;policy.observePhase(view.phase);if(restoring)return;await tutorials.wait();
   for(const event of update.events){if(event.kind!=='impact'||!event.cell)continue;
    const same=c=>c.x===event.cell.x&&c.y===event.cell.y;
    const type=event.side==='self'?update.snapshot.owned.find(u=>u.cells.some(same))?.kind:update.snapshot.opponent.find(c=>same(c.cell))?.kind;
    if(type)await tutorials.show(type,event.side==='self'?'player':'enemy',event.cell.x+','+event.cell.y);
   }
  },
  afterRender(snapshot){if(!active.story&&currentMode==='single'&&snapshot.phase==='finished')document.getElementById('playAgainBtn').textContent='REMATCH';if(!active.story||snapshot.phase!=='finished')return;
   const draw=snapshot.outcome==='draw',win=snapshot.outcome==='win',button=document.getElementById('playAgainBtn'),retry=document.getElementById('storyRetryBtn');
   policy.recordResult({battle:active.battle,playerWon:draw?null:win});if(!snapshot.gaveUp&&!draw&&refreshedResult!==snapshot.battle){refreshedResult=snapshot.battle;void refreshAccountStory().catch(error=>status(error.message));}
   button.textContent=draw?'RETRY BATTLE':'CONTINUE STORY';retry.hidden=draw;button.dataset.storyBattle=String(active.battle);button.dataset.storyDraw=draw?'1':'0';if(!draw)button.dataset.storyWin=win?'1':'0';
   if(window.__stoneThrowIsFinalStoryBattle?.(active.battle)&&(draw||!win)){button.dataset.storyGiveUp='1';button.textContent='MAIN MENU';retry.hidden=false;document.getElementById('resultSubtitle').textContent='The final battle must be won. Retry it or return to the main menu.';}
   if(snapshot.gaveUp){policy.clearResult();document.getElementById('resultTitle').textContent='You gave up.';button.dataset.storyGiveUp='1';button.dataset.storyDraw='0';button.textContent='MAIN MENU';retry.hidden=false;document.getElementById('resultSubtitle').textContent='Retry this battle or return to the main menu.';document.getElementById('resultCloseBtn').style.display='none';}
   document.getElementById('stLocalResultMenu').hidden=button.textContent==='MAIN MENU';
  }
 };
 policy=installStoryPolicy({window,document,getComputedStyle,requestAnimationFrame,cancelAnimationFrame,configure:schedule,restorePopupPreference:()=>tutorials.restorePreference(),status});
 if(initialConfiguration)policy.restoreConfiguration(initialConfiguration);active=policy.configuration();tutorials.reset(active);
 function playAgain(){const view=window.__stoneThrowViewState();if(view.phase!=='over')return false;const result=policy.result();
  if(active.story&&window.__stoneThrowIsFinalStoryBattle?.(result.battle||active.battle)&&result.playerWon!==true){schedule(active);tutorials.restorePreference();status(`Story Battle ${active.battle}: place your forces.`);return true;}
  if(active.story&&typeof window.__stoneThrowContinueStory==='function'){window.__stoneThrowContinueStory({battle:result.battle||active.battle,playerWon:result.playerWon??result.lastPlayerWon});return true;}
  schedule(active);return true;
 }
 window.__stoneThrowPlayAgain=playAgain;
 window.__stoneThrowPresentationReady=()=>latestReplacement;window.__stoneThrowPauseActiveGameForMenu=()=>{const view=window.__stoneThrowViewState?.();if(!view){paused=true;return true;}if(busy||view.inputLocked)return false;paused=true;return true;};
 window.__stoneThrowResumeActiveGameFromMenu=()=>resumeMode('single');
 window.__stoneThrowHasLocalStorySession=()=>localSlots.has('story');
 window.__stoneThrowHasStorySession=()=>localSlots.has('story')||!!window.__stoneThrowStoryAccount?.().progress;
 window.__stoneThrowSelectMultiplayer=()=>resumeMode('multiplayer');
 window.__stoneThrowGiveUp=async()=>{const view=window.__stoneThrowViewState();if(['place','ready','over'].includes(view.phase))return false;const s=(await transport.read()).snapshot;const update=await transport.dispatch({contract:s.contract,battle:s.battle,revision:s.revision,intent:{kind:'give-up'}});if(update.accepted){tutorials.reset(active);await renderer.apply(update);}return update.accepted;};
 function resultButtonClick(){
  if(!active.story){schedule(active);return;}
  const button=document.getElementById('playAgainBtn');document.getElementById('resultOverlay').style.display='none';
  if(button.dataset.storyGiveUp==='1'){button.dataset.storyGiveUp='0';window.__stoneThrowOpenMainMenu?.();return;}
  if(button.dataset.storyDraw==='1'){button.dataset.storyDraw='0';schedule(active);return;}
  const result=policy.result();if(typeof window.__stoneThrowContinueStory==='function')window.__stoneThrowContinueStory({battle:Number(button.dataset.storyBattle)||result.battle||active.battle,playerWon:button.dataset.storyWin?button.dataset.storyWin==='1':(result.playerWon??result.lastPlayerWon)});else window.__stoneThrowOpenMainMenu?.();
 }
 window.__stoneThrowAbortBattleAsync=()=>{paused=true;playback.pending=null;tutorials.reset(active);renderer?.unmount();return true;};
 window.__stoneThrowStoryPlagueTargets=()=>lastSnapshot?.storyPlagueTargets?.map(s=>s==='self'?'player':'enemy')||[];
 window.__stoneThrowStoryRuntimeState=()=>{const view=window.__stoneThrowViewState?.()||{phase:accountContinuation?'over':'place',shotsLeft:0,inputLocked:busy};return {active:active.story,battle:active.battle,phase:view.phase,playerShotsLeft:view.shotsLeft,busy:busy||view.inputLocked};};
 window.__stoneThrowPauseStoryForMenu=()=>{const view=window.__stoneThrowViewState?.();if(!view){paused=true;return true;}if(!active.story||view.phase==='over'||busy||view.inputLocked)return false;paused=true;return true;};
 window.__stoneThrowResumeStoryRuntime=async()=>{
 if(await resumeMode('story'))return true;
 const account=window.__stoneThrowStoryAccount?.();
 if(account?.playerId){
  const saved=await window.__stoneThrowLoadAccountStory();if(!saved)return false;
  accountContinuation=true;window.__stoneThrowAbortBattleAsync?.('account-story-continue');policy.restoreConfiguration(saved.configuration);active=structuredClone(saved.configuration);storySessionIdentity=account.playerId;window.__stoneThrowRestoreStoryContinuationContext?.(saved.context);
  lastSnapshot={storyPlagueTargets:saved.plagueTargets.map(s=>s==='player'?'self':'opponent')};policy.recordResult({battle:saved.battle,playerWon:saved.playerWon});policy.observePhase('over');
  window.__stoneThrowContinueStory({battle:saved.battle,playerWon:saved.playerWon});return 'account-continuation';
 }
 return false;
 };
 document.getElementById('storyRetryBtn').addEventListener('click',()=>{if(!active.story)return;document.getElementById('resultOverlay').style.display='none';policy.clearResult();schedule(active);tutorials.restorePreference();status(`Story Battle ${active.battle}: place your forces.`);});
 restoring=true;let firstRead=true;const initialTransport=restoring?{...transport,read:async after=>{const update=await transport.read(after);if(!firstRead)return update;firstRead=false;return {...update,presentation:[],restored:true};}}:transport;renderer=await mountClient(initialTransport,callbacks);restoring=false;if(initialMode!=='multiplayer')paused=true;policy.syncLayout();window.dispatchEvent(new Event('stone-throw-story-account-progress'));
 return Object.freeze({enterLocal:async result=>{try{return await mountOpened(result,'single',true);}finally{restoring=false;}},enterOpened:async result=>{busy=true;try{if(!result.update?.lan){/* Menu navigation must not replay a saved local result or suspended action. */paused=true;renderer?.unmount();renderer=null;tutorials.reset(active);document.getElementById('resultOverlay').style.display='none';return true;}return await mountOpened(result,result.update?.lan?'multiplayer':result.configuration.story?'story':'single');}finally{restoring=false;busy=false;}},apply:update=>renderer?.apply(update),ready:()=>replacement,remount:async()=>{renderer?.unmount();renderer=await mountClient(transport,callbacks);policy.syncLayout();},unmount:()=>renderer?.unmount()});
}
