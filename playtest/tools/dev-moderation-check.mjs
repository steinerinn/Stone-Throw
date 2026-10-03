import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {profileFixture} from './profile-fixture.mjs';import {openRegistry} from '../server/registry.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-moderation-')),f=await profileFixture(dir),[owner,admin,player]=f.users;
let r=f.registry,checks=0;const db=new DatabaseSync(r.file),id=player.account.playerId;
for(const [u,role]of [[owner,'developer'],[admin,'admin']])db.prepare('UPDATE accounts SET moderation_role=? WHERE id=?').run(role,u.account.playerId);
const api=(action,b={},token=owner.token)=>r.handle(action,b,{token,ip:'moderation-test',browser:'moderation-browser'}),get=()=>api('dev-player-get',{playerId:id}),edit=async(field,value,operation='edit',token=owner.token)=>api('dev-player-moderate',{playerId:id,revision:(await get()).revision,field,operation,value},token),profile=b=>api('profile',b,player.token);
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;},reject=async(p,status)=>{await assert.rejects(p,e=>e.status===status);checks++;};
try{
 const protectedRow=()=>db.prepare('SELECT id,password_hash,salt,name_changes,next_name_at,qualifying_games FROM accounts WHERE id=?').get(id),before=protectedRow(),beforeStats=(await get()).stats;
 for(const token of [undefined,null,player.token,'f'.repeat(64)])await reject(r.handle('dev-player-moderate',{playerId:id,revision:(await get()).revision,field:'email',operation:'edit',value:'secret@example.com'},{token}),403);
 await edit('email','first@example.com');eq((await get()).player.email,'first@example.com');await edit('email','next+tag@example.org','edit',admin.token);eq((await get()).player.email,'next+tag@example.org');await edit('email','');eq((await get()).player.email,'');
 for(const bad of ['bad','a@localhost','a..b@example.com','a@-bad.com','a@example..com','a@b.c',' x@example.com','a@example.com\n','<x>@example.com'])await reject(edit('email',bad),400);
 await edit('email','private@example.com');eq(db.prepare('SELECT email_verified FROM accounts WHERE id=?').get(id).email_verified,0);
 for(const [field,value]of [['username','TESTMATTI'],['displayName','testraven']])await reject(edit(field,value),400);
 for(const field of ['username','displayName','bio']){
  await edit(field,true,'lock');eq((await get()).player.locks[field],true);const value={username:'OtherLogin',displayName:'OtherName',bio:'Player text'}[field];
  await assert.rejects(profile({[field]:value}),e=>e.status===403&&e.message==='This field has been locked by the game administrator.');checks++;
  const count=(await get()).audit.length;await edit(field,true,'lock');eq((await get()).audit.length,count);
  await edit(field,{username:'CorrectLogin',displayName:'OwnerName',bio:'Owner text'}[field],'edit',admin.token);eq((await get()).player.locks[field],true);
 }
 eq(protectedRow(),before);eq((await get()).stats,beforeStats);
 // Partial updates cannot bypass locks or partly modify another field before rejection.
 const emailBefore=(await get()).player.email;await reject(profile({email:'changed@example.com',bio:'Bypass'}),403);eq((await get()).player.email,emailBefore);
 const current=(await get()).player;await profile({displayName:current.displayName,bio:current.bio});checks++;
 await edit('username',false,'lock');eq((await get()).player.locks.username,false);await reject(profile({username:'PlayerRename'}),400); // Existing permanent-username policy remains.
 await edit('displayName',false,'lock');await profile({displayName:'PlayerName'});eq((await get()).player.displayName,'PlayerName');eq(protectedRow().name_changes,before.name_changes+1);
 await edit('bio',false,'lock');await profile({bio:'Unlocked player text'});eq((await get()).player.bio,'Unlocked player text');await edit('bio','');eq((await get()).player.bio,'');
 for(const bad of ['<script>', 'x'.repeat(281),'x\u0001']){await reject(edit('bio',bad),400);await reject(profile({bio:bad}),400);}
 await edit('username','Sími');const other=await api('dev-player-get',{playerId:admin.account.playerId});await reject(api('dev-player-moderate',{playerId:admin.account.playerId,revision:other.revision,field:'username',operation:'edit',value:'Si\u0301mi'}),400);
 const stale=await get();await edit('bio','New owner text');await reject(api('dev-player-moderate',{playerId:id,revision:stale.revision,field:'email',operation:'edit',value:''}),409);
 const good=await get();for(const patch of [{field:'password_hash'},{operation:'delete'},{value:{}},{extra:'x'},{field:'email',operation:'lock',value:true}])await reject(api('dev-player-moderate',{playerId:id,revision:good.revision,field:'bio',operation:'edit',value:'x',...patch}),400);
 // Audit failure atomically rolls back edits and locks.
 db.exec("CREATE TRIGGER fail_moderation_audit BEFORE INSERT ON dev_player_corrections BEGIN SELECT RAISE(ABORT,'audit failure'); END");
 await assert.rejects(edit('bio','Not saved'),/audit failure/);await assert.rejects(edit('bio',true,'lock'),/audit failure/);eq((await get()).player.bio,good.player.bio);eq((await get()).player.locks.bio,false);db.exec('DROP TRIGGER fail_moderation_audit');checks+=2;
 const audit=(await get()).audit;for(const action of ['Email added','Email changed','Email removed','Username changed','Username locked','Username unlocked','Display Name changed','Display Name locked','Display Name unlocked','Bio edited','Bio cleared','Bio locked','Bio unlocked']){assert.ok(audit.some(a=>a.field===action));checks++;}
 assert.ok(audit.some(a=>a.field==='Username changed'&&a.oldValue==='TestCruns'&&a.newValue==='CorrectLogin'&&a.developer==='TestMatti'));checks++;
 assert.ok(!JSON.stringify(audit).includes('@'));checks++;
 for(const body of [(await get()),await api('dev-player-search',{query:'Sími'})]){assert.ok(!/password_hash|salt|token|session|security/i.test(JSON.stringify(body)));checks++;}
 for(const token of [null,owner.token,player.token]){const publicView=await api('profile-view',{section:'overview',playerId:id},token);assert.ok(!JSON.stringify(publicView).includes('private@example.com'));assert.ok(!JSON.stringify(publicView).includes('dev_player'));checks+=2;}
 const own=await api('me',{},player.token);eq(own.account.fieldLocks,{username:false,displayName:false,bio:false});assert.ok(!JSON.stringify(own).includes('developer_id'));checks++;
 for(const field of ['username','displayName','bio'])await edit(field,true,'lock');r.close();r=openRegistry(dir);eq((await get()).player.locks,{username:true,displayName:true,bio:true});eq((await get()).player.email,'private@example.com');await reject(profile({bio:'After restart'}),403);
 await reject(api('login',{username:'TestCruns',password:'Password42'},null),401);
 const login=await api('login',{username:'Sími',password:'Password42'},null);eq(login.account.playerId,id);eq(protectedRow().password_hash,before.password_hash);eq(protectedRow().salt,before.salt);eq((await get()).stats,beforeStats);
 console.log(JSON.stringify({passed:true,checks,isolatedRegistry:dir,locksPersist:true,atomicAudit:true,identityPreserved:true}));
}finally{db.close();r.close();}
