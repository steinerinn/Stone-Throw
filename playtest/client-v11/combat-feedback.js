// Consumes only observer-safe snapshots. No host, command, or gameplay RNG access.
const names={inf:'Infantry',cav:'Cavalry',archer:'Archer',castle:'Castle',monk:'Monk',hero:'Hero',catapult:'Catapult',dwarf:'Dwarf',elf:'Scout',goblin:'Goblin',cleric:'Cleric',necro:'Necromancer',wizard:'Wizard',demon:'Demon',dragon:'Dragon'};
const same=(a,b)=>a.x===b.x&&a.y===b.y;
export function mountCombatFeedback(memory={}){
 let disposed=false,audio=null;const transient=new Set(),timers=new Set();
 const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(!disposed)fn();},ms);timers.add(id);};
 function beep(hit){if(document.getElementById('soundBtn')?.textContent.includes('OFF'))return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain(),dur=hit?.12:.08;o.type=hit?'square':'sine';o.frequency.value=hit?880:440;g.gain.setValueAtTime(hit?.08:.05,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+dur);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+dur);}catch{}}
 function render(){const list=document.getElementById('stEventList');if(!list)return;list.replaceChildren();for(const entry of memory.rows){const row=document.createElement('div');row.className=entry.major?'st-event st-event-major':'st-event';if(entry.opening)row.id='stBattleOpeningEvent';row.textContent=entry.text;list.append(row);}}
 function consume(update){const s=update.snapshot;if(memory.battle!==s.battle){memory.battle=s.battle;memory.position=0;memory.runes=0;memory.rows=[{opening:true,major:true,text:'Prepare your forces.'}];memory.started=false;}
  if(!memory.started&&s.phase!=='placement'){memory.started=true;memory.rows[0].text=s.active==='opponent'?'The enemy starts the battle.':'You start the battle.';}
  for(const e of update.events){if(e.position<=memory.position)continue;memory.position=e.position;
   const observed=e.cell&&(e.side==='self'?s.owned.find(u=>u.cells.some(c=>same(c,e.cell))):s.opponent.find(c=>same(c.cell,e.cell)));
   // In particular, never infer type from rosters, geometry, or a later private outcome.
   const label=observed?.kind?names[observed.kind]:'Unknown';let text;
   if(e.kind==='impact')text=(e.side==='self'?'The enemy hits your ':'You hit an enemy ')+(label==='Unknown'?'unidentified core unit':label)+'.';
   else if(e.kind==='miss')text=e.side==='self'?'The enemy misses.':'You miss.';
   else if(e.kind==='resurrection-announced')text=e.side==='self'?'Your unit is resurrected.':'An enemy unit is resurrected.';
   else if(e.kind==='hero-moved')text=e.side==='self'?'Your Hero moves.':'The enemy Hero moves.';
   else if(e.kind==='plague-observed')text='Plague spreads.';
   if(text)memory.rows.push({text});
   if(e.cell&&['impact','miss','unit-disclosed'].includes(e.kind)){const grid=document.getElementById(e.side==='self'?'playerGrid':'enemyGrid'),cell=grid?.children[e.cell.y*s.size+e.cell.x];if(cell)window.__stoneThrowCombatCallout?.(cell,{kind:e.kind==='unit-disclosed'?'scout':'target',text:e.kind==='miss'?'Miss':label});if(e.kind!=='unit-disclosed')beep(e.kind==='impact');}
  }
  for(const batch of s.demonRunes){if(batch.sequence<=memory.runes)continue;memory.runes=batch.sequence;for(const rune of batch.runes){const cell=document.getElementById(batch.side==='self'?'playerGrid':'enemyGrid')?.children[rune.cell.y*s.size+rune.cell.x];if(!cell)continue;const rect=cell.getBoundingClientRect(),el=document.createElement('div');el.className='demon-rune';el.textContent=rune.glyph;el.style.left=(rect.left+rect.width/2)+'px';el.style.top=(rect.top+rect.height/2)+'px';el.style.rotate=rune.rotation+'deg';document.body.append(el);transient.add(el);later(()=>{el.remove();transient.delete(el);},900);}}
  render();
 }
 return {consume,unmount(){disposed=true;for(const id of timers)clearTimeout(id);for(const el of transient)el.remove();for(const el of document.querySelectorAll('.combat-float'))el.remove();void audio?.close().catch(()=>{});}};
}
