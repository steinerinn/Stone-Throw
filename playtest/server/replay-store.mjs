import {buildReplay,publicCheckpoint} from './replay.mjs';
export function migrateReplays(db){db.exec('CREATE TABLE IF NOT EXISTS stat_replays(match_id TEXT PRIMARY KEY REFERENCES stat_matches(id),payload TEXT NOT NULL)');}
export function captureReplayCheckpoint(db,d,h){
 const cursor=h.events.length,value=publicCheckpoint(h);
 if(!db.prepare("SELECT 1 FROM stat_facts WHERE match_id=? AND kind='public-replay' LIMIT 1").get(d.id))db.prepare("INSERT INTO stat_facts VALUES(?,'public-replay',0,?)").run(d.id,JSON.stringify({round:0,turn:0,active:-1,boards:d.participants.map(p=>({seat:p.seat,cells:[]}))}));
 // Store only newly public/changed cells. Playback merges these deltas; no
 // private host snapshot is retained and repeated polling adds no entries.
 const previous=new Map();for(const row of db.prepare("SELECT payload FROM stat_facts WHERE match_id=? AND kind='public-replay' AND sequence<? ORDER BY sequence").all(d.id,cursor))for(const b of JSON.parse(row.payload).boards)for(const c of b.cells)previous.set(b.seat+':'+c.x+','+c.y,JSON.stringify(c));
 for(const b of value.boards)b.cells=b.cells.filter(c=>previous.get(b.seat+':'+c.x+','+c.y)!==JSON.stringify(c));
 db.prepare("INSERT INTO stat_facts(match_id,kind,sequence,payload) VALUES(?,'public-replay',?,?) ON CONFLICT(match_id,kind,sequence) DO UPDATE SET payload=excluded.payload").run(d.id,cursor,JSON.stringify(value));
}
export function recentMatches(db,playerId){
 return db.prepare("SELECT m.id,m.mode,m.player_count,m.started_at,m.ended_at,m.descriptor,p.actor,p.outcome,p.reliability,p.placement,p.match_score,p.score_components,r.match_id AS replay_id FROM stat_matches m JOIN stat_participants p ON p.match_id=m.id LEFT JOIN stat_replays r ON r.match_id=m.id WHERE p.player_id=? AND p.kind='account' AND m.finalized=1 AND m.mode<>'Story' ORDER BY m.ended_at DESC,m.started_at DESC,m.id DESC LIMIT 5").all(playerId).map(r=>{
  const d=JSON.parse(r.descriptor),score=r.score_components?JSON.parse(r.score_components):null;
  return {matchId:r.id,startedAt:r.started_at,endedAt:r.ended_at,mode:d.classification?.mode||r.mode,format:d.classification?.format||r.player_count+'p',participants:d.participants.map(p=>({seat:p.seat,name:p.displayName||'PLAYER',ai:p.kind==='ai'})),outcome:r.outcome,placement:score?.placement??r.placement,participation:r.reliability==='Full'?'completed':'Disconnect/Abandon',reliability:r.reliability,departureReason:d.participants.find(p=>p.actor===r.actor)?.takeover||null,matchScore:r.match_score,scoreFormula:score?.formulaVersion??null,scoreComponents:score?.components??null,durationMs:r.ended_at-r.started_at,replayAvailable:!!r.replay_id};
 });
}
export function pruneReplays(db){
 db.exec("DELETE FROM stat_replays WHERE match_id NOT IN (SELECT match_id FROM (SELECT p.match_id,ROW_NUMBER() OVER(PARTITION BY p.player_id ORDER BY m.ended_at DESC,m.started_at DESC,m.id DESC) AS position FROM stat_participants p JOIN stat_matches m ON m.id=p.match_id WHERE p.kind='account' AND p.player_id IS NOT NULL AND m.finalized=1 AND m.mode<>'Story') WHERE position<=5)");
 db.exec("DELETE FROM stat_facts WHERE kind='public-replay' AND match_id IN (SELECT id FROM stat_matches WHERE finalized=1) AND match_id NOT IN (SELECT match_id FROM stat_replays)");
}
export function finalizeReplay(db,d,facts){
 if(d.mode==='Story'||!d.participants.some(p=>p.kind==='account'&&p.playerId))return null;
 const checkpoints=db.prepare("SELECT sequence,payload FROM stat_facts WHERE match_id=? AND kind='public-replay' ORDER BY sequence").all(d.id).map(r=>({cursor:r.sequence,value:JSON.parse(r.payload)}));
 const replay=buildReplay(d,facts,checkpoints);db.prepare('INSERT INTO stat_replays VALUES(?,?) ON CONFLICT(match_id) DO NOTHING').run(d.id,JSON.stringify(replay));pruneReplays(db);return replay;
}
export function replayForProfile(db,playerId,matchId){if(!recentMatches(db,playerId).some(r=>r.matchId===matchId))return null;const r=db.prepare('SELECT payload FROM stat_replays WHERE match_id=?').get(matchId);return r?JSON.parse(r.payload):null;}
export function backfillReplays(db,{apply=false}={}){
 const report={full:0,partial:0,none:0};if(apply)db.exec('BEGIN IMMEDIATE');try{
  for(const r of db.prepare("SELECT descriptor,event_cursor FROM stat_matches WHERE finalized=1 AND mode<>'Story' ORDER BY ended_at,id").all()){
   const d=JSON.parse(r.descriptor),facts=db.prepare("SELECT payload FROM stat_facts WHERE match_id=? AND kind='event' ORDER BY sequence").all(d.id).map(x=>JSON.parse(x.payload));
   if(!facts.length||facts.length!==r.event_cursor){report.none++;continue;}
   const checkpoints=db.prepare("SELECT sequence,payload FROM stat_facts WHERE match_id=? AND kind='public-replay' ORDER BY sequence").all(d.id).map(x=>({cursor:x.sequence,value:JSON.parse(x.payload)}));
   const replay=buildReplay(d,facts,checkpoints);report[replay.coverage==='full-public-events'?'full':'partial']++;
   if(apply)finalizeReplay(db,d,facts);
  }
  if(apply){pruneReplays(db);db.exec('COMMIT');}return report;
 }catch(e){if(apply)db.exec('ROLLBACK');throw e;}
}
