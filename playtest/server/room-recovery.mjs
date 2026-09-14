import {randomInt} from 'node:crypto';
import {serializeHost,deserializeHost} from '../canonical/compiled/host/serialization.js';
export function exportRooms(rooms){return [...rooms.values()].map(({queue,host,...r})=>({...r,host:serializeHost(host)}));}
export function restoreRooms(saved,rooms,tokens){
 if(!Array.isArray(saved))throw Error('checkpoint-unavailable');
 for(const raw of saved){const r={...raw,host:deserializeHost(raw.host),queue:Promise.resolve(),epoch:randomInt(1,2**48),revision:raw.revision+1};
  if(!Number.isSafeInteger(r.epoch)||!Number.isSafeInteger(r.revision)||!Array.isArray(r.seats)||r.seats.length!==r.host.config.players.length)throw Error('checkpoint-unavailable');
  r.handles=r.seats.map(()=>new Map());r.choices=r.seats.map(()=>new Map());rooms.set(r.code,r);
  r.seats.forEach((s,i)=>{if(s?.token){if(!Number.isFinite(s.seen))s.seen=0;tokens.set(s.token,{r,i});}});
 }
}
