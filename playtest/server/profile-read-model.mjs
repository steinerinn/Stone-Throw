import {HOF_MODES} from './hall-of-fame.mjs';
import {summarizeMatch} from './statistics-metrics.mjs';
import {avatarById,DEFAULT_AVATAR,AI_AVATARS} from '../assets/avatars/catalog.mjs';
const parse=s=>JSON.parse(s||'null');
const deny=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const awards=[['Lucky Shooter','bestHitStreak','hit streak'],['The Blind One','bestMissStreak','miss streak'],['Eagle Eye','accuracy','accuracy'],['Most Fierce','unitsKilled','units destroyed'],['Chain Master','biggestChain','cell chain'],['Purple Death','plagueCells','Plague cells']];
const metrics=['shots','hits','misses','unitsKilled','coreKills','heroHits','plagueCells','scoutInspected','scoutFound','destructiveCells','unitCellsHit','castleCatapultHits','elvesKilled','dragonsActivated','perfectVolleys','monkDeflections','resurrections','dwarfHits','wizardHits','wizardAttackHits','goblinBombs','demonKills'];
// This projection has no write statements and never calls capture/finalization or combat.
export function profileReadModel(db,statistics,viewerId,request){
 const {playerId=viewerId,section='overview',page=0,matchId}=request;
 if(!playerId&&!viewerId)deny('Log in to view your Profile.',401);
 if(Object.keys(request).some(k=>!['playerId','section','page','matchId'].includes(k))||typeof playerId!=='string'||!Number.isInteger(page)||page<0||!['overview','battles','result','replay'].includes(section))deny('Invalid Profile request.');
 const account=db.prepare("SELECT id,display_name,country,bio,avatar_id,avatar_unlocked FROM accounts WHERE id=? AND status='active'").get(playerId);
 if(!account)deny('Player not found.',404);
 const owner=viewerId===playerId;
 if(['result','replay'].includes(section)&&(typeof matchId!=='string'||matchId.length>200))deny('Invalid battle reference.');
 if(['result','replay'].includes(section)&&!owner)deny('Only your own retained battle history is available.',403);
 const rows=db.prepare("SELECT p.*,m.descriptor,m.ended_at,m.started_at,m.player_count,m.event_cursor,m.mode FROM stat_participants p JOIN stat_matches m ON m.id=p.match_id WHERE p.player_id=? AND p.kind='account' AND m.finalized=1 AND m.mode<>'Story' ORDER BY m.ended_at DESC,m.started_at DESC,m.id DESC").all(playerId);
 const recent=statistics.recentBattles(playerId),latest=new Set(recent.map(r=>r.matchId));
 const identity={playerId,displayName:account.display_name,country:account.country,bio:account.bio,avatarId:account.avatar_id,avatar:avatarById(account.avatar_id)?.assetPath||avatarById(DEFAULT_AVATAR).assetPath};
 function resultData(row){
  const d=parse(row.descriptor);if(!d.finalResult?.placements)return null;
  const facts=db.prepare("SELECT payload FROM stat_facts WHERE match_id=? AND kind='event' ORDER BY sequence").all(row.match_id).map(r=>parse(r.payload));
  if(facts.length!==row.event_cursor)return null;
  const participants=d.participants.map(p=>({...p,kind:'guest',cutoff:undefined})),summary=summarizeMatch({participants},facts);
  const players=d.participants.map(p=>{
   const a=p.playerId?db.prepare("SELECT id,display_name,country,avatar_id FROM accounts WHERE id=? AND status='active'").get(p.playerId):null;
   return {seat:p.seat,placement:d.finalResult.placements[p.actor],name:p.displayName||a?.display_name||'PLAYER',playerId:a?.id||null,ai:p.kind==='ai',country:a?.country||null,avatar:(avatarById(a?.avatar_id||AI_AVATARS[p.displayName]||DEFAULT_AVATAR)||avatarById(DEFAULT_AVATAR)).assetPath,matchScore:statistics.matchResultScore(row.match_id,p.actor)};
  });
  if(players.some(p=>!Number.isInteger(p.placement)))return null;
  const resultAwards=awards.flatMap(([name,metric,unit])=>{const winners=d.participants.filter(p=>summary[p.actor].awards.includes(name));return winners.length?[{name,unit,value:summary[winners[0].actor][metric],winners:winners.map(p=>p.seat)}]:[];});
  return {count:players.length,players,awards:resultAwards,matchScore:statistics.matchResultScore(row.match_id,row.actor)};
 }
 function battle(row,index){const d=parse(row.descriptor),score=parse(row.score_components),isRecent=latest.has(row.match_id);return {date:row.ended_at,mode:d.classification?.mode==='single'||row.mode==='Single Player'?'Single Player':'Online',format:row.player_count===2?'Duel':row.player_count+'P',outcome:row.outcome||'Unavailable',placement:score?.placement??row.placement,score:row.match_score,participants:d.participants.map(p=>({name:p.displayName||'PLAYER',ai:p.kind==='ai'})),...(owner?{matchId:row.match_id,resultAvailable:isRecent&&!!resultData(row),replayAvailable:isRecent&&!!recent.find(r=>r.matchId===row.match_id)?.replayAvailable}:{} )};}
 if(section==='result'||section==='replay'){const row=rows.find(r=>r.match_id===matchId);if(!row||!latest.has(matchId))deny('This battle is outside your five retained Results.',404);const data=section==='result'?resultData(row):statistics.replay(playerId,matchId);if(!data)deny('Historical data is partial or unavailable.',404);return data;}
 if(section==='battles'){const visible=owner?rows:rows.slice(0,5),pages=Math.max(1,Math.ceil(visible.length/5));if(page>=pages)deny('Page not found.',404);return {owner,page,pages,total:visible.length,battles:visible.slice(page*5,page*5+5).map(battle)};}
 const foundation=statistics.profileSummary(playerId),reliability=foundation.reliability;
 const completed=rows.filter(r=>r.match_score!==null&&r.score_formula_version==='MATCH_SCORE_V1'&&parse(r.score_components)?.completed);
 const overall=foundation.career.find(c=>c.mode==='All')||{};
 const rewards={},coplayers=new Map();let rewardMatches=0;
 for(const row of rows){const result=resultData(row);if(result){rewardMatches++;for(const a of result.awards)if(a.winners.includes(row.seat))rewards[a.name]=(rewards[a.name]||0)+1;}
  for(const p of parse(row.descriptor).participants)if(p.kind==='account'&&p.playerId&&p.playerId!==playerId)coplayers.set(p.playerId,(coplayers.get(p.playerId)||0)+1);
 }
 const friends=[...coplayers].flatMap(([id,battles])=>{const a=db.prepare("SELECT display_name FROM accounts WHERE id=? AND status='active'").get(id);return a?[{playerId:id,name:a.display_name,battles}]:[];}).sort((a,b)=>b.battles-a.battles||a.playerId.localeCompare(b.playerId));
 const hof=HOF_MODES.flatMap(mode=>statistics.hallOfFame(mode,playerId).categories.map(c=>({mode,title:c.title,rank:c.viewer?.rank??null,value:c.viewer?.value??null,status:c.viewerStatus})));
 const groups=new Map();for(const row of rows){const d=parse(row.descriptor),s=parse(row.summary)||{},keys=['Overall',d.classification?.mode==='single'||row.mode==='Single Player'?'Single Player':'Online',row.player_count===2?'Duel':row.player_count+'P'];if(d.classification)keys.push(d.classification.startingHumans+' PLAYER + '+d.classification.startingAI+' AI');for(const key of keys){const g=groups.get(key)||{title:key,games:0,wins:0,losses:0,draws:0,biggestChain:0,placements:{},scores:[]};g.games++;if(row.outcome==='Win')g.wins++;if(row.outcome==='Loss')g.losses++;if(row.outcome==='Draw')g.draws++;for(const k of metrics)g[k]=g[k]===null||!Number.isFinite(s[k])?null:(g[k]||0)+s[k];g.biggestChain=g.biggestChain===null||!Number.isFinite(s.biggestChain)?null:Math.max(g.biggestChain,s.biggestChain);if(row.placement)g.placements[row.placement]=(g.placements[row.placement]||0)+1;if(completed.includes(row))g.scores.push(row.match_score);groups.set(key,g);}}
 const stats=[...groups.values()].map(({scores,...g})=>({...g,averageScore:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null,highestScore:scores.length?Math.max(...scores):null,hitRate:g.shots?100*g.hits/g.shots:null,winRate:100*g.wins/g.games}));
 return {owner,identity,...(owner?{avatarUnlocked:!!account.avatar_unlocked}:{}),core:{lifetimeScore:foundation.lifetimeTotalScore,averageScore:completed.length?completed.reduce((n,r)=>n+r.match_score,0)/completed.length:null,highestScore:foundation.highestMatchScore,millennial:foundation.thousandPlusCount,games:overall.games||0,wins:overall.wins||0,losses:overall.losses||0,draws:overall.draws||0,winRate:overall.games?100*overall.wins/overall.games:null,rewards:Object.values(rewards).reduce((a,b)=>a+b,0)},rewards,rewardCoverage:{available:rewardMatches,total:rows.length},reliability:{percent:reliability.percent,games:reliability.games,...(owner?{finished:reliability.Full,disconnect:reliability.Disconnect,outstandingAFK:reliability.outstandingAFK,forgivenAFK:reliability.forgivenAFK,cleanStreak:reliability.cleanStreak,gamesUntilForgiveness:reliability.gamesUntilForgiveness}: {})},friend:friends[0]||null,coplayers:friends,hof,statistics:stats,factions:foundation.factions,recent:rows.slice(0,5).map(battle)};
}
