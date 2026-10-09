import {mountCombatPlayback} from './combat-playback.js';
import {logEvent} from './game-log.js';
import {publicPlaybackAudio} from './public-playback-audio.js';
export function playbackBatch(timeline,index){const first=timeline[index];if(!first)return [];const result=[{event:first,index:index+1}];if(first.animation)for(let i=index+1;i<timeline.length;i++){const e=timeline[i];if(!e.animation||e.animation.group!==first.animation.group||e.animation.kind!==first.animation.kind||(first.animation.kind!=='revolt'&&(e.board!==first.board||e.actor!==first.actor)))break;result.push({event:e,index:i+1});}return result;}
export function publicPlayback({grid,paint,size,identity,onEffectFailure=()=>{}}){
 let animation=null,epoch=0,muted=true;const sound=publicPlaybackAudio();
 if(!document.querySelector('link[data-public-effects]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/client-v13/public-playback-effects.css';css.dataset.publicEffects='1';document.head.append(css);}
 function cancel(){sound.stop();epoch++;animation?.unmount();animation=null;}
 async function play(batch,{partial=false}={}){
  const token=epoch,first=batch[0]?.event;if(!first)return;const target=grid(first.board),owner=grid(first.actor)||target;
  const active=()=>epoch===token;const paintOne=async row=>{if(!active())return;paint(row.index);if(!muted&&['hit','miss'].includes(row.event.observation))sound.beep(row.event.observation==='hit');};
  const cue=first.animation;
  if(!cue||!target||!owner||partial||(!cue.origin&&!['enemy-shot','plague','assassin','catapult','revolt'].includes(cue.kind))){for(const row of batch){if(!active())return;await paintOne(row);await new Promise(r=>setTimeout(r,row.event.cells?.length?180:60));}return;}
  const resolve=id=>id.startsWith('stPublicGrid:')?grid(Number(id.split(':')[1])):id==='stEffectRoot'?owner.closest('.cs-spectator')||owner.closest('.cs-replay'):id==='playerGrid'?owner:id==='enemyGrid'?target:id==='stPlayerGridHost'?owner.parentElement:id==='stEnemyGridHost'?target.parentElement:null;

  let last=-1;const frames=batch.flatMap(row=>(row.event.cells||[]).map(cell=>({index:row.index,event:row.event,animation:{...row.event.animation,kind:cue.kind==='enemy-shot'?'assassin':cue.kind,side:'opponent',targetSeat:row.event.board,ownerSide:'self',origin:cue.origin||cell,cell,group:cue.group},snapshot:{size,battle:identity,revision:0,eventPosition:row.index,owned:[],opponent:[],strips:{self:{},opponent:{}},demonRunes:[]},events:[],soundEvents:[]})));
  // Old archives lack reserved decorative rune choices. Use a fixed public
  // cross decoration; never use gameplay RNG or invent attack targets.
  if(cue.kind==='demon'&&cue.origin){const runes=[];for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(x===cue.origin.x||y===cue.origin.y)runes.push({cell:{x,y},glyph:'\u16de',rotation:0});for(const f of frames)f.animation.runes=runes;}
  if(!muted)sound.effect(cue.kind==='enemy-shot'?'stone':cue.kind);
  const update=async f=>{if(active()&&f.index>last){last=f.index;await paintOne({index:f.index,event:f.event});}};
  try{animation=mountCombatPlayback(resolve);await animation.play(frames,update,async()=>{});if(active()&&batch.at(-1).index>last)await paintOne(batch.at(-1));}catch(error){if(active()){animation?.unmount();animation=null;logEvent('OBSERVER ANIMATION FAILURE',{kind:cue.kind,message:String(error?.message||error).slice(0,240)});onEffectFailure();for(const row of batch){if(!active())return;if(row.index>last){await paintOne(row);await new Promise(r=>setTimeout(r,180));}}}}finally{if(active()){animation?.unmount();animation=null;}}
 }
 return {play,cancel,setSound(on){muted=!on;if(on)sound.activate();},close(){cancel();sound.close();}};
}
