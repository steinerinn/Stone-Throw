import {measured} from './beta-metrics.mjs';
import {randomInt} from 'node:crypto';
import {assertHost,serializeHost,deserializeHost} from '../canonical/compiled/host/serialization.js';
// Structured-clone transfer between trusted Node threads retains the same host
// assertions as disk recovery, without encoding/decoding the complete history.
const diskHosts=new WeakMap();
function diskHost(host,revision,cache){if(!cache)return serializeHost(host);let v=diskHosts.get(host);if(!v||v.revision!==revision){v={revision,text:serializeHost(host)};diskHosts.set(host,v);}return v.text;}
export function exportRooms(...args){return measured('room-export',()=>exportRoomsInner(...args));}
function exportRoomsInner(rooms,transfer=false,cache=false){return [...rooms.values()].map(({queue,host,...r})=>{return {...r,host:transfer?host:diskHost(host,r.revision,cache)};});}
export function restoreRooms(saved,rooms,tokens,transfer=false){
 if(!Array.isArray(saved))throw Error('checkpoint-unavailable');
 for(const raw of saved){if(transfer||typeof raw.host!=='string')assertHost(raw.host);const r={...raw,host:transfer||typeof raw.host!=='string'?raw.host:deserializeHost(raw.host),queue:Promise.resolve(),epoch:randomInt(1,2**48),revision:raw.revision+1};
  if(!Number.isSafeInteger(r.epoch)||!Number.isSafeInteger(r.revision)||!Array.isArray(r.seats)||r.seats.length!==r.host.config.players.length)throw Error('checkpoint-unavailable');
  r.handles=r.seats.map(()=>new Map());r.choices=r.seats.map(()=>new Map());rooms.set(r.code,r);
  r.seats.forEach((s,i)=>{if(s?.token){if(!Number.isFinite(s.seen))s.seen=0;tokens.set(s.token,{r,i});}});
 }
}
