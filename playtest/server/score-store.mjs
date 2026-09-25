import {calculateScores,scoreCareer} from './match-score.mjs';

export function migrateScores(db){
 if(!db.prepare('PRAGMA table_info(stat_participants)').all().some(c=>c.name==='score_components'))db.exec('ALTER TABLE stat_participants ADD COLUMN score_components TEXT');
 db.exec('CREATE TABLE IF NOT EXISTS stat_factions(match_id TEXT PRIMARY KEY REFERENCES stat_matches(id),value TEXT NOT NULL)');
}
export function persistScores(db,d,facts,expectedEvents=facts.length){
 const result=calculateScores(d,facts,{expectedEvents});
 for(const s of result.scores)db.prepare('UPDATE stat_participants SET match_score=?,score_formula_version=?,score_components=? WHERE match_id=? AND actor=?').run(s.score,s.score===null?null:s.formulaVersion,JSON.stringify(s),d.id,s.actor);
 if(result.faction.qualifying&&!result.faction.reason)db.prepare('INSERT INTO stat_factions VALUES(?,?) ON CONFLICT(match_id) DO UPDATE SET value=excluded.value').run(d.id,JSON.stringify(result.faction));
 return result;
}
export function scoreReadModel(db,playerId){
 const scores=db.prepare('SELECT score_components FROM stat_participants WHERE player_id=? AND score_components IS NOT NULL AND match_score IS NOT NULL ORDER BY match_id,actor').all(playerId).map(r=>JSON.parse(r.score_components));
 const faction=db.prepare('SELECT value FROM stat_factions ORDER BY match_id').all().map(r=>JSON.parse(r.value));
 const playerUnits=faction.reduce((a,r)=>a+r.playerUnits,0),aiUnits=faction.reduce((a,r)=>a+r.aiUnits,0);
 return {...scoreCareer(scores),factions:{playerUnits,aiUnits,playerScore:playerUnits/12,aiScore:aiUnits/12,qualifyingMatchCount:faction.length}};
}
// Caller performs backup and reviews this same dry run before requesting apply.
export function backfillScores(db,{apply=false}={}){
 if(apply)db.exec('BEGIN IMMEDIATE');try{
  const results=[];for(const row of db.prepare('SELECT id,descriptor,event_cursor FROM stat_matches WHERE finalized=1 ORDER BY started_at,id').all()){
   const d=JSON.parse(row.descriptor),facts=db.prepare("SELECT payload FROM stat_facts WHERE match_id=? AND kind='event' ORDER BY sequence").all(row.id).map(r=>JSON.parse(r.payload));
   const result=apply?persistScores(db,d,facts,row.event_cursor):calculateScores(d,facts,{expectedEvents:row.event_cursor});
   results.push({matchId:row.id,...result});
  }
  if(apply)db.exec('COMMIT');return results;
 }catch(e){if(apply)db.exec('ROLLBACK');throw e;}
}

// Read persisted values only. The result's cohort is bounded by its finalization time.
export function matchResultScore(db,matchId,actor){
 const row=db.prepare(`SELECT p.match_score,p.score_formula_version,p.score_components,m.descriptor,m.ended_at FROM stat_participants p JOIN stat_matches m ON m.id=p.match_id WHERE m.id=? AND p.actor=? AND m.finalized=1`).get(matchId,actor);
 if(!row||row.match_score===null||row.score_formula_version!=='MATCH_SCORE_V1')return null;
 const stored=JSON.parse(row.score_components||'null');if(!stored)return null;
 const c=JSON.parse(row.descriptor).classification;let comparison=null;
 if(c&&stored.completed){
  const samples=db.prepare(`SELECT p.match_score,p.score_components,m.descriptor FROM stat_participants p JOIN stat_matches m ON m.id=p.match_id WHERE m.finalized=1 AND m.ended_at<=? AND p.kind!='ai' AND p.reliability='Full' AND p.match_score IS NOT NULL AND p.score_formula_version='MATCH_SCORE_V1'`).all(row.ended_at).filter(r=>{const k=JSON.parse(r.descriptor).classification;return k&&k.mode===c.mode&&k.startingHumans===c.startingHumans&&k.startingAI===c.startingAI&&JSON.parse(r.score_components||'null')?.completed;});
  if(samples.length>=5){const average=samples.reduce((a,r)=>a+r.match_score,0)/samples.length;if(average>0)comparison={samples:samples.length,average,percent:100*(row.match_score-average)/average,label:c.startingHumans+' PLAYER'+(c.startingHumans===1?'':'S')+' + '+c.startingAI+' AI'};}
 }
 return {matchId,formulaVersion:row.score_formula_version,score:row.match_score,exact:stored.exact,comparison};
}
