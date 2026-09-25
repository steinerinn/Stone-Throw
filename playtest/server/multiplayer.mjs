import {entryBody,stampEntry,listEntries,checkEntryCode} from './online-entry.mjs';
import {createPvpService as createTwoSeatService} from './pvp.mjs';
import {createRingService} from './ring-pvp.mjs';
export function createPvpService(roster,options){
 const two=createTwoSeatService(roster,options),ring=createRingService(roster,options),owners=new Map();
 const rematchQueues=new WeakMap();
 function refreshed(seat){const identity=options?.refreshIdentity?.(seat.identity)||seat.identity;return {name:identity?.displayName||seat.name,identity};}
 async function moveRematch(old,i,binding){let next=old.rematchCode&&ring.rooms.get(old.rematchCode);if(!next||next.closed||next.host.status!=='placement'){const first=old.rematchOrder.find(j=>!old.seats[j].left);if(first===undefined)throw Error('unknown-seat');const controllers=old.seats.map((s,j)=>{const original=old.matchStatistics?.participants.find(p=>p.seat===j);return (original?original.kind==='ai':s.controller==='ai'&&!s.token)?'ai':'human';}),npcReservations=old.seats.filter((s,j)=>controllers[j]==='ai'&&s.npc).map(s=>s.npc);const host=old.seats[first],made=await ring.lobby('rematch-make',{...refreshed(host),seats:old.seats.length,controllers,npcReservations},host.binding);next=ring.rooms.get(made.update.lan.code);stampEntry(next,old.entry||{},options?.now?.()??Date.now(),1+Math.max(0,...[...two.rooms.values(),...ring.rooms.values()].map(r=>r.entry?.order||0)));next.rematchSource=old.code;old.rematchCode=next.code;old.seats[first].rematchToken=made.token;owners.set(made.token,ring);}for(const j of old.rematchOrder){const seat=old.seats[j];if(seat.left||seat.rematchToken)continue;await ring.reserveRematch(next.code);const joined=await ring.lobby('join',{...refreshed(seat),code:next.code},seat.binding);seat.rematchToken=joined.token;owners.set(joined.token,ring);}const fresh=old.seats[i].rematchToken;if(!fresh)throw Error('unknown-seat');old.seats[i].left=true;if(old.seats.every(s=>s.left||s.controller==='ai'))old.closed=true;const opened=await ring.route(fresh,binding,'open');return {...opened,token:fresh};}
 return {
  close:()=>ring.close(),
  isGroup:token=>owners.get(token)===ring,
  isBusy:token=>owners.get(token)===ring&&ring.isBusy(token),
  heartbeat:(token,binding)=>ring.heartbeat(token,binding),
  liveRead:(token,binding,after)=>ring.liveRead(token,binding,after),
  stream:(token,binding,body,notify)=>ring.route(token,binding,'command',body,(i,u)=>{const r=ring.rooms.get(u.lan.code);if(r?.seats[i]?.token===token)notify(u);}),
  tick:async()=>{const a=await two.tick(),b=await ring.tick();return a||b;},
  isDuel:token=>owners.get(token)===two,
  requiresExplicitReturn:token=>owners.has(token),
  list:binding=>listEntries([...two.rooms.values(),...ring.rooms.values()],binding,options?.now?.()??Date.now()),
  exportState:(transfer=false)=>({two:two.exportState(),ring:ring.exportState(transfer)}),
  restoreState(saved){two.restoreState(saved.two);ring.restoreState(saved.ring);for(const service of [two,ring])for(const r of service.rooms.values())for(const s of r.seats)if(s?.token)owners.set(s.token,service);},
  get rooms(){return new Map([...two.rooms,...ring.rooms]);},
  async lobby(action,body,binding){if(action==='make')body=entryBody(body);else checkEntryCode([...two.rooms.values(),...ring.rooms.values()],body);const code=String(body.code||'').trim().toUpperCase(),service=action==='make'?(body.seats===undefined||body.seats===2?two:ring):(ring.rooms.has(code)?ring:two);if(action==='join'){const minimum=service.rooms.get(code)?.entry?.minimumReliability||0;if(minimum){const rating=body.identity?.kind==='account'?options?.reliability?.(body.identity.playerId):null;if(rating?.percent==null||rating.percent<minimum)throw Error('reliability-required-'+minimum);}}const result=await service.lobby(action,body,binding);owners.set(result.token,service);if(action==='make')stampEntry(service.rooms.get(result.update.lan.code),body,options?.now?.()??Date.now(),1+Math.max(0,...[...two.rooms.values(),...ring.rooms.values()].map(r=>r.entry?.order||0)));return result;},
  async route(token,...args){const service=owners.get(token);if(!service)throw Error('unknown-seat');let out=await service.route(token,...args);if(service===two&&args[1]==='rematch'&&out.snapshot?.phase==='placement'){const room=two.rooms.get(out.lan.code);for(const seat of room.seats)if(seat?.controller==='human')Object.assign(seat,refreshed(seat));out=await service.route(token,args[0],'read');}if(service!==ring||args[1]!=='rematch'||!out.lan?.complete)return out;const old=ring.rooms.get(out.lan.code),i=out.lan.self;const task=(rematchQueues.get(old)||Promise.resolve()).then(()=>moveRematch(old,i,args[0]));rematchQueues.set(old,task.catch(()=>{}));return task;},
  checkpoint(token){return owners.get(token)?.checkpoint(token)??null;}
 };
}
