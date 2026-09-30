import {summarizeMatch} from './statistics-metrics.mjs';
import {reliabilityHistory} from './reliability-outcome.mjs';
import {add,rational,numeric} from './match-score.mjs';
export const PROFILE_METRICS=['shots','hits','misses','unitsKilled','coreKills','heroHits','plagueCells','scoutInspected','scoutFound','destructiveCells','unitCellsHit','castleCatapultHits','elvesKilled','dragonsActivated','perfectVolleys','monkDeflections','resurrections','dwarfHits','wizardHits','wizardAttackHits','goblinBombs','demonKills'];
const awards=[['Lucky Shooter','bestHitStreak','hit streak'],['The Blind One','bestMissStreak','miss streak'],['Eagle Eye','accuracy','accuracy'],['Most Fierce','unitsKilled','units destroyed'],['Chain Master','biggestChain','cell chain'],['Purple Death','plagueCells','Plague cells']];
const parse=x=>JSON.parse(x||'null');
export const emptyProfile=()=>({fullGames:0,total:0,rewardMatches:0,rewards:{},completedSum:0,completedCount:0,groups:{},score:{exactTotal:rational(),lifetimeTotalScore:0,scoredMatchCount:0,highestMatchScore:null,thousandPlusCount:0},reliability:reliabilityHistory([])});
export function profileAggregate(db,id){return parse(db.prepare('SELECT value FROM profile_totals WHERE player_id=?').get(id)?.value)||emptyProfile();}
export function globalAggregate(db){return parse(db.prepare('SELECT value FROM profile_global WHERE id=1').get()?.value)||{battles:0,units:0,chain:0,complete:true,participants:0,playerUnits:0,aiUnits:0,qualifyingMatchCount:0};}
export function resultAwards(db,id){const r=db.prepare('SELECT value FROM profile_result_awards WHERE match_id=?').get(id);return r?parse(r.value):null;}
// Called inside the authoritative finalization transaction. No eligibility/scoring changes.
export function accumulateProfile(db,d,facts,expected=facts.length){
 if(d.mode==='Story'||db.prepare('SELECT 1 FROM profile_aggregated_matches WHERE match_id=?').get(d.id))return;
 const rows=db.prepare('SELECT * FROM stat_participants WHERE match_id=? ORDER BY seat').all(d.id),global=globalAggregate(db);global.battles++;global.participants+=rows.length;
 for(const row of rows){const s=parse(row.summary);if(!s||!Number.isFinite(s.unitsKilled)||!Number.isFinite(s.biggestChain))global.complete=false;else{global.units+=s.unitsKilled;if(s.biggestChain>global.chain||s.biggestChain===global.chain&&!global.chainHolder){const p=d.participants.find(p=>p.actor===row.actor);global.chainHolder={playerId:row.player_id||null,displayName:p?.displayName||'Player',country:p?.country||null};}global.chain=Math.max(global.chain,s.biggestChain);}}
 const faction=db.prepare("SELECT 1 FROM sqlite_master WHERE name='stat_factions'").get()?parse(db.prepare('SELECT value FROM stat_factions WHERE match_id=?').get(d.id)?.value):null;if(faction){global.playerUnits+=faction.playerUnits;global.aiUnits+=faction.aiUnits;global.qualifyingMatchCount++;}
 let result=null;if(facts.length===expected&&d.finalResult?.placements&&d.participants.every(p=>Number.isInteger(d.finalResult.placements[p.actor]))){const summary=summarizeMatch({participants:d.participants.map(p=>({...p,kind:'guest',cutoff:undefined}))},facts);result=awards.flatMap(([name,metric,unit])=>{const winners=d.participants.filter(p=>summary[p.actor].awards.includes(name));return winners.length?[{name,unit,value:summary[winners[0].actor][metric],winners:winners.map(p=>p.seat)}]:[];});}
 db.prepare('INSERT INTO profile_result_awards VALUES(?,?)').run(d.id,JSON.stringify(result));
 for(const row of rows){if(row.kind!=='account'||!row.player_id)continue;const id=row.player_id,a=profileAggregate(db,id),s=parse(row.summary)||{},score=parse(row.score_components),completed=row.match_score!==null&&['MATCH_SCORE_V1','MATCH_SCORE_V2_ELIMINATION'].includes(row.score_formula_version)&&score?.completed;a.total++;db.prepare('INSERT OR REPLACE INTO profile_recent VALUES(?,?,?,?)').run(id,d.id,d.endedAt,d.startedAt||0);db.prepare('DELETE FROM profile_recent WHERE player_id=? AND match_id NOT IN (SELECT match_id FROM profile_recent WHERE player_id=? ORDER BY ended_at DESC,started_at DESC,match_id DESC LIMIT 5)').run(id,id);const participant=d.participants.find(p=>p.actor===row.actor);if(row.reliability==='Full'&&participant&&participant.cutoff===undefined&&!participant.takeover)a.fullGames++;
 if(result){a.rewardMatches++;for(const award of result)if(award.winners.includes(row.seat))a.rewards[award.name]=(a.rewards[award.name]||0)+1;}
 if(row.match_score!==null&&score?.exact){a.score.exactTotal=add(a.score.exactTotal,score.exact);a.score.lifetimeTotalScore=numeric(a.score.exactTotal);a.score.scoredMatchCount++;const value=numeric(score.exact);a.score.highestMatchScore=a.score.highestMatchScore===null?value:Math.max(a.score.highestMatchScore,value);if(score.completed&&BigInt(score.exact.n)>=1000n*BigInt(score.exact.d))a.score.thousandPlusCount++;}
 if(completed){a.completedCount++;a.completedSum+=row.match_score;}
 if(['Duel','3 Players','4 Players'].includes(d.mode)){
  // Administrative exemptions are separate from immutable match/review evidence.
  const exemption=db.prepare('SELECT 1 FROM reliability_exemptions WHERE player_id=? AND match_id=?').get(id,d.id);
  if(!exemption)a.reliability=reliabilityHistory([{...row,descriptor:d}],a.reliability);
 }
 const keys=['Overall',d.classification?.mode==='single'||d.mode==='Single Player'?'Single Player':'Online',d.participants.length===2?'Duel':d.participants.length+'P'];if(d.classification)keys.push(d.classification.startingHumans+' PLAYER + '+d.classification.startingAI+' AI');for(const key of keys){const g=a.groups[key]||{title:key,games:0,wins:0,losses:0,draws:0,biggestChain:0,placements:{},scoreSum:0,scoreCount:0,highestScore:null};g.games++;if(row.outcome==='Win')g.wins++;if(row.outcome==='Loss')g.losses++;if(row.outcome==='Draw')g.draws++;for(const k of PROFILE_METRICS)g[k]=g[k]===null||!Number.isFinite(s[k])?null:(g[k]||0)+s[k];g.biggestChain=g.biggestChain===null||!Number.isFinite(s.biggestChain)?null:Math.max(g.biggestChain,s.biggestChain);if(row.placement)g.placements[row.placement]=(g.placements[row.placement]||0)+1;if(completed){g.scoreSum+=row.match_score;g.scoreCount++;g.highestScore=g.highestScore===null?row.match_score:Math.max(g.highestScore,row.match_score);}a.groups[key]=g;}
 for(const p of d.participants)if(p.kind==='account'&&p.playerId&&p.playerId!==id)db.prepare('INSERT INTO profile_friends VALUES(?,?,1) ON CONFLICT(player_id,friend_id) DO UPDATE SET battles=battles+1').run(id,p.playerId);
 db.prepare('INSERT INTO profile_totals VALUES(?,?) ON CONFLICT(player_id) DO UPDATE SET value=excluded.value').run(id,JSON.stringify(a));
 }
 db.prepare('INSERT INTO profile_global VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(JSON.stringify(global));db.prepare('INSERT INTO profile_aggregated_matches VALUES(?)').run(d.id);db.prepare('DELETE FROM profile_aggregate_dirty WHERE match_id=?').run(d.id);
}
export function rebuildProfileAggregates(db){
 // Rebuildable derived data only. Protected facts/results/review tables are never mutated.
 for(const table of ['profile_recent','profile_totals','profile_friends','profile_result_awards','profile_global','profile_aggregated_matches'])db.exec('DELETE FROM '+table);
 for(const row of db.prepare("SELECT id,descriptor,event_cursor FROM stat_matches WHERE finalized=1 AND mode<>'Story' ORDER BY ended_at,id").all()){const d=parse(row.descriptor),facts=db.prepare("SELECT payload FROM stat_facts WHERE match_id=? AND kind='event' ORDER BY sequence").all(row.id).map(r=>parse(r.payload));accumulateProfile(db,d,facts,row.event_cursor);}
 db.exec('DELETE FROM profile_aggregate_dirty; INSERT OR REPLACE INTO profile_aggregate_meta VALUES(1,4)');
}
export function ensureProfileAggregates(db){
 if(db.prepare('SELECT 1 FROM profile_aggregate_meta WHERE id=1 AND version=4').get()&&!db.prepare('SELECT 1 FROM profile_aggregate_dirty LIMIT 1').get())return;
 db.exec('SAVEPOINT profile_rebuild');try{rebuildProfileAggregates(db);db.exec('RELEASE profile_rebuild');}catch(e){db.exec('ROLLBACK TO profile_rebuild; RELEASE profile_rebuild');throw e;}
}
export function migrateProfileAggregates(db){
 db.exec(`CREATE TABLE IF NOT EXISTS reliability_exemptions(player_id TEXT NOT NULL,match_id TEXT NOT NULL,created_at INTEGER NOT NULL,reason TEXT NOT NULL,original_outcome TEXT NOT NULL,PRIMARY KEY(player_id,match_id));
 CREATE TABLE IF NOT EXISTS profile_totals(player_id TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS profile_recent(player_id TEXT NOT NULL,match_id TEXT NOT NULL,ended_at INTEGER NOT NULL,started_at INTEGER NOT NULL,PRIMARY KEY(player_id,match_id));
 CREATE TABLE IF NOT EXISTS profile_friends(player_id TEXT NOT NULL,friend_id TEXT NOT NULL,battles INTEGER NOT NULL,PRIMARY KEY(player_id,friend_id));
 CREATE INDEX IF NOT EXISTS profile_friend_rank ON profile_friends(player_id,battles DESC,friend_id);
 CREATE TABLE IF NOT EXISTS profile_result_awards(match_id TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS profile_global(id INTEGER PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS profile_aggregated_matches(match_id TEXT PRIMARY KEY);
 CREATE TABLE IF NOT EXISTS profile_aggregate_dirty(match_id TEXT PRIMARY KEY);
 CREATE TABLE IF NOT EXISTS profile_aggregate_meta(id INTEGER PRIMARY KEY,version INTEGER NOT NULL);

 CREATE INDEX IF NOT EXISTS profile_completed_order ON stat_matches(finalized,ended_at DESC,started_at DESC,id DESC);
 CREATE TRIGGER IF NOT EXISTS profile_dirty_match_insert AFTER INSERT ON stat_matches WHEN NEW.finalized=1 BEGIN INSERT OR IGNORE INTO profile_aggregate_dirty VALUES(NEW.id); END;
 CREATE TRIGGER IF NOT EXISTS profile_dirty_participant_insert AFTER INSERT ON stat_participants WHEN EXISTS(SELECT 1 FROM profile_aggregated_matches WHERE match_id=NEW.match_id) BEGIN INSERT OR IGNORE INTO profile_aggregate_dirty VALUES(NEW.match_id); END;
 CREATE TRIGGER IF NOT EXISTS profile_dirty_scores AFTER UPDATE ON stat_participants WHEN EXISTS(SELECT 1 FROM profile_aggregated_matches WHERE match_id=NEW.match_id) BEGIN INSERT OR IGNORE INTO profile_aggregate_dirty VALUES(NEW.match_id); END;
 CREATE TRIGGER IF NOT EXISTS profile_dirty_match AFTER UPDATE ON stat_matches WHEN OLD.finalized=1 BEGIN INSERT OR IGNORE INTO profile_aggregate_dirty VALUES(NEW.id); END;
 CREATE TRIGGER IF NOT EXISTS profile_dirty_event_delete AFTER DELETE ON stat_facts WHEN OLD.kind='event' AND EXISTS(SELECT 1 FROM profile_aggregated_matches WHERE match_id=OLD.match_id) BEGIN INSERT OR IGNORE INTO profile_aggregate_dirty VALUES(OLD.match_id); END;
 CREATE TRIGGER IF NOT EXISTS profile_dirty_event_update AFTER UPDATE ON stat_facts WHEN NEW.kind='event' AND EXISTS(SELECT 1 FROM profile_aggregated_matches WHERE match_id=NEW.match_id) BEGIN INSERT OR IGNORE INTO profile_aggregate_dirty VALUES(NEW.match_id); END;
 CREATE TRIGGER IF NOT EXISTS profile_dirty_event_insert AFTER INSERT ON stat_facts WHEN NEW.kind='event' AND EXISTS(SELECT 1 FROM profile_aggregated_matches WHERE match_id=NEW.match_id) BEGIN INSERT OR IGNORE INTO profile_aggregate_dirty VALUES(NEW.match_id); END;`);
 if(db.prepare('PRAGMA table_info(accounts)').all().some(c=>c.name==='longest_streak'))db.exec('CREATE INDEX IF NOT EXISTS profile_global_streak ON accounts(status,longest_streak DESC)');
 ensureProfileAggregates(db);
}
