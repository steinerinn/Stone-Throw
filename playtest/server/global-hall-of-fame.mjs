import {hofEligibility} from './hof-eligibility.mjs';
import {rankHallOfFame,GLOBAL_HOF_MODES} from './hall-of-fame.mjs';
import {aggregate} from './statistics-metrics.mjs';
// Global HOF projection only: existing finalized summaries and persisted scores, no writes.
export function globalHallOfFame(db,mode,viewerId,{now=Date.now()}={}){
 if(!GLOBAL_HOF_MODES.includes(mode))throw Error('invalid-hof-mode');
 const qualification=hofEligibility(db);
 const date=new Date(now),month=Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),1),year=Date.UTC(date.getUTCFullYear(),0,1);
 const wanted={'Duel':2,'3 Players':3,'4 Players':4}[mode],careers=new Map(),eligible=[];let excluded=false;
 const rows=db.prepare(`SELECT p.player_id,p.actor,p.summary,p.reliability,p.match_score,p.score_formula_version,p.score_components,m.id,m.mode,m.player_count,m.descriptor,m.ended_at,a.display_name,a.country FROM stat_participants p JOIN stat_matches m ON m.id=p.match_id JOIN accounts a ON a.id=p.player_id WHERE p.kind='account' AND a.status='active' AND m.finalized=1 AND m.ended_at<=? AND m.mode<>'Story' AND NOT EXISTS(SELECT 1 FROM review_pending hold WHERE hold.player_id=p.player_id AND hold.match_id=m.id AND hold.status='PENDING REVIEW') ORDER BY m.ended_at,m.id,p.actor`).all(now);
 for(const row of rows){
  const d=JSON.parse(row.descriptor),c=d.classification;
  if(!c||!['single','online'].includes(c.mode)||![2,3,4].includes(c.participantCount)||c.participantCount!==row.player_count||c.format!==({2:'duel',3:'3p',4:'4p'})[c.participantCount]){excluded=true;continue;}
  if(wanted&&c.participantCount!==wanted)continue;
  const identity={playerId:row.player_id,displayName:row.display_name,country:row.country||null};
  const summary=JSON.parse(row.summary||'null');
  if(summary){const previous=careers.get(row.player_id);careers.set(row.player_id,{...identity,career:aggregate(previous?.career,summary,row.id)});}else excluded=true;
  const stored=JSON.parse(row.score_components||'null'),participant=d.participants?.find(p=>p.actor===row.actor);
  if(!['MATCH_SCORE_V1','MATCH_SCORE_V2_ELIMINATION'].includes(row.score_formula_version)||!Number.isFinite(row.match_score)||row.reliability!=='Full'||stored?.completed!==true||stored.issues?.length||!participant||participant.cutoff!==undefined||participant.takeover)continue;
  eligible.push({...identity,value:row.match_score,endedAt:row.ended_at});
 }
 const top=(start)=>{const best=new Map();for(const r of eligible)if(qualification.get(r.playerId)?.eligible&&r.endedAt>=start&&(!best.has(r.playerId)||r.value>best.get(r.playerId).value))best.set(r.playerId,r);return [...best.values()].sort((a,b)=>b.value-a.value||a.playerId.localeCompare(b.playerId)).slice(0,3).map(({endedAt,...r},i)=>({...r,rank:i+1,own:r.playerId===viewerId}));};
 const ranked=rankHallOfFame([...careers.values()],mode,viewerId,{qualification});
 return {...ranked,topScores:{month:top(month),year:top(year),all:top(-Infinity)},periods:{month:new Date(month).toISOString(),year:new Date(year).toISOString(),timezone:'UTC'},coverage:{retainedOnly:true,excludedUnclassifiedOrMissingSummaries:excluded}};
}
