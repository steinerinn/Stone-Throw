import {randomUUID,createHash} from 'node:crypto';
import {HEARTBEAT_TIMEOUT_MS} from './disconnect-policy.mjs';
// Entry metadata is independent of host combat state and survives normal room export.
export function entryBody(body){
 if(body.visibility!==undefined&&!['public','private'].includes(body.visibility))throw Error('invalid-configuration');
 if(body.slots===undefined)return body; // Accepted rematch/legacy callers retain their contract.
 const s=body.slots;
 if(!Array.isArray(s)||s.length!==4||s[0]!=='human'||s[1]!=='human'||s.slice(2).some(x=>!['human','ai','empty'].includes(x)))throw Error('invalid-configuration');
 const controllers=s.filter(x=>x!=='empty');return {...body,seats:controllers.length,controllers};
}
export function stampEntry(room,body,now,order){room.entry={id:randomUUID(),visibility:body.visibility||'public',createdAt:now,order};}
const id=r=>r.entry?.id||createHash('sha256').update('online-list:'+r.code).digest('hex').slice(0,24);
export function checkEntryCode(rooms,body){if(body.roomId!==undefined){const r=rooms.find(r=>id(r)===body.roomId);if(!r||r.code!==String(body.code||'').trim().toUpperCase())throw Error('bad-game-code');}}
export function listEntries(rooms,binding,now){
 return rooms.filter(r=>{const h=r.seats[r.hostSeat??0];return !r.closed&&r.host.status==='placement'&&h&&!h.left&&h.binding!==binding&&now-h.seen<HEARTBEAT_TIMEOUT_MS;}).map(r=>{
 const freeSlots=r.seats.filter(s=>!s||s.controller==='human'&&!s.token&&!s.left).length,visibility=r.entry?.visibility||'public';
 return {roomId:id(r),...(visibility==='public'?{code:r.code}:{}),creator:r.seats[r.hostSeat??0].name,type:r.seats.length===2?'Duel':r.seats.length+'-player Group',seats:r.seats.length,occupied:r.seats.length-freeSlots,freeSlots,full:freeSlots===0,visibility,createdAt:r.entry?.createdAt??0,order:r.entry?.order??0};
 }).sort((a,b)=>(a.full?2:a.visibility==='private'?1:0)-(b.full?2:b.visibility==='private'?1:0)||a.createdAt-b.createdAt||a.order-b.order);
}
