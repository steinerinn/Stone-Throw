import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';
import {profileFixture} from './profile-fixture.mjs';import {openRegistry} from '../server/registry.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-restrictions-')),f=await profileFixture(dir),[player,admin,owner]=f.users,id=player.account.playerId;let r=f.registry,checks=0;
const db=new DatabaseSync(r.file);for(const [u,role]of [[owner,'developer'],[admin,'admin']])db.prepare('UPDATE accounts SET moderation_role=? WHERE id=?').run(role,u.account.playerId);
const api=(action,b={},token=owner.token)=>r.handle(action,b,{token,browser:'restriction-test',ip:'restriction-test'}),get=()=>api('dev-player-get',{playerId:id}),act=async(action,reason='Owner private reason',token=owner.token)=>api('dev-player-restrict',{playerId:id,revision:(await get()).revision,action,reason},token);
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;},reject=async(p,status)=>{await assert.rejects(p,e=>e.status===status);checks++;};
const leaderboard=()=>JSON.stringify(r.statistics.globalHallOfFame('All',id,{now:1800000000000})),protectedData=()=>JSON.stringify({account:db.prepare('SELECT id,password_hash,salt,streak,longest_streak FROM accounts WHERE id=?').get(id),matches:db.prepare('SELECT * FROM stat_participants WHERE player_id=? ORDER BY match_id').all(id),review:db.prepare('SELECT * FROM review_accounts WHERE player_id=?').all(id)});
try{
 const original=protectedData();assert.ok(leaderboard().includes(id));checks++;
 for(const token of [null,player.token,'f'.repeat(64)])await reject(act('BAN','Private reason',token),403);
 for(const reason of ['', '  ', 'x'.repeat(501),'<script>','a\u0001'])await reject(act('BAN',reason),400);
 for(const u of [owner,admin]){const d=await api('dev-player-get',{playerId:u.account.playerId});await reject(api('dev-player-restrict',{playerId:u.account.playerId,revision:d.revision,action:'BAN',reason:'test'}),403);}
 await act('WARN','Please follow the rules');eq((await api('me',{},player.token)).account.moderationNotice,{kind:'WARNING',reason:'Please follow the rules'});eq((await api('profile-view',{playerId:id},player.token)).moderationNotice.kind,'WARNING');eq((await api('profile-view',{playerId:id},null)).moderationNotice,undefined);eq(r.identity(player.token).displayName,player.account.displayName);assert.ok(leaderboard().includes(id));checks++;
 await act('UNWARN','Warning withdrawn');eq((await api('me',{},player.token)).account.moderationNotice,null);
 const stale=await get();await act('FLAG');eq((await get()).player.status,'flagged');eq(r.identity(player.token).playerId,id);eq(r.identityById(id).playerId,id);assert.ok(!leaderboard().includes(id));checks++;
 for(const mode of ['Duel','3 Players','4 Players']){assert.ok(!JSON.stringify(r.statistics.hallOfFame(mode,id)).includes('"playerId":"'+id+'"'));assert.ok(!JSON.stringify(r.statistics.leaderboard(mode)).includes(id));checks+=2;}
 const publicView=await api('profile-view',{playerId:id},null);eq(publicView.core.lifetimeScore,null);eq(publicView.core.highestScore,null);assert.ok(publicView.recent.every(v=>v.score===null));assert.ok(publicView.statistics.every(v=>v.averageScore===null&&v.highestScore===null));assert.ok(!JSON.stringify(publicView).includes('Owner private reason'));checks+=3;
 assert.ok((await api('profile-view',{playerId:id},player.token)).core.lifetimeScore>0);checks++;
 await api('profile',{bio:'Still able to edit'},player.token);const login=await api('login',{username:player.account.username,password:'Password42'},null);eq(login.account.playerId,id);
 await reject(api('dev-player-restrict',{playerId:id,revision:stale.revision,action:'BAN',reason:'stale'}),409);
 await act('UNFLAG','Restore visibility',admin.token);assert.ok(leaderboard().includes(id));checks++;
 // A failed audit must roll back both account restriction and session revocation.
 db.exec("CREATE TRIGGER reject_restriction BEFORE INSERT ON dev_player_corrections BEGIN SELECT RAISE(ABORT,'test audit failure'); END");await assert.rejects(act('BAN'),/test audit failure/);eq((await get()).player.status,'active');eq(r.identity(login.token).playerId,id);db.exec('DROP TRIGGER reject_restriction');checks++;
 // Ban during an in-flight password check cannot create a fresh valid session.
 const pending=api('login',{username:player.account.username,password:'Password42'},null);await act('BAN');await reject(pending,401);
 eq((await get()).player.status,'banned');eq(r.identity(login.token),null);eq(db.prepare('SELECT count(*) n FROM sessions WHERE player_id=?').get(id).n,0);assert.ok(!leaderboard().includes(id));checks++;
 await reject(api('login',{username:player.account.username,password:'Password42'},null),401);await reject(api('profile',{bio:'Bypass'},login.token),401);await reject(api('profile-view',{playerId:id},null),404);
 const match=(await get()).recent.find(v=>v.replayAvailable);assert.ok(await api('dev-review-result',{matchId:match.matchId}));assert.ok(await api('dev-review-replay',{matchId:match.matchId}));checks+=2;
 r.close();r=openRegistry(dir);eq((await get()).player.status,'banned');eq(r.identity(login.token),null);
 await act('UNBAN','Appeal accepted');eq((await get()).player.status,'active');eq(r.identity(login.token),null);assert.ok(leaderboard().includes(id));checks++;
 const after=protectedData();eq(after,original); // Login happened on same fixture clock day; passwords, match/review evidence unchanged.
 const audit=(await get()).audit;for(const label of ['Player banned','Player unbanned','Scores flagged','Score flag removed'])assert.ok(audit.some(v=>v.field===label&&v.developer&&v.newValue));checks+=4;
 const fresh=await api('login',{username:player.account.username,password:'Password42'},null);eq(fresh.account.playerId,id);
 await act('FLAG');r.close();r=openRegistry(dir);eq((await get()).player.status,'flagged');eq(r.identity(fresh.token).playerId,id);assert.ok(!leaderboard().includes(id));checks++;

 eq((await api('profile-view',{playerId:id},fresh.token)).moderationNotice,{kind:'FLAG',reason:'Owner private reason'});eq(r.moderationNotice(null),null);
 await act('UNFLAG','Check case workflow');const matchId=(await get()).recent[0].matchId,caseId=Number(db.prepare("INSERT INTO review_signals(player_id,match_id,type,reason,weight,created_at,measurements) VALUES(?,?,'TECHNICAL','restriction-fixture',1,?, '{}')").run(id,matchId,Date.now()).lastInsertRowid);
 await reject(api('dev-review-decide',{caseId,action:'NOT OK'}),400);eq((await get()).player.status,'active');eq(db.prepare('SELECT count(*) n FROM review_case_decisions WHERE signal_id=?').get(caseId).n,0);
 db.exec("CREATE TRIGGER reject_case BEFORE INSERT ON review_case_decisions BEGIN SELECT RAISE(ABORT,'case failure'); END");await assert.rejects(api('dev-review-decide',{caseId,action:'NOT OK',reason:'Case reason'}),/case failure/);eq((await get()).player.status,'active');db.exec('DROP TRIGGER reject_case');checks++;
 await api('dev-review-decide',{caseId,action:'NOT OK',reason:'This match was not OK'});eq((await get()).player.status,'flagged');eq(r.moderationNotice(fresh.token),{kind:'FLAG',reason:'This match was not OK'});eq((await api('dev-review-search',{scope:'cases'})).items.find(c=>c.id===caseId).ownerReason,'This match was not OK');assert.ok((await get()).audit.some(a=>a.matchId===matchId&&a.newValue==='This match was not OK'));checks++;
 await api('dev-review-decide',{caseId,action:'OK'});eq((await get()).player.status,'flagged');await act('BAN');await api('dev-review-decide',{caseId,action:'NOT OK',reason:'Further evidence'});eq((await get()).player.status,'banned');
 console.log(JSON.stringify({passed:true,checks,isolatedRegistry:dir,reasonAudit:true,atomicBan:true,loginRace:true,evidencePreserved:true}));
}finally{db.close();r.close();}
