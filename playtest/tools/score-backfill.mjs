import {DatabaseSync,backup} from 'node:sqlite';
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {backfillScores,migrateScores} from '../server/score-store.mjs';
const [file,report,...flags]=process.argv.slice(2),apply=flags.includes('--apply');
if(!file||!report)throw Error('Usage: score-backfill.mjs DATABASE REPORT [--apply]');
const db=new DatabaseSync(file,{readOnly:!apply});db.exec('PRAGMA busy_timeout=5000');
try{
 const dry=backfillScores(db),scores=dry.flatMap(r=>r.scores),summary={matches:dry.length,scoreable:scores.filter(s=>!s.issues.length).length,ambiguous:scores.filter(s=>s.issues.length).map(s=>({actor:s.actor,issues:s.issues})),factions:dry.filter(r=>r.faction.qualifying&&!r.faction.reason).length,factionAmbiguities:dry.filter(r=>r.faction.reason).map(r=>({matchId:r.matchId,reason:r.faction.reason})),playerUnits:dry.reduce((a,r)=>a+r.faction.playerUnits,0),aiUnits:dry.reduce((a,r)=>a+r.faction.aiUnits,0)};
 const digest=createHash('sha256').update(JSON.stringify(dry)).digest('hex');
 if(apply){
  const prior=JSON.parse(fs.readFileSync(report,'utf8'));if(prior.digest!==digest)throw Error('Dry run changed; review a fresh report first');
  const backupPath=path.join(path.dirname(file),'backups','registry-before-match-score-'+Date.now()+'.sqlite');fs.mkdirSync(path.dirname(backupPath),{recursive:true});await backup(db,backupPath);
  const check=new DatabaseSync(backupPath,{readOnly:true});try{if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Backup integrity failed');}finally{check.close();}
  // Original tables must remain identical, except the explicitly added score fields.
  const fingerprint=()=>Object.fromEntries(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('stat_participants','stat_factions') ORDER BY name").all().map(({name})=>[name,createHash('sha256').update(JSON.stringify(db.prepare('SELECT * FROM "'+name.replaceAll('"','""')+'" ORDER BY rowid').all())).digest('hex')]));
  const before=fingerprint();migrateScores(db);const applied=backfillScores(db,{apply:true});if(JSON.stringify(applied)!==JSON.stringify(dry))throw Error('Apply differs from dry run');if(JSON.stringify(before)!==JSON.stringify(fingerprint()))throw Error('Unrelated Registry table changed');
  const first=db.prepare('SELECT match_id,actor,match_score,score_formula_version,score_components FROM stat_participants ORDER BY match_id,actor').all();backfillScores(db,{apply:true});if(JSON.stringify(first)!==JSON.stringify(db.prepare('SELECT match_id,actor,match_score,score_formula_version,score_components FROM stat_participants ORDER BY match_id,actor').all()))throw Error('Non-idempotent backfill');summary.backupPath=backupPath;summary.applied=true;summary.unrelatedTablesUnchanged=true;summary.idempotent=true;
 }
 fs.writeFileSync(apply?report+'.applied.json':report,JSON.stringify({digest,...summary,results:dry},null,2));console.log(JSON.stringify({digest,...summary}));
}finally{db.close();}
