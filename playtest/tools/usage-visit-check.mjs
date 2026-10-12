import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {openRegistry} from '../server/registry.mjs';
import {usageVisits} from '../server/usage-visit.mjs';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-usage-check-'));
let time=Date.now(),checks=0;
const r=openRegistry(dir,{now:()=>time}),db=new DatabaseSync(r.file),ctx={browser:'guest-browser',ip:'test-ip'};
const call=(body={},context=ctx)=>r.handle('usage-visit',body,context);
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
try{
 eq(await call(),{recorded:true});
 eq(db.prepare('SELECT count(*) n FROM dev_usage_visits').get().n,1);
 await assert.rejects(call({accountId:'forged'}),e=>e.status===400);checks++;
 await assert.rejects(call({playing:'yes'}),e=>e.status===400);checks++;
 const challenge=await r.handle('challenge',{},ctx),n=challenge.question.match(/\d+/g).map(Number);
 const registered=await r.handle('register',{challengeId:challenge.id,answer:n[0]+n[1],username:'UsageTester',password:'Password42',confirmPassword:'Password42',country:'IS'},ctx);
 const auth={...ctx,token:registered.token};
 await call({playing:true},auth);
 eq(db.prepare('SELECT count(*) n FROM dev_usage_visits').get().n,1);
 eq(db.prepare('SELECT account_id FROM dev_usage_visits').get().account_id,registered.account.playerId);
 const seen=db.prepare('SELECT last_seen FROM dev_usage_visits').get().last_seen;
 time+=1000;await call({},auth);eq(db.prepare('SELECT last_seen FROM dev_usage_visits').get().last_seen,seen);
 time+=30001;await call({},auth);eq(db.prepare('SELECT last_seen FROM dev_usage_visits').get().last_seen,time);
 const reset=db.prepare('SELECT reset FROM limits WHERE key=?').get('usage:test-ip').reset;
 db.prepare('UPDATE limits SET count=23999 WHERE key=?').run('usage:test-ip');
 const outcomes=await Promise.allSettled([call({},auth),call({},auth)]);
 eq(outcomes.map(x=>x.status),['fulfilled','rejected']);eq(outcomes[1].reason.status,429);
 eq(db.prepare('SELECT count,reset FROM limits WHERE key=?').get('usage:test-ip'),Object.assign(Object.create(null),{count:24000,reset}));
 time=reset;await call({},auth);eq(db.prepare('SELECT count FROM limits WHERE key=?').get('usage:test-ip').count,1);
 await r.handle('logout',{},auth);time+=3600000;await call({},auth);
 eq(db.prepare('SELECT account_id FROM dev_usage_visits ORDER BY hour DESC LIMIT 1').get().account_id,null);
 eq(await r.handle('review-notice',{},auth),{notice:null,playerId:null});
 // A real transaction failure must roll back visitor writes and reject, never report success.
 db.exec("CREATE TRIGGER reject_usage BEFORE INSERT ON dev_usage_visits BEGIN SELECT RAISE(ABORT,'test visitor failure'); END;");
 await assert.rejects(call({}, {...ctx,browser:'new-browser'}),/test visitor failure/);checks++;
 db.exec('DROP TRIGGER reject_usage');eq(await call({}, {...ctx,browser:'new-browser'}),{recorded:true});
 const broken=usageVisits(path.join(dir,'missing','registry.sqlite'));
 await assert.rejects(broken.visit({},ctx));checks++;
 await assert.rejects(broken.visit({},ctx));checks++;broken.close();
}finally{db.close();r.close();}
await assert.rejects(call(),/closed/);checks++;
console.log(JSON.stringify({passed:true,checks,dir}));
