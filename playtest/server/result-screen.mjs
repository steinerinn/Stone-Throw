import {randomInt} from 'node:crypto';
import {AI_AVATARS,avatarById,DEFAULT_AVATAR} from '../assets/avatars/catalog.mjs';
import {summarizeMatch} from './statistics-metrics.mjs';

// Identity randomness is deliberately independent of the gameplay RNG.
export function assignNpc(seats,seat,choose=randomInt){
 if(seat.npc)return;
 const available=Object.keys(AI_AVATARS).filter(name=>!seats.some(s=>s?.npc===name));
 if(!available.length)return;
 seat.npc=available[choose(available.length)];seat.name=seat.npc;
}
export function assignNpcs(seats){for(const seat of seats)if(seat?.controller==='ai')assignNpc(seats,seat);}
export function publicIdentity(seat){const a=avatarById(seat.npc?AI_AVATARS[seat.npc]:seat.identity?.avatarId)||avatarById(DEFAULT_AVATAR);return {name:seat.name,avatar:a.assetPath,ai:seat.controller==='ai',country:seat.npc?null:seat.identity?.country||null};}

// Rank equal elimination boundaries together, then compress to dense places.
// Surviving winner(s), including a final draw, occupy the shared top platform.
export function finalPlacements(host){
 const eliminated=new Map();let boundary=0;
 for(const row of host.events){const b=row.event.statistics?.eliminationBoundary;if(!b)continue;for(const id of b.dead)if(!eliminated.has(id))eliminated.set(id,boundary);boundary++;}
 const outcome=host.state.match.outcome;
 const values=host.config.players.map(p=>outcome.kind==='win'&&outcome.winnerIds.includes(p.id)?Infinity:eliminated.get(p.id)??Infinity);
 const ranks=[...new Set(values)].sort((a,b)=>b-a);
 return values.map(v=>ranks.indexOf(v)+1);
}
const awardFields=[['Lucky Shooter','bestHitStreak','hit streak'],['The Blind One','bestMissStreak','miss streak'],['Eagle Eye','accuracy','accuracy'],['Most Fierce','unitsKilled','units destroyed'],['Chain Master','biggestChain','cell chain'],['Purple Death','plagueCells','Plague cells']];
const cache=new WeakMap();
export function finalResult(room){
 const h=room.host;if(h.status!=='complete')return null;
 if(cache.has(h))return cache.get(h);
 const placement=finalPlacements(h),participants=h.config.players.map((p,i)=>({actor:p.id,kind:'guest',playerId:null,outcome:null,reliability:'Full',placement:placement[i]}));
 // Reuse accepted calculations, but consider all battlefield actors for these
 // ceremonial match awards. This pure summary is never written to career data.
 const summary=summarizeMatch({participants},h.events.map((r,index)=>({...r,index,chainId:r.event.rootId,originActor:r.event.statistics?.rootActorId})));
 const players=room.seats.map((s,i)=>({seat:i,placement:placement[i],...publicIdentity(s)}));
 const awards=awardFields.flatMap(([name,metric,unit])=>{const winners=participants.flatMap((p,i)=>summary[p.actor].awards.includes(name)?[i]:[]);return winners.length?[{name,unit,value:summary[participants[winners[0]].actor][metric],winners}]:[];});
 const result={players,awards,count:players.length};cache.set(h,result);return result;
}
