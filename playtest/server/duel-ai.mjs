import {areaScoutChoice} from '../canonical/compiled/policy/area-scout.js';
import {firstHeroRelocation} from '../canonical/compiled/policy/first-hero-relocation.js';
import {acceptCommand,pumpHost} from '../canonical/compiled/host/lifecycle.js';
import {heroRelocation,heroLocalEscape} from '../canonical/compiled/policy/special-decisions.js';
import {parseKey,cellKey} from '../canonical/compiled/combat/access.js';
import {random} from '../canonical/compiled/combat/rng.js';
import {normalPolicy,emptyNormalMemory} from '../canonical/compiled/local-host/normal-policy.js';
import {refreshNormalMemory} from '../canonical/compiled/local-host/normal-step.js';
import {normalCatapultChoice} from '../canonical/compiled/local-host/normal-catapult.js';
import {neighbors8} from '../canonical/compiled/rules/coordinates.js';
// Accepted multiplayer controller policy with the fixed opposing seat as target.
 export function duelAiStep(r,i,execution){const cmd=(r,c)=>{r.host=acceptCommand(r.host,{id:'lan-'+(++r.serial),...c},execution);};const h=r.host,owner=h.config.players[i],d=h.pendingRoot?.decisions.find(d=>d.status==='pending'),j=1-i;
  // The accepted normal AI expects target first and AI owner second. Only its read context changes.
  const v={...h,config:{...h.config,players:[h.config.players[j],owner]},state:{...h.state,seats:[h.state.seats[j],h.state.seats[i]]}};
  const memory=r.aiMemory[i+':'+j]??=emptyNormalMemory();
  const aiSeat={...v.state.seats[1]},targetId=h.config.players[j].id;
  let hunt=[...memory.heroHunt];for(const {event:e}of h.events.slice(memory.eventCursor)){if(e.kind==='impact'&&e.meta?.targetPlayerId===targetId&&e.unitId&&e.cells[0]){const hero=h.state.match.units.find(u=>u.id===e.unitId);if(hero?.hero?.hitsTaken===2)hunt=neighbors8({size:h.config.size},e.cells[0].x,e.cells[0].y).filter(k=>!h.state.seats[j].shots.includes(k));}}
  v.brains=h.brains.map(b=>b.playerId===owner.id?{...b,heroHunt:hunt}:b);refreshNormalMemory(v,memory);const policy=normalPolicy(v,memory);
  if(!d){const k=policy.target(h.state.plagues.some(p=>p.targetPlayerId===h.config.players[j].id));if(k)cmd(r,{kind:'shoot',actorId:owner.id,boardId:h.config.players[j].boardId,cell:parseKey(k)});else{h.turnStep='plague';h.status='running';pumpHost(h,100000,execution);}return;}
  let cell=null,unitId=null;
  if(d.kind==='resurrection')unitId=d.legalUnitIds[Math.floor(random(h.rng,'resurrection')*d.legalUnitIds.length)];
  else if(d.kind==='hero-relocation'){const local=h.state.match.units.find(u=>u.id===d.unitId)?.hero?.hitsTaken===2,k=local?heroLocalEscape(h,owner.id,d.legalCells.map(cellKey)):firstHeroRelocation(h,owner.id,d.legalCells.map(cellKey));cell=k?parseKey(k):null;}
  else if(d.kind==='scout'&&d.area){memory.scoutQueue=[];cell=areaScoutChoice(h,d.actorId,d.boardId,d.legalCells);}
  else if(d.kind==='scout'){if(!memory.scoutQueue.length)memory.scoutQueue=policy.scout(d.remaining);const k=memory.scoutQueue.shift();cell=k?parseKey(k):null;}
  else if(d.kind==='catapult-target'){const k=normalCatapultChoice(v,memory);cell=k?parseKey(k):null;}
  else if(d.kind==='catapult-roll'){const k=policy.roll(d.legalCells.map(cellKey),true);cell=k?parseKey(k):null;}
  else throw Error('Unsupported AI decision '+d.kind);
  cmd(r,{kind:'answer',answer:{actorId:owner.id,decisionId:d.id,cell,unitId}});
 }
