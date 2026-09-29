import {randomUUID} from 'node:crypto';
import {HEARTBEAT_TIMEOUT_MS} from './disconnect-policy.mjs';
export const SHARED_INCIDENT_WINDOW_MS=3000;
const liveHumans=r=>r.seats.filter((s,i)=>s?.token&&s.controller==='human'&&!s.left&&(!r.host.state.ring||r.host.state.ring.order.includes(r.host.config.players[i].id)));
const distinct=seats=>new Set(seats.map(s=>s.identity?.playerId||s.binding)).size;
const active=r=>!r.closed&&!['placement','complete','guarded'].includes(r.host.status);
export function incidentProtected(s){return !!s.sharedIncident&&s.sharedIncident.seen===s.seen;}
// During the small detection window do not hand a third-disconnect seat to AI
// before the other simultaneously silent connections can be classified.
export function sharedIncidentPending(r,now){const seats=liveHumans(r);return r.sharedIncidentPendingUntil>now||active(r)&&seats.length>=2&&distinct(seats)>=2&&Math.max(...seats.map(s=>s.seen))-Math.min(...seats.map(s=>s.seen))<=SHARED_INCIDENT_WINDOW_MS&&seats.every(s=>now-s.seen>=HEARTBEAT_TIMEOUT_MS-SHARED_INCIDENT_WINDOW_MS)&&seats.some(s=>now-s.seen<HEARTBEAT_TIMEOUT_MS);}
export function detectSharedIncidents(rooms,now){
 rooms=[...rooms];
 // Also cover independently occupied rooms whose last heartbeats straddle a tick.
 if(rooms.length>1){for(const r of rooms)delete r.sharedIncidentPendingUntil;const quiet=rooms.filter(active).map(r=>({r,seats:liveHumans(r)})).filter(c=>c.seats.length&&c.seats.every(s=>now-s.seen>=HEARTBEAT_TIMEOUT_MS-SHARED_INCIDENT_WINDOW_MS));for(const c of quiet){const peers=quiet.filter(p=>Math.max(...[...c.seats,...p.seats].map(s=>s.seen))-Math.min(...[...c.seats,...p.seats].map(s=>s.seen))<=SHARED_INCIDENT_WINDOW_MS);if(peers.length>1&&distinct(peers.flatMap(p=>p.seats))>=2)c.r.sharedIncidentPendingUntil=Math.max(...peers.flatMap(p=>p.seats).map(s=>s.seen))+HEARTBEAT_TIMEOUT_MS;}}
 const candidates=rooms.filter(active).map(r=>({r,seats:liveHumans(r)})).filter(c=>c.seats.length&&c.seats.every(s=>now-s.seen>=HEARTBEAT_TIMEOUT_MS&&(!s.absence||s.absence.incident||s.absence.network))&&Math.max(...c.seats.map(s=>s.seen))-Math.min(...c.seats.map(s=>s.seen))<=SHARED_INCIDENT_WINDOW_MS);
 let changed=false;
 for(const c of candidates){const peers=candidates.filter(p=>Math.max(...[...c.seats,...p.seats].map(s=>s.seen))-Math.min(...[...c.seats,...p.seats].map(s=>s.seen))<=SHARED_INCIDENT_WINDOW_MS),seats=peers.flatMap(p=>p.seats);if(distinct(seats)<2||c.seats.length<2&&peers.length<2)continue;
  const scope=peers.length>=2?'SERVER INCIDENT':'POSSIBLE SHARED INCIDENT',from=Math.min(...seats.map(s=>s.seen)),id=seats.find(incidentProtected)?.sharedIncident.id||randomUUID();
  for(const {r,seats:affected}of peers)for(const s of affected){if(incidentProtected(s)){const record=s.reliabilityIncidents?.find(v=>v.id===s.sharedIncident.id);if(record&&scope==='SERVER INCIDENT'&&record.scope!==scope){record.scope=scope;r.revision++;changed=true;}continue;}if(s.absence?.network&&!s.absence.incident){s.disconnects=Math.max(0,(s.disconnects||0)-1);s.absence.incident=id;}for(const warning of s.afkHistory||[])if(!warning.sharedIncident&&warning.at>=s.seen&&warning.at<=now){warning.sharedIncident=id;s.afkIncidents=Math.max(0,(s.afkIncidents||0)-1);}s.sharedIncident={id,seen:s.seen};(s.reliabilityIncidents??=[]).push({id,scope,from,observedAt:now});r.revision++;changed=true;}
 }
 return changed;
}

// Process recovery is a known server incident, even when heartbeats were staggered.
// Preserve genuine pre-existing absences and penalties; protect only connected seats.
export function protectServerRecovery(rooms,now){
 const id=randomUUID();
 for(const r of rooms){if(!active(r))continue;for(const s of liveHumans(r)){if(s.absence)continue;s.sharedIncident={id,seen:s.seen};(s.reliabilityIncidents??=[]).push({id,scope:'SERVER INCIDENT',from:s.seen,observedAt:now});}}
}
