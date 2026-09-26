import {randomUUID,createHash} from 'node:crypto';
import {HEARTBEAT_TIMEOUT_MS} from './disconnect-policy.mjs';
export const AFK_WARNING_MS=30000,AFK_DEADLINE_MS=30000,AFK_WAIT_MS=120000;
export const afkSeatActive=(r,i)=>!r.host.state.ring||r.host.state.ring.order.includes(r.host.config.players[i].id);
const human=(r,i)=>{const s=r.seats[i];return s?.controller==='human'&&!!s.token&&!s.left&&afkSeatActive(r,i);};
export function requiredInput(r){
 const h=r.host;if(r.local||r.closed||!['awaiting-command','awaiting-decision'].includes(h.status))return null;
 const d=h.pendingRoot?.decisions.find(d=>d.status==='pending'),actor=d?.actorId||h.activePlayerId,i=h.config.players.findIndex(p=>p.id===actor);
 if(i<0||!human(r,i)||r.seats[i].absence)return null;
 if(d&&!d.legalCells?.length&&!d.legalUnitIds?.length)return null;
 if(!d&&!(h.state.seats.find(s=>s.playerId===actor)?.ordinaryShots>0))return null;
 // Revision and private event cursor bind playback readiness to one settled state.
 const stamp=createHash('sha256').update(JSON.stringify([h.events.length,d?.id||'shot',r.afkGeneration||0])).digest('hex');
 return {seat:i,key:[r.epoch,r.revision,stamp].join(':')};
}
export function resetAfk(r){r.afk=null;r.afkGeneration=0;for(const s of r.seats||[])if(s){s.afkIncidents=0;s.afkHistory=[];s.disconnects=0;}}
export function cancelAfk(r){if(r.afk){r.afkGeneration=(r.afkGeneration||0)+1;r.afk=null;}}
export function afkInfo(r,i,now){
 const input=requiredInput(r),a=r.afk;
 if(!input)return null;
 const live=a?.key===input.key&&!a.resumePending&&a.warningAt!=null&&!r.seats[input.seat].absence&&now-r.seats[input.seat].seen<HEARTBEAT_TIMEOUT_MS;
 return {inputKey:input.key,seat:input.seat,ready:!!(a?.key===input.key&&a.startedAt!=null&&!a.resumePending),...(live?{episode:a.id,incident:r.seats[a.seat].afkIncidents,remainingMs:Math.max(0,a.deadline-now),voters:[...a.voters],vote:a.votes[i]||null,threshold:a.threshold}: {})};
}
export function acknowledgeInput(r,i,key,now){
 const input=requiredInput(r);if(!input||input.seat!==i||input.key!==key||now<(r.afkPresentationUntil||0)||now-r.seats[i].seen>=HEARTBEAT_TIMEOUT_MS)return false;
 if(r.afk?.key===key&&r.afk.resumePending){const a=r.afk,paused=Math.max(0,now-(a.observedAt??a.startedAt));a.startedAt+=paused;if(a.warningAt!=null){a.warningAt+=paused;a.deadline+=paused;}a.observedAt=now;a.resumePending=false;return true;}
 if(r.afk?.key===key&&r.afk.startedAt!=null)return false;
 r.afk={key,seat:i,startedAt:now,observedAt:now,id:randomUUID(),votes:{},voters:[]};return true;
}
export function reconcileAfk(r,now,takeover){
 const input=requiredInput(r),a=r.afk;
 if(!input||!a||a.key!==input.key||now-r.seats[input.seat].seen>=HEARTBEAT_TIMEOUT_MS){cancelAfk(r);return;}
 if(a.resumePending)return;
 a.observedAt=now;
 if(a.warningAt==null&&now-a.startedAt>=AFK_WARNING_MS){
  a.warningAt=a.startedAt+AFK_WARNING_MS;
  const s=r.seats[a.seat];s.afkIncidents=(s.afkIncidents||0)+1;(s.afkHistory??=[]).push({id:a.id,at:a.warningAt,inputKey:a.key});
 }
 if(a.warningAt==null)return;
 a.voters=r.seats.flatMap((s,i)=>i!==a.seat&&human(r,i)?[i]:[]);
 // AI contributes WAIT only; the KICK electorate remains human-only.
 const aiVoters=r.seats.flatMap((s,i)=>i!==a.seat&&s?.controller==='ai'&&!s.left&&afkSeatActive(r,i)?[i]:[]);
 for(const i of aiVoters)a.votes[i]='wait';
 const votes=a.voters.map(i=>a.votes[i]);a.threshold=r.seats[a.seat].afkIncidents>=2?1:Math.ceil(a.voters.length/2);
 const unanimous=a.voters.length+aiVoters.length>0&&votes.every(v=>v==='wait');
 a.deadline=a.warningAt+(unanimous?AFK_WAIT_MS:AFK_DEADLINE_MS);
 if(votes.filter(v=>v==='kick').length>=Math.max(1,a.threshold)||now>=a.deadline){takeover(r,a.seat,'afk');cancelAfk(r);}
}
export function voteAfk(r,i,body,now,takeover){
 reconcileAfk(r,now,takeover);const a=r.afk;
 if(!a||a.warningAt==null||body.episode!==a.id||!a.voters.includes(i)||!['wait','kick'].includes(body.action)||a.votes[i])throw Error('stale');
 a.votes[i]=body.action;reconcileAfk(r,now,takeover);
}
