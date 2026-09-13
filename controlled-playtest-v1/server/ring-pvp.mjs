import {exportRooms,restoreRooms} from './room-recovery.mjs';
import {randomBytes,randomInt} from 'node:crypto';
import {createHost} from '../canonical/compiled/host/initialization.js';
import {acceptCommand,pumpHost} from '../canonical/compiled/host/lifecycle.js';
import {normalTarget} from '../canonical/compiled/host/ring.js';
import {refreshHost} from '../canonical/compiled/host/refresh.js';
import {serializeHost} from '../canonical/compiled/host/serialization.js';
import {legacyRandomPlacement} from '../canonical/compiled/policy/placement-legacy.js';
import {heroRelocation,heroLocalEscape} from '../canonical/compiled/policy/special-decisions.js';
import {parseKey,cellKey} from '../canonical/compiled/combat/access.js';
import {random} from '../canonical/compiled/combat/rng.js';
import {normalPolicy,emptyNormalMemory} from '../canonical/compiled/local-host/normal-policy.js';
import {refreshNormalMemory} from '../canonical/compiled/local-host/normal-step.js';
import {normalCatapultChoice} from '../canonical/compiled/local-host/normal-catapult.js';
import {normalExecution} from '../canonical/compiled/local-host/demon-entropy.js';
import {emptyStatistics,captureStatistics} from '../canonical/compiled/local-host/public-statistics.js';
import {projectSeat} from './projection.mjs';
import {neighbors8} from '../canonical/compiled/rules/coordinates.js';

export function createRingService(roster,{seed,onFailure}={}){
 const rooms=new Map(),tokens=new Map();
 const configuration={size:15,story:false,battle:0,player:{size:15,...roster},enemy:{size:15,...roster}};
 const label=v=>{if(typeof v!=='string'||!v.trim()||v.trim().length>24)throw Error('invalid-name');return v.trim();};
 const cmd=(r,c)=>{r.host=acceptCommand(r.host,{id:'ring-'+(++r.serial),...c},normalExecution(r.memory));};
 const order=r=>r.host.state.ring.order;
 const active=(r,i)=>order(r).includes(r.host.config.players[i].id);
 const mapHandle=(map,id,prefix)=>{if(!map.has(id))map.set(id,prefix+(map.size+1));return map.get(id);};
 function view(r,i,j){const h=r.host,ids=[h.config.players[i].id,h.config.players[j].id];
  const seats=ids.map(id=>h.state.seats.find(p=>p.playerId===id));
  const own={...seats[0]};{const k=h.state.ring.knowledge[ids[0]+':'+ids[1]];own.scouted=k?.scouted||[];own.monkCandidates=k?.monkCandidates||[];}
  return {...h,config:{...h.config,players:ids.map(id=>h.config.players.find(p=>p.id===id))},state:{...h.state,seats:[own,seats[1]]}};
 }
 function target(r,i){const h=r.host,p=h.config.players[i],d=h.pendingRoot?.decisions.find(d=>d.status==='pending'&&d.actorId===p.id);
  if(d&&d.boardId!==p.boardId)return h.config.players.findIndex(p=>p.boardId===d.boardId);
  if(active(r,i)&&order(r).length>1)return h.config.players.findIndex(q=>q.id===normalTarget(h.state,p.id).playerId);
  return h.config.players.findIndex((q,j)=>j!==i&&order(r).includes(q.id));
 }
 function sample(r){for(let i=0;i<r.seats.length;i++)for(let j=0;j<r.seats.length;j++)if(i!==j&&active(r,i)&&active(r,j))captureStatistics(view(r,i,j),r.statistics[i][j]);}
 function place(r,i,intent){const p=r.host.config.players[i];const apply=(unitId,type,cells)=>cmd(r,{kind:'place',placement:{unitId,ownerId:p.id,boardId:p.boardId,type,cells}});
  function rebuild(keep){const rng=structuredClone(r.host.rng),c=r.host.config;r.host=createHost(c);for(const placement of keep)cmd(r,{kind:'place',placement});r.host.rng=rng;refreshHost(r.host);}
  if(intent.kind==='place')apply('ring-unit-'+(++r.serial),intent.unit,intent.cells);
  else if(intent.kind==='random-placement'){rebuild(r.host.placements.filter(u=>u.ownerId!==p.id));for(const u of legacyRandomPlacement(i?'second-seat':'first-seat',15,roster,r.host.rng,false))apply('ring-unit-'+(++r.serial),u.type,u.cells.map(parseKey));}
  else{const uid=[...r.handles[i]].find(([,v])=>v===intent.unit)?.[0],u=r.host.placements.find(u=>u.unitId===uid&&u.ownerId===p.id);if(!u)throw Error('wrong-seat');rebuild(r.host.placements.filter(p=>p.unitId!==uid));if(intent.kind==='move')apply(u.unitId,u.type,intent.cells);}
 }
 function reset(r){const n=r.seats.length;r.host=createHost({matchId:'ring-private',rulesVersion:'stone-throw-v1.427',size:15,story:false,seed:seed??randomInt(0,0x100000000),players:r.seats.map((s,i)=>({id:'seat-'+i,boardId:'board-'+i,roster,decisionMode:'interactive'}))});r.epoch++;r.revision=0;r.serial=0;r.ready=Array(n).fill(false);r.rematch=r.seats.map(s=>s.controller==='ai');r.memory=emptyNormalMemory();r.aiMemory={};r.statistics=Array.from({length:n},()=>Array.from({length:n},emptyStatistics));r.handles=Array.from({length:n},()=>new Map());r.choices=Array.from({length:n},()=>new Map());
  for(let i=0;i<n;i++)if(r.seats[i].controller==='ai'){place(r,i,{kind:'random-placement'});r.ready[i]=true;}
 }
 function aiStep(r,i){const h=r.host,owner=h.config.players[i],d=h.pendingRoot?.decisions.find(d=>d.status==='pending'),j=d&&d.boardId!==owner.boardId?h.config.players.findIndex(p=>p.boardId===d.boardId):h.config.players.findIndex(p=>p.id===normalTarget(h.state,owner.id).playerId);
  // The accepted normal AI expects target first and AI owner second. Only its read context changes.
  const v={...h,config:{...h.config,players:[h.config.players[j],owner]},state:{...h.state,seats:[h.state.seats[j],h.state.seats[i]]}};
  const memory=r.aiMemory[i+':'+j]??=emptyNormalMemory();
  const aiSeat={...v.state.seats[1]},targetId=h.config.players[j].id;
  {const known=h.state.ring.knowledge[owner.id+':'+targetId];aiSeat.scouted=known?.scouted||[];aiSeat.monkCandidates=known?.monkCandidates||[];}v.state={...v.state,seats:[v.state.seats[0],aiSeat]};
  let hunt=[...memory.heroHunt];for(const {event:e}of h.events.slice(memory.eventCursor)){if(e.kind==='impact'&&e.meta?.targetPlayerId===targetId&&e.unitId&&e.cells[0]){const hero=h.state.match.units.find(u=>u.id===e.unitId);if(hero?.hero?.hitsTaken===2)hunt=neighbors8({size:h.config.size},e.cells[0].x,e.cells[0].y).filter(k=>!h.state.seats[j].shots.includes(k));}}
  v.brains=h.brains.map(b=>b.playerId===owner.id?{...b,heroHunt:hunt}:b);refreshNormalMemory(v,memory);const policy=normalPolicy(v,memory);
  if(!d){const k=policy.target(h.state.plagues.some(p=>p.targetPlayerId===h.config.players[j].id));if(k)cmd(r,{kind:'shoot',actorId:owner.id,boardId:h.config.players[j].boardId,cell:parseKey(k)});else{h.turnStep='plague';h.status='running';pumpHost(h,100000,normalExecution(r.memory));}return;}
  let cell=null,unitId=null;
  if(d.kind==='resurrection')unitId=d.legalUnitIds[Math.floor(random(h.rng,'resurrection')*d.legalUnitIds.length)];
  else if(d.kind==='hero-relocation'){const local=h.state.match.units.find(u=>u.id===d.unitId)?.hero?.hitsTaken===2,k=local?heroLocalEscape(h,owner.id,d.legalCells.map(cellKey)):heroRelocation(h,owner.id);cell=k?parseKey(k):null;}
  else if(d.kind==='scout'){if(!memory.scoutQueue.length)memory.scoutQueue=policy.scout(d.remaining);const k=memory.scoutQueue.shift();cell=k?parseKey(k):null;}
  else if(d.kind==='catapult-target'){const k=normalCatapultChoice(v,memory);cell=k?parseKey(k):null;}
  else if(d.kind==='catapult-roll'){const k=policy.roll(d.legalCells.map(cellKey),true);cell=k?parseKey(k):null;}
  else throw Error('Unsupported AI decision '+d.kind);
  cmd(r,{kind:'answer',answer:{actorId:owner.id,decisionId:d.id,cell,unitId}});
 }
 function drain(r){for(let step=0;step<10000;step++){const h=r.host;if(h.status==='awaiting-turn'){cmd(r,{kind:'advance-turn'});continue;}const d=h.pendingRoot?.decisions.find(d=>d.status==='pending'),actor=d?.actorId||h.activePlayerId,i=h.config.players.findIndex(p=>p.id===actor);
   if(['awaiting-command','awaiting-decision'].includes(h.status)&&i>=0&&r.seats[i].controller==='ai'){aiStep(r,i);continue;}if(h.status==='running')throw Error('Unresolved host');sample(r);return;
  }throw Error('AI progress bound exceeded');
 }
 async function read(r,i,after=0){const h=r.host,p=h.config.players[i],j=target(r,i),visibleSelf=active(r,i),visibleTarget=j>=0&&active(r,j);const focus=j>=0?j:(i+1)%r.seats.length,v=view(r,i,focus),boards=new Set([...(visibleSelf?[p.boardId]:[]),...(visibleTarget?[h.config.players[focus].boardId]:[])]);
  for(const u of h.state.match.units.filter(u=>u.ownerId===p.id))mapHandle(r.handles[i],u.id,`own-${r.epoch}-${i}-`);
  for(const d of h.pendingRoot?.decisions.filter(d=>d.actorId===p.id)||[])mapHandle(r.choices[i],d.id,`choice-${r.epoch}-${i}-`);
  const ownKnowledge=h.state.match.knowledge[p.id],events=ownKnowledge.events.filter(e=>boards.has(e.boardId)).map((e,k)=>({...e,sequence:k+1}));
  v.state={...v.state,match:{...h.state.match,knowledge:{...h.state.match.knowledge,[p.id]:{...ownKnowledge,events}}}};v.events=h.events.filter(e=>!e.event.meta||boards.has(e.event.meta.targetBoardId));
  const memory={...r.memory,resultMessage:null,demonRunes:(r.memory.demonRunes||[]).filter(b=>boards.has(b.boardId))};
  const update=projectSeat(v,memory,r.statistics[i][focus],r.epoch,r.revision,r.handles[i],r.choices[i],Math.min(after,events.length));
  const s=update.snapshot;s.lossReveal=[];s.battle+=`-focus-${focus}`;if(h.status==='placement')for(const row of Object.values(s.strips.opponent))Object.assign(row,{placed:0,destroyed:0,heroHits:0});
  if(!visibleSelf){s.owned=[];s.ownImpacts=[];s.choice=null;s.shotsLeft=0;s.rosters.self={};s.strips.self={};s.phase='finished';s.outcome=h.state.match.outcome.kind==='draw'?'draw':'loss';}
  if(!visibleTarget){s.opponent=[];s.rosters.opponent={};s.strips.opponent={};s.monkClues=[];s.aimAssistCells=[];s.enemyResurrection={active:false,cells:[]};}
  update.lan={code:r.code,self:i,names:r.seats.map(s=>s.name),ready:[...r.ready],rematch:[...r.rematch],connected:r.seats.map(s=>s.controller==='ai'||!!s.token&&!s.left&&Date.now()-s.seen<7000),closed:r.closed,waiting:!!h.pendingRoot?.decisions.some(d=>d.status==='pending'&&d.actorId!==p.id),controllers:r.seats.map(s=>s.controller),ring:h.status==='placement'?[]:order(r).map(id=>h.config.players.findIndex(p=>p.id===id)),eliminated:h.state.ring.eliminated.map(id=>h.config.players.findIndex(p=>p.id===id)),target:h.status!=='placement'&&visibleTarget?focus:null,complete:h.status==='complete',ownBoardVisible:visibleSelf,targetBoardVisible:visibleTarget};return update;
 }
 async function dispatch(r,i,request){const current=await read(r,i),deny=error=>({...current,accepted:false,error,events:[],presentation:[]});if(!request||Object.keys(request).sort().join(',')!=='battle,contract,intent,revision')return deny('unsupported');if(request.contract!==current.snapshot.contract||request.battle!==current.snapshot.battle||request.revision!==r.revision)return deny('stale');
  const intent=request.intent,fields={place:['unit','cells'],move:['unit','cells'],remove:['unit'],'random-placement':[],start:[],shoot:['cell'],answer:['choice','cell','unit']};if(!intent||!fields[intent.kind]||Object.keys(intent).sort().join(',')!==['kind',...fields[intent.kind]].sort().join(','))return deny('unsupported');if(r.closed||!active(r,i)||r.seats[i].controller!=='human')return deny('illegal');
  const before={host:structuredClone(r.host),memory:structuredClone(r.memory),statistics:structuredClone(r.statistics),aiMemory:structuredClone(r.aiMemory),serial:r.serial,revision:r.revision,ready:[...r.ready]};
  try{const p=r.host.config.players[i];if(['place','move','remove','random-placement'].includes(intent.kind)){if(r.host.status!=='placement'||r.ready[i])throw Error('placement-locked');place(r,i,intent);}
   else if(intent.kind==='start'){if(r.host.status!=='placement'||r.ready[i])throw Error('placement-locked');for(const[k,n]of Object.entries(roster))if(r.host.placements.filter(u=>u.ownerId===p.id&&u.type===k).length!==n)throw Error('incomplete');r.ready[i]=true;if(r.ready.every(Boolean)&&r.seats.every(s=>s.controller==='ai'||s.token)){cmd(r,{kind:'start'});drain(r);}}
   else if(intent.kind==='shoot'){if(r.host.activePlayerId!==p.id)throw Error('wrong-turn');cmd(r,{kind:'shoot',actorId:p.id,boardId:normalTarget(r.host.state,p.id).boardId,cell:intent.cell});drain(r);}
   else{const d=r.host.pendingRoot?.decisions.find(d=>d.status==='pending'&&d.actorId===p.id&&r.choices[i].get(d.id)===intent.choice);if(!d)throw Error('wrong-choice');const uid=intent.unit===null?null:[...r.handles[i]].find(([,v])=>v===intent.unit)?.[0];if(uid===undefined)throw Error('wrong-unit');cmd(r,{kind:'answer',answer:{actorId:p.id,decisionId:d.id,cell:intent.cell,unitId:uid}});drain(r);}
   sample(r);r.revision++;return read(r,i,current.snapshot.eventPosition);
  }catch(e){Object.assign(r,before);onFailure?.(e);return deny('illegal');}
 }
 const queue=(r,fn)=>{const t=r.queue.then(fn);r.queue=t.catch(()=>{});return t;};
 function seatToken(r,i,binding,name){const token=randomBytes(32).toString('hex');Object.assign(r.seats[i],{token,binding,name:label(name),seen:Date.now(),left:false});tokens.set(token,{r,i});return token;}
 return {rooms,
  exportState:()=>exportRooms(rooms),restoreState:saved=>restoreRooms(saved,rooms,tokens),
  async lobby(action,body,binding){if(!binding)throw Error('unknown-session');if(action==='make'){const n=body.seats;if(![3,4].includes(n)||!Array.isArray(body.controllers)||body.controllers.length!==n||body.controllers[0]!=='human'||body.controllers.some(v=>!['human','ai'].includes(v)))throw Error('invalid-configuration');const name=label(body.name),code=randomBytes(4).toString('hex').slice(0,6).toUpperCase(),r={code,seats:body.controllers.map((controller,i)=>({controller,name:controller==='ai'?'AI '+(i+1):null,token:null,binding:null,seen:0,left:false})),queue:Promise.resolve(),epoch:0,closed:false};reset(r);const token=seatToken(r,0,binding,name);rooms.set(code,r);return {token,configuration,update:await read(r,0)};}
   const r=rooms.get(String(body.code||'').trim().toUpperCase());if(!r||r.closed)throw Error('bad-game-code');return queue(r,async()=>{if(r.seats.some(s=>s.binding===binding))throw Error('already-seated');const i=r.seats.findIndex(s=>s.controller==='human'&&!s.token);if(i<0)throw Error('game-full');const token=seatToken(r,i,binding,body.name);r.revision++;return {token,configuration,update:await read(r,i)};});
  },
  async route(token,binding,action,body={}){const e=tokens.get(token);if(!e||e.r.seats[e.i].binding!==binding||e.r.seats[e.i].left)throw Error('unknown-seat');const{r,i}=e;return queue(r,async()=>{r.seats[i].seen=Date.now();if(action==='open')return{configuration,reconnected:true,development:false,update:await read(r,i)};if(action==='read'){if(Object.keys(body).some(k=>k!=='after')||!Number.isSafeInteger(body.after??0)||(body.after??0)<0)throw Error('invalid-cursor');return read(r,i,body.after??0);}if(action==='command')return dispatch(r,i,body);if(action==='rematch'){if(r.host.status!=='complete'||r.closed)throw Error('not-complete');r.rematch[i]=true;if(r.rematch.every(Boolean))reset(r);return read(r,i);}if(action==='leave'){r.closed=true;r.seats[i].left=true;return{left:true};}throw Error('unsupported');});},
  checkpoint:token=>{const e=tokens.get(token);if(!e)return null;const r=e.r;return JSON.stringify({host:serializeHost(r.host),memory:r.memory,aiMemory:r.aiMemory,statistics:r.statistics,ready:r.ready,epoch:r.epoch,revision:r.revision,serial:r.serial});}
 };
}
