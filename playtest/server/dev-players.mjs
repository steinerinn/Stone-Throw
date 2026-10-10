import {moderationNotice,validateModerationReason} from './moderation-notice.mjs';
import {createHash} from 'node:crypto';
import {profileAggregate,ensureProfileAggregates} from './profile-aggregates.mjs';
import {reliabilityHistory} from './reliability-outcome.mjs';
import {avatarById,DEFAULT_AVATAR} from '../assets/avatars/catalog.mjs';
const deny=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const parse=x=>JSON.parse(x||'null');
const manualReason='dev-room-manual-correction';
export function migratePlayerCorrections(db){db.exec(`CREATE TABLE IF NOT EXISTS dev_player_corrections(id INTEGER PRIMARY KEY,player_id TEXT NOT NULL REFERENCES accounts(id),developer_id TEXT NOT NULL REFERENCES accounts(id),field TEXT NOT NULL,old_value TEXT NOT NULL,new_value TEXT NOT NULL,match_id TEXT,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS dev_player_locks(player_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,field TEXT NOT NULL CHECK(field IN ('username','displayName','bio')),locked INTEGER NOT NULL CHECK(locked IN (0,1)),PRIMARY KEY(player_id,field));
 CREATE TRIGGER IF NOT EXISTS dev_player_corrections_no_update BEFORE UPDATE ON dev_player_corrections BEGIN SELECT RAISE(ABORT,'Correction history is append-only'); END;
 CREATE TRIGGER IF NOT EXISTS dev_player_corrections_no_delete BEFORE DELETE ON dev_player_corrections BEGIN SELECT RAISE(ABORT,'Correction history is append-only'); END;`);}
export function playerAdminStore(db,{now=Date.now,nameKey,validateBio,onlineAccounts=()=>[]}={}){
 const all=(sql,...args)=>db.prepare(sql).all(...args),one=(sql,...args)=>db.prepare(sql).get(...args);
 function account(id){if(typeof id!=='string'||id.length>200)deny('Invalid player.');const a=one('SELECT id AS playerId,status,moderation_role AS role,display_name AS displayName,username,email,bio,country,avatar_id AS avatarId,created_at AS createdAt,streak,longest_streak AS bestStreak,last_day AS lastDay FROM accounts WHERE id=?',id);if(!a)deny('Player not found.',404);return {...a,notice:moderationNotice(db,id),restrictionRevision:one("SELECT coalesce(max(id),0) id FROM dev_player_corrections WHERE player_id=?",id).id,locks:locks(id)};}
 function locks(id){const result={username:false,displayName:false,bio:false};for(const r of all('SELECT field,locked FROM dev_player_locks WHERE player_id=?',id))result[r.field]=!!r.locked;return result;}
 function rows(id){return all("SELECT p.match_id,p.seat,p.reliability,m.descriptor,m.mode,m.ended_at,e.reason AS exemptionReason FROM stat_participants p JOIN stat_matches m ON m.id=p.match_id LEFT JOIN reliability_exemptions e ON e.player_id=p.player_id AND e.match_id=p.match_id WHERE p.player_id=? AND p.kind='account' AND m.finalized=1 AND m.mode IN ('Duel','3 Players','4 Players') ORDER BY m.ended_at,m.id",id);}
 function penalties(records){return records.flatMap(r=>{const h=reliabilityHistory([r]),kind=h.AFK?'AFK':h.Disconnect?'Disconnect':null;return kind?[{matchId:r.match_id,mode:r.mode,date:r.ended_at,kind,excluded:!!r.exemptionReason,editable:!r.exemptionReason||r.exemptionReason===manualReason}]:[];});}
 const revision=(a,records)=>createHash('sha256').update(JSON.stringify([a,records])).digest('hex');
 function search(query='',newOnly=false){if(typeof query!=='string'||query.length>100)deny('Use a shorter search.');if(typeof newOnly!=='boolean')deny('Invalid registration filter.');const online=new Set(onlineAccounts()),end=now(),start=end-7*24*60*60*1000,q=query.normalize('NFC').toLocaleLowerCase(),accounts=all('SELECT id AS playerId,status,moderation_role AS role,display_name AS displayName,username,country,created_at AS createdAt,(SELECT field FROM dev_player_corrections WHERE player_id=accounts.id AND field IN (\'Player warned\',\'Warning removed\') ORDER BY id DESC LIMIT 1) AS warningAction FROM accounts ORDER BY display_name,id').map(a=>({...a,online:a.status!=='banned'&&online.has(a.playerId),isNew:Number.isFinite(a.createdAt)&&a.createdAt>=start&&a.createdAt<=end})),matches=accounts.filter(a=>(!newOnly||a.isNew)&&[a.displayName,a.username].some(v=>v.normalize('NFC').toLocaleLowerCase().includes(q))).sort((a,b)=>Number(b.online)-Number(a.online));return {items:matches.slice(0,50),more:matches.length>50,counts:{total:accounts.length,online:accounts.filter(a=>a.online).length,new:accounts.filter(a=>a.isNew).length}};}

 function detail(id){const a=account(id);ensureProfileAggregates(db);const p=profileAggregate(db,id),overall=p.groups.Overall||{},records=rows(id);return {player:{playerId:a.playerId,status:a.status,role:a.role,notice:a.notice,displayName:a.displayName,username:a.username,email:a.email,bio:a.bio,locks:a.locks,country:a.country,avatar:avatarById(a.avatarId)?.assetPath||avatarById(DEFAULT_AVATAR).assetPath,createdAt:a.createdAt},revision:revision(a,records),editable:{streak:a.streak,bestStreak:a.bestStreak},stats:{games:overall.games||0,wins:overall.wins||0,losses:overall.losses||0,draws:overall.draws||0,lifetimeScore:p.score.lifetimeTotalScore,averageScore:p.completedCount?p.completedSum/p.completedCount:null,highestScore:p.score.highestMatchScore,bestChain:overall.biggestChain??null,shots:overall.shots??null,hits:overall.hits??null,winRate:overall.games?100*(overall.wins||0)/overall.games:null},reliability:p.reliability,penalties:penalties(records),recent:all("SELECT m.id AS matchId,m.mode,m.ended_at AS date,p.outcome,p.match_score AS score,EXISTS(SELECT 1 FROM stat_replays r WHERE r.match_id=m.id) AS replayAvailable FROM stat_participants p JOIN stat_matches m ON m.id=p.match_id WHERE p.player_id=? AND p.kind='account' AND m.finalized=1 AND m.mode<>'Story' ORDER BY m.ended_at DESC,m.id DESC LIMIT 10",id),audit:all('SELECT c.field,c.old_value AS oldValue,c.new_value AS newValue,c.match_id AS matchId,c.created_at AS date,a.display_name AS developer FROM dev_player_corrections c JOIN accounts a ON a.id=c.developer_id WHERE c.player_id=? ORDER BY c.id DESC LIMIT 100',id)};}
 // Caller holds the Registry transaction and has authenticated the developer.
 function correct(b,developer){if(Object.keys(b).sort().join(',')!=='bestStreak,penalties,playerId,revision,streak'||typeof b.revision!=='string'||!Number.isSafeInteger(b.streak)||!Number.isSafeInteger(b.bestStreak)||b.streak<0||b.bestStreak<b.streak||b.bestStreak>100000||!Array.isArray(b.penalties)||b.penalties.length>100)deny('Invalid corrections. Best streak must be at least the current streak.');
 const a=account(b.playerId),records=rows(b.playerId);if(revision(a,records)!==b.revision)deny('This player changed while you were editing. Reopen EDIT and try again.',409);ensureProfileAggregates(db);const current=profileAggregate(db,b.playerId),available=new Map(penalties(records).map(r=>[r.matchId,r])),seen=new Set();
 for(const p of b.penalties){if(!p||Object.keys(p).sort().join(',')!=='excluded,matchId'||typeof p.excluded!=='boolean'||!available.get(p.matchId)?.editable||seen.has(p.matchId))deny('Only a recorded penalty can be corrected.');seen.add(p.matchId);}
 const audit=(field,oldValue,newValue,matchId=null)=>{if(oldValue===newValue)return;db.prepare('INSERT INTO dev_player_corrections(player_id,developer_id,field,old_value,new_value,match_id,created_at) VALUES(?,?,?,?,?,?,?)').run(b.playerId,developer,field,String(oldValue),String(newValue),matchId,now());};
 for(const p of b.penalties){const old=available.get(p.matchId);if(old.excluded===p.excluded)continue;if(p.excluded)db.prepare('INSERT INTO reliability_exemptions(player_id,match_id,created_at,reason,original_outcome) VALUES(?,?,?,?,?)').run(b.playerId,p.matchId,now(),manualReason,old.kind);else db.prepare('DELETE FROM reliability_exemptions WHERE player_id=? AND match_id=? AND reason=?').run(b.playerId,p.matchId,manualReason);audit(old.kind+' penalty',old.excluded?'Removed':'Counted',p.excluded?'Removed':'Counted',p.matchId);}
 const recalculated=reliabilityHistory(rows(b.playerId).filter(r=>!r.exemptionReason));audit('AFK penalties',current.reliability.outstandingAFK,recalculated.outstandingAFK);audit('Disconnect penalties',current.reliability.Disconnect,recalculated.Disconnect);
 current.reliability=recalculated;if(one('SELECT 1 FROM profile_totals WHERE player_id=?',b.playerId))db.prepare('UPDATE profile_totals SET value=? WHERE player_id=?').run(JSON.stringify(current),b.playerId);
 audit('Current login streak',a.streak,b.streak);audit('Best login streak',a.bestStreak,b.bestStreak);db.prepare('UPDATE accounts SET streak=?,longest_streak=? WHERE id=?').run(b.streak,b.bestStreak,b.playerId);
 return detail(b.playerId);
 }
 function moderate(b,developer){
 if(Object.keys(b).sort().join(',')!=='field,operation,playerId,revision,value'||typeof b.revision!=='string'||!['username','displayName','email','bio'].includes(b.field)||!['edit','lock'].includes(b.operation))deny('Invalid moderation change.');
 const a=account(b.playerId);if(revision(a,rows(b.playerId))!==b.revision)deny('This player changed while you were editing. Reopen EDIT and try again.',409);
 const label={username:'Username',displayName:'Display Name',email:'Email',bio:'Bio'}[b.field];let oldValue,newValue,action;
 if(b.operation==='lock'){
  if(b.field==='email'||typeof b.value!=='boolean')deny('Invalid field lock.');oldValue=a.locks[b.field];newValue=b.value;if(oldValue===newValue)return detail(b.playerId);
  db.prepare('INSERT INTO dev_player_locks VALUES(?,?,?) ON CONFLICT(player_id,field) DO UPDATE SET locked=excluded.locked').run(b.playerId,b.field,Number(newValue));action=label+(newValue?' locked':' unlocked');oldValue=oldValue?'Locked':'Unlocked';newValue=newValue?'Locked':'Unlocked';
 }else{
  if(typeof b.value!=='string')deny('Use a text value.');oldValue=a[b.field];newValue=b.value;
  if(['username','displayName'].includes(b.field)){
   const [name,key]=nameKey(b.value),column=b.field==='username'?'username':'display_name',keyColumn=b.field==='username'?'username_key':'display_key';newValue=name;
   if(one(`SELECT id FROM accounts WHERE ${keyColumn}=? AND id<>?`,key,b.playerId))deny(label+' is already taken.');
   if(oldValue===newValue)return detail(b.playerId);db.prepare(`UPDATE accounts SET ${column}=?,${keyColumn}=? WHERE id=?`).run(name,key,b.playerId);action=label+' changed';
  }else if(b.field==='email'){
   if(newValue!==''&&!validOwnerEmail(newValue))deny('Enter a valid email address, or leave it empty.');if(oldValue===newValue)return detail(b.playerId);
   db.prepare('UPDATE accounts SET email=?,email_verified=0 WHERE id=?').run(newValue,b.playerId);action=!newValue?'Email removed':!oldValue?'Email added':'Email changed';oldValue='';newValue='';
  }else{
   validateBio(newValue);if(oldValue===newValue)return detail(b.playerId);db.prepare('UPDATE accounts SET bio=? WHERE id=?').run(newValue,b.playerId);action=newValue?'Bio edited':'Bio cleared';oldValue='';newValue='';
  }
 }
 db.prepare('INSERT INTO dev_player_corrections(player_id,developer_id,field,old_value,new_value,created_at) VALUES(?,?,?,?,?,?)').run(b.playerId,developer,action,String(oldValue),String(newValue),now());return detail(b.playerId);
 }
 // Account restrictions are owner decisions, separate from anomaly review and immutable match records.
 function restrict(b,developer){
  if(Object.keys(b).sort().join(',')!=='action,playerId,reason,revision'||typeof b.revision!=='string'||!['WARN','UNWARN','BAN','UNBAN','FLAG','UNFLAG'].includes(b.action))deny('Enter a plain-text reason (1–500 characters).');
  validateModerationReason(b.reason);const a=account(b.playerId);if(a.playerId===developer||a.role!=='player')deny('Developer and administrator accounts are protected.',403);
  if(revision(a,rows(b.playerId))!==b.revision)deny('This player changed. Reopen the action and try again.',409);
  const allowed={WARN:['active','flagged'],UNWARN:['active','flagged'],BAN:['active','flagged'],UNBAN:['banned'],FLAG:['active'],UNFLAG:['flagged']};if(!allowed[b.action].includes(a.status))deny('This action is not available for the current player status.',409);
  const next={WARN:a.status,UNWARN:a.status,BAN:'banned',UNBAN:'active',FLAG:'flagged',UNFLAG:'active'}[b.action],label={WARN:'Player warned',UNWARN:'Warning removed',BAN:'Player banned',UNBAN:'Player unbanned',FLAG:'Scores flagged',UNFLAG:'Score flag removed'}[b.action];
  db.prepare('UPDATE accounts SET status=? WHERE id=?').run(next,a.playerId);
  if(b.action==='BAN')db.prepare('DELETE FROM sessions WHERE player_id=?').run(a.playerId);
  db.prepare('INSERT INTO dev_player_corrections(player_id,developer_id,field,old_value,new_value,created_at) VALUES(?,?,?,?,?,?)').run(a.playerId,developer,label,a.status,b.reason.trim(),now());
  return detail(a.playerId);
 }
 function flagCase(caseId,reason,developer){
  reason=validateModerationReason(reason);const signal=one('SELECT player_id,match_id FROM review_signals WHERE id=?',caseId);if(!signal)deny('Case not found.',404);const a=account(signal.player_id);
  if(a.playerId===developer||a.role!=='player')deny('Developer and administrator accounts are protected.',403);
  if(!['active','flagged','banned'].includes(a.status))deny('This account status requires review.',409);
  if(a.status!=='banned')db.prepare("UPDATE accounts SET status='flagged' WHERE id=?").run(a.playerId);
  for(const field of ['Scores flagged','Case NOT OK '+caseId])db.prepare('INSERT INTO dev_player_corrections(player_id,developer_id,field,old_value,new_value,match_id,created_at) VALUES(?,?,?,?,?,?,?)').run(a.playerId,developer,field,a.status,reason,signal.match_id,now());
 }
 return {search,detail,correct,moderate,restrict,flagCase,locks};
}

function validOwnerEmail(value){
 if(value.length>254||value!==value.trim())return false;
 const parts=value.split('@');if(parts.length!==2)return false;const [local,domain]=parts;
 return local.length>0&&local.length<=64&&!local.startsWith('.')&&!local.endsWith('.')&&!local.includes('..')&&/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)&&domain.length<=253&&domain.split('.').length>=2&&domain.split('.').every(p=>/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(p))&&/^[a-zA-Z]{2,63}$/.test(domain.split('.').at(-1));
}
