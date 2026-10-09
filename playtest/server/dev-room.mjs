import {randomUUID} from 'node:crypto';
import {developerSpectatorView} from './spectator.mjs';
import os from 'node:os';
import fs from 'node:fs';
import {presence} from './disconnect-policy.mjs';
import {afkInfo,afkSeatActive} from './afk-policy.mjs';
// Local games have no seat heartbeat/AFK policy. Count recent accepted play only;
// never persist this observation or derive activity from a restored checkpoint.
export const LOCAL_PLAY_WINDOW_MS=120000;
export function localPlayActivity(now=Date.now){
 const seen=new WeakMap();
 return {observe:slot=>seen.set(slot,now()),forget:slot=>seen.delete(slot),active:slot=>seen.has(slot)&&now()-seen.get(slot)<LOCAL_PLAY_WINDOW_MS};
}
// Metadata only. Never return session keys, host state, placements or RNG.
export async function devRoomGames(rooms,sessions,spectatorEnabled,now=Date.now(),localActive=()=>false,localObserver=null){
 const games=[];
 for(const room of rooms.values()){
  if(room.closed||!['awaiting-command','awaiting-decision','awaiting-turn','running'].includes(room.host.status))continue;
  const connected=presence(room,now);
  if(!room.seats.some((s,i)=>s?.controller==='human'&&connected[i].connected&&afkSeatActive(room,i)))continue;
  if(afkInfo(room,0,now)?.episode)continue;
  games.push({code:room.code,mode:'Multiplayer',status:room.host.status,round:room.host.round,
   players:room.seats.map(s=>({name:s?.name||'Waiting for player',ai:s?.controller==='ai'})),spectate:!!spectatorEnabled});
 }
 for(const entry of sessions.values()){
  if(!['single','story'].includes(entry.mode))continue;
  const slot=entry.slots?.[entry.mode];if(!slot||!localActive(slot))continue;
  const {snapshot:s}=await slot.session.client.read();
  if(['placement','finished'].includes(s.phase))continue;
  games.push({code:null,mode:entry.mode==='story'?'Story':'Single Player',status:s.phase,round:s.round??null,
   players:[{name:slot.statIdentity?.displayName||'Player',ai:false},...(slot.configuration.singlePlayer?.npcNames||['AI']).map(name=>({name,ai:true}))],spectate:!!localObserver&&typeof slot.session.visitStatistics==='function',...(localObserver&&typeof slot.session.visitStatistics==='function'?{spectateCode:localObserver.code(slot)}:{})});
 }
 return games;
}

// Host resource readings only; no process list, paths, credentials or configuration.
export function devRoomHealthReader(){
 const sample=()=>os.cpus().reduce((s,c)=>({idle:s.idle+c.times.idle,total:s.total+Object.values(c.times).reduce((a,b)=>a+b,0)}),{idle:0,total:0});let prior=null;
 return directory=>{const current=sample(),elapsed=prior?current.total-prior.total:0,cpu=elapsed>0?Math.max(0,Math.min(100,100*(1-(current.idle-prior.idle)/elapsed))):null;prior=current;let disk=null;try{const d=fs.statfsSync(directory);disk={total:d.blocks*d.bsize,available:d.bavail*d.bsize};}catch{}
 return {cpuPercent:cpu,ram:{total:os.totalmem(),available:os.freemem()},disk,hostUptimeSeconds:Math.floor(os.uptime()),healthy:true};};
}

export function migrateDevRoom(db){db.exec(`CREATE TABLE IF NOT EXISTS dev_room_messages(id INTEGER PRIMARY KEY,text TEXT NOT NULL,developer_id TEXT NOT NULL REFERENCES accounts(id),created_at INTEGER NOT NULL);`);}
export function welcomeMessage(db){return {text:db.prepare('SELECT text FROM dev_room_messages ORDER BY id DESC LIMIT 1').get()?.text||''};}
export function saveWelcomeMessage(db,text,developer,now){if(typeof text!=='string'||text.length>500)throw Object.assign(Error('Use a message up to 500 characters.'),{status:400});db.prepare('INSERT INTO dev_room_messages(text,developer_id,created_at) VALUES(?,?,?)').run(text.trim(),developer,now);return welcomeMessage(db);}

// Opaque observer IDs are process-local and never reveal a session credential.
// Weak keys avoid retaining saved games; observation never refreshes activity.
export function devLocalObserver(){
 const ids=new WeakMap();
 const code=slot=>{if(!ids.has(slot))ids.set(slot,'LOCAL-'+randomUUID().replaceAll('-',''));return ids.get(slot);};
 return {code,async read(sessions,request){
  for(const entry of sessions.values())for(const mode of ['single','story']){
   const slot=entry.slots?.[mode];if(!slot||ids.get(slot)!==request.code)continue;
   return slot.session.visitStatistics((host,epoch)=>{
    const names=slot.configuration.singlePlayer?.npcNames||['AI'];
    const room={host,epoch,code:request.code,revision:host.events.length,closed:host.status==='complete',seats:host.config.players.map((p,i)=>({name:i?names[i-1]||'AI':slot.statIdentity?.displayName||'Player',controller:i?'ai':'human'}))};
    return developerSpectatorView(room,request);
   });
  }
  return null;
 }};
}
