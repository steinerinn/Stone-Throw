import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';
import {profileFixture} from './profile-fixture.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-dev-counts-')),f=await profileFixture(dir),db=new DatabaseSync(f.registry.file),[admin,player]=f.users;let checks=0;
db.prepare("UPDATE accounts SET moderation_role='admin' WHERE id=?").run(admin.account.playerId);
const api=(action,b={})=>f.registry.handle(action,b,{token:admin.token}),match=(await api('dev-review-search'))[0].matchId;
try{
 for(let i=0;i<57;i++)db.prepare("INSERT INTO feedback(id,type,status,created_at,build,description) VALUES(?,?,?,?,?,?)").run('f'+i,i<53?'BUG':'IDEA',i<52?'NEW':i<55?'REVIEWED':'RESOLVED',i,'test','Feedback '+i);
 let result=await api('dev-feedback-list',{type:'ALL',status:'NEW'});assert.equal(result.items.length,50);assert.deepEqual(result.counts,{types:{ALL:57,BUG:53,IDEA:4},statuses:{NEW:52,REVIEWED:3,RESOLVED:2}});checks+=2;
 result=await api('dev-feedback-list',{type:'BUG',status:'REVIEWED'});assert.equal(result.items.length,1);assert.deepEqual(result.counts.statuses,{NEW:52,REVIEWED:3,RESOLVED:2});checks+=2;
 await api('dev-feedback-status',{id:'f0',status:'RESOLVED'});result=await api('dev-feedback-list',{type:'ALL',status:'NEW'});assert.equal(result.counts.types.ALL,57);assert.equal(result.counts.statuses.RESOLVED,3);checks+=2;
 const globalCounts=result.counts;for(const type of ['ALL','BUG','IDEA'])for(const status of ['NEW','REVIEWED','RESOLVED']){assert.deepEqual((await api('dev-feedback-list',{type,status})).counts,globalCounts);checks++;}
 // Clear fixture observations first, then add controlled append-only signals.
 for(const u of f.users)await api('dev-review-decide',{playerId:u.account.playerId,action:'CLEAR'});
 const signal=(reason,type)=>db.prepare('INSERT INTO review_signals(player_id,match_id,type,reason,weight,created_at,measurements) VALUES(?,?,?,?,?,?,?)').run(player.account.playerId,match,type,reason,1,Date.now(),'{}');signal('fixture-one','STATISTICAL');signal('fixture-two','TECHNICAL');
 let flags=await api('dev-review-search',{scope:'attention'});assert.equal(flags.unresolvedSignals,2);assert.equal(flags.items[0].technicalSignals,1);assert.equal(flags.attentionAccounts,1);checks+=3;const globalFlags=await api('dev-review-search',{scope:'flags'});assert.equal(globalFlags.counts.attention,2);assert.equal(globalFlags.items.filter(r=>r.status==='FLAGGED').length,2);assert.ok(globalFlags.items.every(r=>r.displayName&&r.matchId&&r.mode&&r.timestamp!==undefined));checks+=3;
 await api('dev-review-account',{playerId:player.account.playerId});assert.equal((await api('dev-review-search',{scope:'attention'})).unresolvedSignals,2);checks++;
 await api('dev-review-decide',{playerId:player.account.playerId,action:'REVIEW'});flags=await api('dev-review-search',{scope:'attention'});assert.equal(flags.items[0].status,'REVIEW');assert.equal(flags.unresolvedSignals,2);checks+=2;assert.equal((await api('dev-review-search',{scope:'flags'})).counts.review,2);checks++;
 await api('dev-review-decide',{playerId:player.account.playerId,action:'KEEP UNDER REVIEW'});assert.equal((await api('dev-review-search',{scope:'attention'})).unresolvedSignals,2);checks++;
 await api('dev-review-decide',{playerId:player.account.playerId,action:'CLEAR'});assert.equal((await api('dev-review-search',{scope:'attention'})).unresolvedSignals,0);const clearedFlags=await api('dev-review-search',{scope:'flags'});assert.equal(clearedFlags.counts.attention,0);assert.equal(clearedFlags.counts.all,globalFlags.counts.all);assert.ok(clearedFlags.items.every(r=>r.status==='CLEARED'));checks+=3;signal('fixture-later','TECHNICAL');assert.equal((await api('dev-review-search',{scope:'attention'})).unresolvedSignals,1);checks+=2;
 await assert.rejects(f.registry.handle('dev-review-search',{scope:'attention'},{token:player.token}),e=>e.status===403);await assert.rejects(f.registry.handle('dev-review-search',{scope:'flags'},{token:player.token}),e=>e.status===403);checks++;
 await assert.rejects(f.registry.handle('dev-feedback-list',{},{}),e=>e.status===403);checks+=2;
 console.log(JSON.stringify({passed:true,checks,countsAcrossAllPages:true,clearWatermark:true}));
}finally{db.close();f.registry.close();}
