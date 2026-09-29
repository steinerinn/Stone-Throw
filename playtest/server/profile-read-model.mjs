import {profileAggregate,globalAggregate,resultAwards} from './profile-aggregates.mjs';
import {repairReplayPresentation} from './replay-store.mjs';
import {HOF_MODES} from './hall-of-fame.mjs';
import {avatarById,DEFAULT_AVATAR,AI_AVATARS} from '../assets/avatars/catalog.mjs';
const parse=s=>JSON.parse(s||'null');
const deny=(message,status=400)=>{throw Object.assign(Error(message),{status});};
// This projection has no write statements and never calls capture/finalization or combat.
export function profileReadModel(db,statistics,viewerId,request){
 const {playerId=viewerId,section='overview',page=0,matchId}=request;
 if(!playerId&&!viewerId)deny('Log in to view your Profile.',401);
 if(Object.keys(request).some(k=>!['playerId','section','page','matchId'].includes(k))||typeof playerId!=='string'||!Number.isInteger(page)||page<0||!['overview','battles','result','replay','reliability'].includes(section))deny('Invalid Profile request.');
 const account=db.prepare("SELECT id,display_name,country,bio,avatar_id,avatar_unlocked FROM accounts WHERE id=? AND status='active'").get(playerId);
 if(!account)deny('Player not found.',404);
 // Deployment needs only public aggregate reliability, never battle results/replays.
 if(section==='reliability'){const r=statistics.reliability(playerId);return {reliability:{games:r.games,...(viewerId===playerId?{gamesUntilForgiveness:r.gamesUntilForgiveness}:{}),distribution:{ok:r.games?r.effectiveFull/r.games:0,afk:r.games?r.outstandingAFK/r.games:0,disconnect:r.games?r.Disconnect/r.games:0}}};}
 const owner=viewerId===playerId;
 if(['result','replay'].includes(section)&&(typeof matchId!=='string'||matchId.length>200))deny('Invalid battle reference.');
 if(['result','replay'].includes(section)&&!owner)deny('Only your own retained battle history is available.',403);
 const saved=owner?db.prepare('SELECT match_id,summary FROM profile_saved_battles WHERE player_id=? ORDER BY saved_at DESC,match_id DESC').all(playerId):[];
 if(owner&&['result','replay'].includes(section)){const stored=db.prepare('SELECT result,replay FROM profile_saved_battles WHERE player_id=? AND match_id=?').get(playerId,matchId);if(stored){if(section==='replay')return repairReplayPresentation(db,parse(stored.replay));const result=parse(stored.result);return {...result,players:result.players.map(p=>({...p,rewards:p.playerId?profileAggregate(db,p.playerId).rewards:{}}))};}}
 const rows=db.prepare("SELECT p.*,m.descriptor,m.ended_at,m.started_at,m.player_count,m.event_cursor,m.mode FROM stat_participants p JOIN stat_matches m ON m.id=p.match_id WHERE p.player_id=? AND p.kind='account' AND m.finalized=1 AND m.mode<>'Story'"+(section==='overview'?' AND p.match_id IN (SELECT match_id FROM profile_recent WHERE player_id=?)':'')+" ORDER BY m.ended_at DESC,m.started_at DESC,m.id DESC"+(section==='overview'?' LIMIT 5':'')).all(...(section==='overview'?[playerId,playerId]:[playerId]));
 const recent=statistics.recentBattles(playerId),latest=new Set(recent.map(r=>r.matchId));
 const identity={playerId,displayName:account.display_name,country:account.country,bio:account.bio,avatarId:account.avatar_id,avatar:avatarById(account.avatar_id)?.assetPath||avatarById(DEFAULT_AVATAR).assetPath};
 function resultSummary(row){return resultAwards(db,row.match_id);}
 function resultData(row){
  const d=parse(row.descriptor);if(!d.finalResult?.placements)return null;
  const resultAwards=resultSummary(row);if(!resultAwards)return null;
  const players=d.participants.map(p=>{
   const a=p.playerId?db.prepare("SELECT id,display_name,country,avatar_id FROM accounts WHERE id=? AND status='active'").get(p.playerId):null;
   return {seat:p.seat,placement:d.finalResult.placements[p.actor],name:p.displayName||a?.display_name||'PLAYER',playerId:a?.id||null,rewards:a?profileAggregate(db,a.id).rewards:{},ai:p.kind==='ai',country:a?.country||null,avatar:(avatarById(a?.avatar_id||AI_AVATARS[p.displayName]||DEFAULT_AVATAR)||avatarById(DEFAULT_AVATAR)).assetPath,matchScore:statistics.matchResultScore(row.match_id,p.actor)};
  });
  if(players.some(p=>!Number.isInteger(p.placement)))return null;
  return {count:players.length,players,awards:resultAwards,matchScore:statistics.matchResultScore(row.match_id,row.actor)};
 }
 function battle(row,index){const d=parse(row.descriptor),score=parse(row.score_components),isRecent=latest.has(row.match_id);return {date:row.ended_at,mode:d.classification?.mode==='single'||row.mode==='Single Player'?'Single Player':'Online',format:row.player_count===2?'Duel':row.player_count+'P',outcome:row.outcome||'Unavailable',placement:score?.placement??row.placement,score:row.match_score,participants:d.participants.map(p=>({name:p.displayName||'PLAYER',ai:p.kind==='ai'})),...(owner?{matchId:row.match_id,resultAvailable:saved.some(s=>s.match_id===row.match_id)||isRecent&&!!resultSummary(row),saved:saved.some(s=>s.match_id===row.match_id),replayAvailable:saved.some(s=>s.match_id===row.match_id)||isRecent&&!!recent.find(r=>r.matchId===row.match_id)?.replayAvailable}:{} )};}
 if(section==='result'||section==='replay'){const row=rows.find(r=>r.match_id===matchId);if(!row||!latest.has(matchId))deny('This battle is outside your five retained Results.',404);const data=section==='result'?resultData(row):statistics.replay(playerId,matchId);if(!data)deny('Historical data is partial or unavailable.',404);return data;}
 if(section==='battles'){const visible=owner?rows:rows.slice(0,5),pages=Math.max(1,Math.ceil(visible.length/5));if(page>=pages)deny('Page not found.',404);return {owner,page,pages,total:visible.length,battles:visible.slice(page*5,page*5+5).map(battle)};}
 const compact=profileAggregate(db,playerId),global=globalAggregate(db),overall=compact.groups.Overall||{},reliability=compact.reliability,foundation={...compact.score,factions:{playerUnits:global.playerUnits,aiUnits:global.aiUnits,playerScore:global.playerUnits/12,aiScore:global.aiUnits/12,qualifyingMatchCount:global.qualifyingMatchCount}};
 const rewards=compact.rewards,rewardMatches=compact.rewardMatches;
 const friends=db.prepare("SELECT f.friend_id AS playerId,a.display_name AS name,a.country,f.battles FROM profile_friends f JOIN accounts a ON a.id=f.friend_id WHERE f.player_id=? AND a.status='active' ORDER BY f.battles DESC,f.friend_id").all(playerId).sort((a,b)=>b.battles-a.battles||a.playerId.localeCompare(b.playerId));
 const hof=HOF_MODES.flatMap(mode=>statistics.hallOfFame(mode,playerId).categories.map(c=>({mode,title:c.title,rank:c.viewer?.rank??null,value:c.viewer?.value??null,status:c.viewerStatus})));
 const stats=Object.values(compact.groups).map(({scoreSum,scoreCount,...g})=>({...g,averageScore:scoreCount?scoreSum/scoreCount:null,hitRate:g.shots?100*g.hits/g.shots:null,winRate:100*g.wins/g.games}));
 const streak=owner?db.prepare('SELECT streak current,longest_streak highest FROM accounts WHERE id=?').get(playerId):null;const globalStreak=db.prepare("SELECT coalesce(max(longest_streak),0) n FROM accounts WHERE status='active'").get().n;
 return {owner,identity,saved:saved.map(r=>parse(r.summary)),...(owner?{streak:{...streak,global:globalStreak}}:{}),...(owner?{avatarUnlocked:!!account.avatar_unlocked}:{}),core:{lifetimeScore:foundation.lifetimeTotalScore,averageScore:compact.completedCount?compact.completedSum/compact.completedCount:null,highestScore:foundation.highestMatchScore,millennial:foundation.thousandPlusCount,games:overall.games||0,wins:overall.wins||0,losses:overall.losses||0,draws:overall.draws||0,winRate:overall.games?100*overall.wins/overall.games:null,rewards:Object.values(rewards).reduce((a,b)=>a+b,0)},rewards,rewardCoverage:{available:rewardMatches,total:compact.total},reliability:{percent:reliability.percent,games:reliability.games,distribution:{ok:reliability.games?reliability.effectiveFull/reliability.games:0,afk:reliability.games?reliability.outstandingAFK/reliability.games:0,disconnect:reliability.games?reliability.Disconnect/reliability.games:0},...(owner?{finished:reliability.Full,disconnect:reliability.Disconnect,outstandingAFK:reliability.outstandingAFK,forgivenAFK:reliability.forgivenAFK,cleanStreak:reliability.cleanStreak,gamesUntilForgiveness:reliability.gamesUntilForgiveness}: {})},friend:friends[0]||null,coplayers:friends,hof,statistics:stats,factions:foundation.factions,recent:rows.slice(0,5).map(battle)};
}
