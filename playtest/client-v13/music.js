// Presentation only. Inputs are the painted public snapshot and visible menus.
// No host, intent, RNG, private board or persisted gameplay dependency.
export const MUSIC = Object.freeze({
  levels: {menu:.22,story:.12,battle:.16,epilogue:.23,victory:.24,defeat:.22,plague:.055,intensity:.035},
  narrationGain:.035, fadeMs:900, duckMs:180, releaseMs:1200, intensityMs:4500,
  files:{menu:'exploration',story:'rising-moon',battle:'eye-of-the-storm',epilogue:'aftermath',victory:'victory',defeat:'defeat',plague:'plague-eerie',intensity:'plague-dark'}
});
export function musicScene({menu,storyScene,phase,outcome,story=false}) {
  if(!menu&&phase==='placement')return 'battle';
  if(storyScene)return storyScene==='story_complete'?'epilogue':'story';
  if(menu||!phase||phase==='placement')return 'menu';
  if(phase==='finished')return outcome==='win'?'victory':outcome==='loss'?'defeat':null;
  return 'battle';
}
export function createMusicController({media=()=>new Audio(),context=()=>new (window.AudioContext||window.webkitAudioContext)(),now=()=>performance.now(),schedule=setTimeout,cancel=clearTimeout,userScale=id=>globalThis.window?.chainSiegeAudio?.scale(id==='plague'||id==='intensity'?'sfx':'music')??1}={}) {
  const tracks=new Map();let ctx=null,armed=false,muted=false,scene=null,speaking=false,plague=false,pulseUntil=0,pulseTimer=null,closed=false;
  function track(id){if(tracks.has(id))return tracks.get(id);const audio=media();audio.preload='none';audio.src='assets/audio/music/'+MUSIC.files[id]+'.mp3';audio.loop=!['victory','defeat'].includes(id);audio.volume=0;const t={audio,target:0,stopTimer:null,pending:false,ended:false,source:null,gain:null,userGain:null,nativeLevel:0};audio.addEventListener('ended',()=>{t.ended=true;});tracks.set(id,t);return t;}
  // Prime only a wanted track, once, without playing or seeking it. Story has
  // one predictable next track: battle music starts at deployment.
  function prime(id){const t=track(id);if(!t.primed){t.primed=true;t.audio.preload='auto';t.audio.load?.();}return t;}
  function category(t){return [...tracks].find(([,v])=>v===t)?.[0];}
  function applyUser(t){const scale=userScale(category(t));if(t.userGain)t.userGain.gain.setValueAtTime(scale,ctx.currentTime);else t.audio.volume=t.nativeLevel*scale;}
  function connect(t){if(!ctx||t.gain)return;try{t.source=ctx.createMediaElementSource(t.audio);t.gain=ctx.createGain();t.gain.gain.value=t.target;t.source.connect(t.gain);t.userGain=ctx.createGain();t.gain.connect(t.userGain);t.userGain.connect(ctx.destination);applyUser(t);if(t.stopTimer){cancel(t.stopTimer);t.stopTimer=null;}t.audio.volume=1;}catch{/* Native volume fallback if Web Audio is unavailable. */}}
  function start(t){if(!armed||muted||!t.target||t.pending||t.ended||!t.audio.paused)return;connect(t);t.pending=true;try{Promise.resolve(t.audio.play()).catch(()=>{}).finally(()=>{t.pending=false;if(closed||muted||!t.target)t.audio.pause();});}catch{t.pending=false;}}
  function level(t,value,ms){if(t.target===value){if(value)start(t);return;}t.target=value;if(t.stopTimer){cancel(t.stopTimer);t.stopTimer=null;}connect(t);if(t.gain){const p=t.gain.gain,time=ctx.currentTime;if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(time);else{p.cancelScheduledValues(time);p.setValueAtTime(p.value,time);}p.linearRampToValueAtTime(value,time+ms/1000);}else{
      const from=t.nativeLevel,at=now();const fade=()=>{const f=ms?Math.min(1,(now()-at)/ms):1;t.nativeLevel=from+(value-from)*f;applyUser(t);if(f<1)t.stopTimer=schedule(fade,25);else if(!value)t.audio.pause();};fade();
    }if(value)start(t);else if(t.gain)t.stopTimer=schedule(()=>{if(!t.target)t.audio.pause();},ms+30);}
  function sync(){if(closed)return;const wanted={};if(scene)wanted[scene]=speaking&&['story','epilogue'].includes(scene)?MUSIC.narrationGain:MUSIC.levels[scene];if(scene==='battle'&&plague){wanted.plague=MUSIC.levels.plague;if(now()<pulseUntil)wanted.intensity=MUSIC.levels.intensity;}for(const id of Object.keys(wanted))muted?track(id):prime(id);if(!muted&&scene==='story')prime('battle');for(const[id,t]of tracks){const value=muted?0:wanted[id]||0;level(t,value,muted?0:speaking?MUSIC.duckMs:MUSIC.releaseMs);}}
  return Object.freeze({
    select(next,{narrating=false,publicPlague=false}={}){if(next!==scene){const previous=scene;scene=next;if(previous&&tracks.has(previous)){const t=tracks.get(previous);level(t,0,MUSIC.fadeMs);}if(next&&tracks.has(next)&&['victory','defeat'].includes(next)){const t=tracks.get(next);t.audio.currentTime=0;t.ended=false;}}speaking=narrating;plague=publicPlague;sync();},
    preferences(){for(const t of tracks.values())applyUser(t);},
    pulse(){pulseUntil=now()+MUSIC.intensityMs;if(pulseTimer)cancel(pulseTimer);pulseTimer=schedule(sync,MUSIC.intensityMs+10);sync();},
    sound(on,update=true){muted=!on;for(const t of tracks.values()){t.audio.muted=muted;if(muted)t.audio.pause();}if(update)sync();},
    autoplay(){if(closed)return;armed=true;sync();},
    unlock(){if(closed)return;armed=true;try{ctx??=context();ctx?.resume()?.catch(()=>{});}catch{}for(const t of tracks.values())connect(t);sync();},
    dispose(){closed=true;if(pulseTimer)cancel(pulseTimer);for(const t of tracks.values()){if(t.stopTimer)cancel(t.stopTimer);t.audio.pause();t.source?.disconnect();t.gain?.disconnect();t.userGain?.disconnect();}ctx?.close()?.catch(()=>{});},
    // Public presentation diagnostics only, no gameplay data.
    inspect:()=>({scene,armed,muted,tracks:[...tracks].map(([id,t])=>({id,target:t.target,paused:t.audio.paused}))})
  });
}

let controller=null,publicState={phase:null,outcome:null,plague:false},battle=null,position=0;
let entered=typeof document==='undefined'||!document.getElementById('stStartup');
export function enterMusic(){entered=true;if(!window.chainSiegeAudio)controller?.sound(!document.getElementById('soundBtn')?.textContent.includes('OFF'),false);controller?.select('menu');controller?.unlock();}
function visibleScene(){if(!entered)return 'menu';const storyVisible=document.getElementById('stMenuDialog')?.classList.contains('open')||document.getElementById('stStoryPhaseOverlay')?.classList.contains('open');return musicScene({menu:document.body.classList.contains('st-main-menu-mode'),story:!!window.__stoneThrowViewState?.()?.storyMode,storyScene:storyVisible?document.documentElement.dataset.musicStoryScene:null,...publicState});}
function refresh(){if(!window.chainSiegeAudio)controller?.sound(!document.getElementById('soundBtn')?.textContent.includes('OFF'),false);controller?.select(visibleScene(),{narrating:document.documentElement.dataset.musicNarrating==='true',publicPlague:publicState.plague});}
export function musicPublicUpdate(update){const s=update.snapshot;if(!s)return;const identity=(s.groupRoom||'')+':'+s.battle;if(identity!==battle){battle=identity;position=0;}publicState={phase:s.phase,outcome:s.outcome,plague:s.plagueActive===true};const fresh=(update.events||[]).filter(e=>e.position>position);position=Math.max(position,s.eventPosition||0,...fresh.map(e=>e.position));refresh();if(!update.restored&&fresh.some(e=>e.source==='plague'))controller?.pulse();}
if(typeof document!=='undefined'){
  controller=createMusicController();window.chainSiegeAudio?.subscribe(()=>controller.preferences());
  const observer=new MutationObserver(()=>{refresh();if(entered&&document.documentElement.dataset.localHost==='connected')controller.autoplay();});
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-music-story-scene','data-music-narrating','data-local-host']});
  for(const id of ['stMenuDialog','stStoryPhaseOverlay']){const n=document.getElementById(id);if(n)observer.observe(n,{attributes:true,attributeFilter:['class']});}
  const sound=document.getElementById('soundBtn');if(sound)observer.observe(sound,{childList:true,characterData:true,subtree:true});
  const unlock=()=>{if(!entered)return;refresh();controller.unlock();};for(const event of ['click','pointerdown','pointerup','keydown','touchend'])window.addEventListener(event,unlock,{capture:true,passive:true});
  window.addEventListener('pagehide',()=>{controller.sound(false);});
  window.addEventListener('pageshow',()=>{if(window.chainSiegeAudio)controller.sound(true,false);refresh();if(entered&&document.documentElement.dataset.localHost==='connected')controller.autoplay();});refresh();if(entered&&document.documentElement.dataset.localHost==='connected')controller.autoplay();
}
