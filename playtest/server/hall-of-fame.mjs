import {FUTURE_HALL_OF_FAME_FULL_GAMES as FULL} from './statistics-metrics.mjs';
export const HOF_MODES=['Duel','3 Players','4 Players'];
export const HOF_CATEGORIES=[['Siege Champion','Most Wins','wins',false],['The Underdog','Most Losses','losses',false],['Highest Win Ratio','Wins / finalized games','winRatio',false],['Highest Loss Ratio','Losses / finalized games','lossRatio',false],['Game Master','Most fully completed games','full',false],['Stormtrooper Award','Lowest ordinary-shot Accuracy','accuracy',true]];
export function rankHallOfFame(rows,mode,viewerId,{bypass=false}={}){
 if(!HOF_MODES.includes(mode))throw Error('invalid-hof-mode');
 const own=rows.find(r=>r.playerId===viewerId),full=own?.career.reliability?.Full||0;
 return {mode,qualification:{requiredFull:FULL,bypass,viewerFull:full,viewerQualified:full>=FULL},categories:HOF_CATEGORIES.map(([title,description,key,ascending])=>{
 const candidates=rows.filter(r=>bypass||(r.career.reliability?.Full||0)>=FULL).map(r=>({playerId:r.playerId,displayName:r.displayName,country:r.country||null,value:key==='full'?(r.career.reliability?.Full||0):r.career[key]})).filter(r=>Number.isFinite(r.value)).sort((a,b)=>(ascending?a.value-b.value:b.value-a.value)||a.playerId.localeCompare(b.playerId));
 let previous,rank=0;const ranked=candidates.map((r,i)=>{if(i===0||r.value!==previous)rank=i+1;previous=r.value;return {...r,rank};});const index=ranked.findIndex(r=>r.playerId===viewerId),top=ranked.slice(0,10),near=index<0?[]:ranked.slice(Math.max(0,index-5),index+6),visible=[...top,...near.filter(r=>!top.some(t=>t.playerId===r.playerId))];
 return {title,description,key,total:ranked.length,leader:ranked[0]||null,leaderTies:ranked.filter(r=>r.rank===1).length,viewer:index<0?null:ranked[index],viewerStatus:!viewerId?'guest':!own?'no-finalized-games':!bypass&&full<FULL?'not-qualified':index<0?'no-metric':'ranked',rows:visible};
 })};
}
