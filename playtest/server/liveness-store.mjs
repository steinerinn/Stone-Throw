import {metric,measuredAsync} from './beta-metrics.mjs';
import {durableReplaceAsync} from './durable-file.mjs';
import fs from 'node:fs';import path from 'node:path';
// Small durable lease overlay. A read never rewrites archived gameplay journals.
export function livenessStore(directory){
 if(!directory)return null;const file=path.join(directory,'liveness.json');let previous='',tail=Promise.resolve();
 return {restore(saved){if(!fs.existsSync(file))return;let rows;try{rows=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(rows))throw Error();}catch{throw Error('checkpoint-unavailable');}for(const room of [...saved.two,...saved.ring]){const entry=rows.find(r=>r.code===room.code&&r.epoch===room.epoch);if(!entry)continue;for(const [token,seen]of entry.seats){const seat=room.seats.find(s=>s?.token===token);if(seat&&Number.isFinite(seen))seat.seen=Math.max(seat.seen||0,seen);}if(room.afk&&entry.afkKey===room.afk.key&&Number.isFinite(entry.observedAt))room.afk.observedAt=Math.max(room.afk.observedAt||0,entry.observedAt);}},write(rooms){const text=JSON.stringify([...rooms.values()].map(r=>({code:r.code,epoch:r.epoch,seats:r.seats.flatMap(s=>s?.token?[[s.token,s.seen]]:[]),afkKey:r.afk?.key,observedAt:r.afk?.observedAt})));const queuedAt=performance.now();const task=tail.then(async()=>{metric('liveness-queue',performance.now()-queuedAt);if(text===previous)return;await measuredAsync('liveness-write',()=>durableReplaceAsync(file,text));previous=text;});tail=task.catch(()=>{});return task;},close:()=>tail};
}
