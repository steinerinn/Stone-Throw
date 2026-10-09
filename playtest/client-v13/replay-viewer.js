import {createReplayCursor} from './replay-state.js';
import {paintOverview} from './overview-board.js';
import {publicPlayback,playbackBatch} from './public-playback.js';
export function mountReplayViewer(container,initial,{live=false}={}){
 let replay=initial,cursor=createReplayCursor(replay),index=0,playing=false,disposed=false,generation=0,soundOn=false;
 const root=document.createElement('section');root.className='cs-replay';
 if(!document.querySelector('link[data-replay-cells]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/client-v13/replay-cells.css';css.dataset.replayCells='1';document.head.append(css);}
 const style=document.createElement('style');style.textContent=`.cs-replay{background:#10171b;color:#edce83;padding:18px;font:16px Georgia;max-width:1000px;margin:auto;border:1px solid #967943}.cs-replay h2{margin:0 0 8px}.cs-replay nav{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.cs-replay button{background:#23251f;color:#ffe3a0;border:1px solid #967943;padding:10px;cursor:pointer}.cs-replay input{width:100%}.cs-replay-boards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.cs-replay-board h3{margin:8px 0}.cs-playback-grid-host{position:relative;min-width:0;width:100%}.cs-replay-grid{width:100%;display:grid;border:3px double #b29964;aspect-ratio:1}.cs-replay-cell{position:relative;width:100%!important;height:100%!important;min-width:0;min-height:0;line-height:1;overflow:hidden;border:1px solid #303a3e;display:grid;place-items:center;font:clamp(9px,2vw,18px) Arial;color:#b3bfc9}.cs-replay-cell.plague{background:#61326f}.cs-replay-cell.lit{outline:2px solid #ffcf57;outline-offset:-2px}.cs-replay-grid .cell{background-size:100% 100%!important}.cs-replay-cell img{width:100%;height:100%;object-fit:contain}.cs-replay-status{min-height:26px}.cs-replay-board.eliminated h3{opacity:.6}@media(max-width:540px){.cs-replay{padding:10px}.cs-replay-boards{gap:8px}.cs-replay button{padding:8px;font-size:12px}.cs-replay-board h3{font-size:14px}}`;

 const title=document.createElement('h2');title.textContent=live?'LIVE BATTLE':'BATTLE REPLAY';
 const meta=document.createElement('p');meta.textContent=live?'Public battle events only. Hidden units and private decisions are never shown.':`${replay.format.toUpperCase()} · ${replay.mode} · ${new Date(replay.startedAt).toLocaleDateString()} · ${replay.coverage}`;
 const nav=document.createElement('nav'),slider=document.createElement('input');slider.type='range';slider.min=0;slider.max=cursor.length;slider.value=0;slider.setAttribute('aria-label','Replay timeline');
 const status=document.createElement('div');status.className='cs-replay-status';status.setAttribute('aria-live','polite');const boards=document.createElement('div');boards.className='cs-replay-boards';const cards=new Map();
 for(const p of replay.participants){const wrap=document.createElement('div'),name=document.createElement('h3'),host=document.createElement('div'),grid=document.createElement('div'),strip=document.createElement('div');wrap.className='cs-replay-board';wrap.dataset.seat=p.seat;grid.className='cs-replay-grid'+(live?' cs-spectator-grid':'');host.className='cs-playback-grid-host';host.append(grid);wrap.append(name,host);boards.append(wrap);cards.set(p.seat,{wrap,name,grid,strip});}
 let lastState;const seenAnimations=new Set();
 function show(value){if(disposed)return;const state=cursor.seek(value);lastState=state;index=state.index;slider.value=index;status.textContent=`${live?'Watching':index+' / '+cursor.length} · Round ${state.round??'—'} · Turn ${state.turn??'—'} · ${state.notice}`;
  for(const b of state.boards){const card=cards.get(b.seat),p=replay.participants.find(p=>p.seat===b.seat);card.wrap.classList.toggle('eliminated',b.eliminated);card.wrap.classList.toggle('current',b.seat===state.active);card.name.textContent=p.name+(p.ai?' (AI)':'')+(b.seat===state.active?' — CURRENT PLAYER':'')+(b.eliminated?' — ELIMINATED':'');
   paintOverview(card.grid,card.strip,{size:replay.size,cells:Object.values(b.cells).map(c=>({...c,cell:{x:c.x,y:c.y}})),roster:{},strip:{},plague:Object.values(b.cells).filter(c=>c.plague).map(c=>({x:c.x,y:c.y})),hero:b.hero||[]});card.grid.style.gridTemplateColumns=`repeat(${replay.size},minmax(0,1fr))`;card.grid.style.gridTemplateRows=`repeat(${replay.size},minmax(0,1fr))`;
   for(let y=0;y<replay.size;y++)for(let x=0;x<replay.size;x++){const cell=card.grid.children[y*replay.size+x];cell.classList.add('cs-replay-cell');cell.classList.toggle('lit',state.highlight.some(h=>h.board===b.seat&&h.x===x&&h.y===y));}
  }
 }
 root.append(style,title,meta,nav,...(live?[]:[slider]),status,boards);container.append(root);show(0);
 const playback=publicPlayback({grid:seat=>cards.get(seat)?.grid,paint:show,size:replay.size,identity:replay.matchId,onEffectFailure:()=>{root.dataset.effectFallback='true';note.textContent='An animation could not play. Recorded battle events continue without that effect.';}});
 const play=document.createElement('button');play.textContent='PLAY';play.setAttribute('aria-label',live?'Pause live playback':'Play replay');
 function pause(){generation++;playing=false;playback.cancel();play.textContent=live?'RESUME':'PLAY';play.setAttribute('aria-label',live?'Resume live playback':'Play replay');}
 async function run({resume=false}={}){if(disposed||playing)return;if(resume&&live)show(cursor.length);if(index===cursor.length&&!live){seenAnimations.clear();show(0);}playing=true;play.textContent='PAUSE';play.setAttribute('aria-label',live?'Pause live playback':'Pause replay');const token=++generation;
  try{while(!disposed&&playing&&generation===token&&index<cursor.length){const batch=playbackBatch(replay.timeline,index),group=batch[0]?.event.animation?.group,partial=group&&seenAnimations.has(group);if(group){seenAnimations.add(group);if(seenAnimations.size>512)seenAnimations.delete(seenAnimations.values().next().value);}await playback.play(batch,{partial:!!partial});}}
  catch(e){if(generation===token){pause();status.textContent='Playback paused: '+e.message;}}
  finally{if(generation===token&&!live){playing=false;play.textContent='PLAY';play.setAttribute('aria-label','Play replay');}}
 }
 play.onclick=()=>playing?pause():void run({resume:true});nav.append(play);
 const sound=document.createElement('button');sound.textContent='SOUND OFF';sound.setAttribute('aria-pressed','false');sound.onclick=()=>{soundOn=!soundOn;playback.setSound(soundOn);sound.textContent=soundOn?'SOUND ON':'SOUND OFF';sound.setAttribute('aria-pressed',String(soundOn));};nav.append(sound);
 function seek(value){pause();seenAnimations.clear();show(value);const group=replay.timeline[index-1]?.animation?.group;if(group)seenAnimations.add(group);}
 if(!live){for(const [label,value]of [['BEGINNING',()=>0],['PREVIOUS EVENT',()=>index-1],['NEXT EVENT',()=>index+1],['END',()=>cursor.length]]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>seek(value());nav.append(b);}slider.oninput=()=>seek(+slider.value);}
 const note=document.createElement('p');note.className='cs-playback-note';note.textContent='Player thinking time is skipped. Battle animation timing is preserved. Sound is optional. Older recordings without animation metadata use contact-by-contact playback.';root.append(note);
 function unmount(){if(disposed)return;pause();disposed=true;playback.close();observer.disconnect();document.removeEventListener('visibilitychange',visibility);root.remove();}
 const observer=new MutationObserver(()=>{if(!root.isConnected)unmount();});observer.observe(document.body,{childList:true,subtree:true});
 const visibility=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',visibility);
 if(live){show(cursor.length);playing=true;play.textContent='PAUSE';}
 return {seek,play:run,pause,unmount,get playing(){return playing;},get index(){return index;},
  async append(events,checkpoint,{reset=false}={}){if(disposed)return;const wasPlaying=playing;if(!wasPlaying&&!reset)return false;generation++;playback.cancel();playing=false;
   if(reset)seenAnimations.clear();const baseline=reset?checkpoint:{kind:'checkpoint',round:lastState.round,turn:lastState.turn,active:lastState.active,boards:lastState.boards.map(b=>({seat:b.seat,eliminated:b.eliminated,cells:Object.values(b.cells),hero:b.hero||[]}))};
   replay={...replay,timeline:[baseline,...(reset?[]:events)]};cursor=createReplayCursor(replay);slider.max=cursor.length;show(1);if(wasPlaying){await run();if(!disposed&&playing&&checkpoint)showCheckpoint(checkpoint);}return !wasPlaying||playing;
  }};
 function showCheckpoint(checkpoint){replay={...replay,timeline:[checkpoint]};cursor=createReplayCursor(replay);show(1);}
}
