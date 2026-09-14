import {roomPresentation} from './room-presentation.mjs';
import {exportRooms,restoreRooms} from './room-recovery.mjs';
import {projectSeat} from './projection.mjs';
import {randomBytes,randomInt} from 'node:crypto';
import {createHost} from '../canonical/compiled/host/initialization.js';
import {acceptCommand} from '../canonical/compiled/host/lifecycle.js';
import {serializeHost} from '../canonical/compiled/host/serialization.js';
import {refreshHost} from '../canonical/compiled/host/refresh.js';
import {createLocalAuthority} from '../canonical/compiled/local-host/authority.js';
import {emptyNormalMemory} from '../canonical/compiled/local-host/normal-policy.js';
import {emptyStatistics,captureStatistics} from '../canonical/compiled/local-host/public-statistics.js';
import {legacyRandomPlacement} from '../canonical/compiled/policy/placement-legacy.js';
import {parseKey} from '../canonical/compiled/combat/access.js';
export function createPvpService(roster,{seed}={}){
 const rooms=new Map(),tokens=new Map();const presentation=roomPresentation((r,i)=>read(r,i),(r,i)=>1-i);
 const config=()=>({matchId:'lan-private',rulesVersion:'stone-throw-v1.427',size:15,story:false,seed:seed??randomInt(0,0x100000000),players:[{id:'lan-a',boardId:'lan-board-a',roster,decisionMode:'interactive'},{id:'lan-b',boardId:'lan-board-b',roster,decisionMode:'interactive'}]});
 const publicConfig={size:15,story:false,battle:0,player:{size:15,...roster},enemy:{size:15,...roster}};
 function reset(r){r.host=createHost(config());r.epoch++;r.revision=0;r.serial=0;r.ready=[false,false];r.rematch=[false,false];r.memory=emptyNormalMemory();r.statistics=[emptyStatistics(),emptyStatistics()];r.handles=[new Map(),new Map()];r.choices=[new Map(),new Map()];}
 function perspective(r,i){const h={...r.host,config:{...r.host.config,players:[...r.host.config.players]},state:{...r.host.state,seats:[...r.host.state.seats]}};if(i){h.config.players.reverse();h.state.seats.reverse();}return h;}
 function sample(r){for(let i=0;i<2;i++)captureStatistics(perspective(r,i),r.statistics[i]);}
 function handle(map,id,prefix){if(!map.has(id))map.set(id,prefix+(map.size+1));return map.get(id);}
 function project(r,i,after=0){const h=perspective(r,i),own=h.config.players[0].id;for(const u of h.state.match.units.filter(u=>u.ownerId===own))handle(r.handles[i],u.id,`own-${r.epoch}-${i}-`);for(const d of h.pendingRoot?.decisions.filter(d=>d.actorId===own)||[])handle(r.choices[i],d.id,`choice-${r.epoch}-${i}-`);
  const memory={...r.memory,...(i?{resultMessage:null}:{})};const update=projectSeat(h,memory,r.statistics[i],r.epoch,r.revision,r.handles[i],r.choices[i],after);if(r.host.status==='placement')for(const row of Object.values(update.snapshot.strips.opponent)){row.placed=0;row.destroyed=0;row.heroHits=0;}return update;
 }
 const metadata=(r,i)=>({code:r.code,self:i,names:r.seats.map(s=>s?.name||null),ready:[...r.ready],rematch:[...r.rematch],connected:r.seats.map(s=>!!s&&!s.left&&Date.now()-s.seen<7000),closed:r.closed,waiting:!!r.host.pendingRoot?.decisions.some(d=>d.status==='pending'&&d.actorId!==r.host.config.players[i].id)});
 function read(r,i,after=0){return presentation.decorate(r,i,{...project(r,i,after),lan:metadata(r,i)},after);}
 function drain(r){for(let n=0;n<1000&&r.host.status==='awaiting-turn';n++)r.host=acceptCommand(r.host,{id:'lan-'+(++r.serial),kind:'advance-turn'},presentation.execution(r));if(r.host.status==='running')throw Error('Unresolved host');sample(r);}
 function placement(r,i,intent){const p=r.host.config.players[i];const apply=(unitId,type,cells)=>{r.host=acceptCommand(r.host,{id:'lan-'+(++r.serial),kind:'place',placement:{unitId,ownerId:p.id,boardId:p.boardId,type,cells}});};
  function rebuild(keep){const rng=structuredClone(r.host.rng),c=r.host.config;r.host=createHost(c);for(const u of keep)r.host=acceptCommand(r.host,{id:'lan-'+(++r.serial),kind:'place',placement:u});r.host.rng=rng;refreshHost(r.host);}
  if(intent.kind==='place')apply('lan-unit-'+(++r.serial),intent.unit,intent.cells);
  else if(intent.kind==='random-placement'){rebuild(r.host.placements.filter(u=>u.ownerId!==p.id));for(const u of legacyRandomPlacement(i?'second-seat':'first-seat',15,roster,r.host.rng,false))apply('lan-unit-'+(++r.serial),u.type,u.cells.map(parseKey));}
  else {const uid=[...r.handles[i]].find(([,h])=>h===intent.unit)?.[0],u=r.host.placements.find(u=>u.unitId===uid&&u.ownerId===p.id);if(!u)throw Error('wrong-seat');rebuild(r.host.placements.filter(p=>p.unitId!==uid));if(intent.kind==='move')apply(u.unitId,u.type,intent.cells);}
 }
 async function dispatch(r,i,request){const current=await read(r,i);const deny=error=>({...current,accepted:false,error,events:[],presentation:[]});if(!request||Object.keys(request).sort().join(',')!=='battle,contract,intent,revision')return deny('unsupported');if(request.contract!==current.snapshot.contract||request.battle!==current.snapshot.battle||request.revision!==r.revision)return deny('stale');
  const fields={place:['unit','cells'],move:['unit','cells'],remove:['unit'],'random-placement':[],start:[],shoot:['cell'],answer:['choice','cell','unit'],'give-up':[]},intent=request.intent;if(!intent||!fields[intent.kind]||Object.keys(intent).sort().join(',')!==['kind',...fields[intent.kind]].sort().join(','))return deny('unsupported');if(r.closed)return deny('illegal');
  const before={presentation:structuredClone(r.presentation),host:structuredClone(r.host),memory:structuredClone(r.memory),statistics:structuredClone(r.statistics),serial:r.serial,ready:[...r.ready]};presentation.begin(r);try{const actor=r.host.config.players[i];
   if(['place','remove','move','random-placement'].includes(intent.kind)){if(r.host.status!=='placement'||r.ready[i])throw Error('placement-locked');placement(r,i,intent);}
   else if(intent.kind==='start'){if(r.host.status!=='placement'||r.ready[i])throw Error('not-placement');for(const[k,n]of Object.entries(roster))if(r.host.placements.filter(u=>u.ownerId===actor.id&&u.type===k).length!==n)throw Error('army-incomplete');r.ready[i]=true;if(r.ready.every(Boolean)){r.host=acceptCommand(r.host,{id:'lan-'+(++r.serial),kind:'start'},presentation.execution(r));drain(r);}}
   else if(intent.kind==='shoot'){if(r.host.activePlayerId!==actor.id)throw Error('wrong-turn');r.host=acceptCommand(r.host,{id:'lan-'+(++r.serial),kind:'shoot',actorId:actor.id,boardId:r.host.config.players[1-i].boardId,cell:intent.cell},presentation.execution(r));drain(r);}
   else if(intent.kind==='answer'){const d=r.host.pendingRoot?.decisions.find(d=>d.status==='pending'&&d.actorId===actor.id&&r.choices[i].get(d.id)===intent.choice);if(!d)throw Error('wrong-choice');const unit=intent.unit===null?null:[...r.handles[i]].find(([,v])=>v===intent.unit)?.[0];if(unit===undefined)throw Error('wrong-unit');r.host=acceptCommand(r.host,{id:'lan-'+(++r.serial),kind:'answer',answer:{actorId:actor.id,decisionId:d.id,cell:intent.cell,unitId:unit}},presentation.execution(r));drain(r);}
   else {if(['placement','complete'].includes(r.host.status))throw Error('no-battle');r.host.status='complete';r.host.turnStep='finish';r.host.pendingRoot=null;r.host.rootPurpose=null;r.host.pendingPolicyCells=[];r.host.state.match.outcome={kind:'win',winnerIds:[r.host.config.players[1-i].id],eliminatedIds:[actor.id]};presentation.execution(r).normalTerminalMessage(r.host);refreshHost(r.host);}
   sample(r);r.revision++;return read(r,i,current.snapshot.eventPosition);
  }catch{Object.assign(r,before);return deny('illegal');}
 }
 const queue=(r,fn)=>{const task=r.queue.then(fn);r.queue=task.catch(()=>{});return task;};
 const name=value=>{if(typeof value!=='string'||!value.trim()||value.trim().length>24)throw Error('invalid-name');return value.trim();};
 function seat(r,i,binding,label){const token=randomBytes(32).toString('hex');r.seats[i]={token,binding,name:name(label),seen:Date.now(),left:false};tokens.set(token,{r,i});return token;}
 return {
  exportState:()=>exportRooms(rooms),restoreState:saved=>restoreRooms(saved,rooms,tokens),
  async lobby(action,body,binding){if(!binding)throw Error('unknown-session');if(action==='make'){const code=randomBytes(4).toString('hex').slice(0,6).toUpperCase(),r={code,seats:[null,null],queue:Promise.resolve(),epoch:0,closed:false};reset(r);const token=seat(r,0,binding,body.name);rooms.set(code,r);return {token,configuration:publicConfig,update:await read(r,0)};}const r=rooms.get(String(body.code||'').trim().toUpperCase());if(!r||r.closed)throw Error('bad-game-code');return queue(r,async()=>{if(r.seats[1])throw Error('game-full');if(r.seats[0].binding===binding)throw Error('already-seated');const token=seat(r,1,binding,body.name);return {token,configuration:publicConfig,update:await read(r,1)};});},
  async route(token,binding,action,body={}){const entry=tokens.get(token);if(!entry||entry.r.seats[entry.i].binding!==binding||entry.r.seats[entry.i].left)throw Error('unknown-seat');const {r,i}=entry;return queue(r,async()=>{r.seats[i].seen=Date.now();if(action==='read')return read(r,i,body.after??0);if(action==='open')return {configuration:publicConfig,reconnected:true,development:false,update:await read(r,i)};if(action==='command')return dispatch(r,i,body);if(action==='rematch'){if(r.host.status!=='complete'||r.closed)throw Error('not-complete');r.rematch[i]=true;if(r.rematch.every(Boolean))reset(r);return read(r,i);}if(action==='leave'){r.closed=true;r.seats[i].left=true;return {left:true};}throw Error('unsupported');});},
  checkpoint:token=>{const e=tokens.get(token);return e?JSON.stringify({host:serializeHost(e.r.host),memory:e.r.memory,statistics:e.r.statistics,ready:e.r.ready,epoch:e.r.epoch,revision:e.r.revision,serial:e.r.serial}):null;},rooms
 };
}
