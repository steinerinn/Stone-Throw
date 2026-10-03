import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';
import {openRegistry} from '../server/registry.mjs';import {reviewStore,REVIEW_POLICY} from '../server/anomaly-review.mjs';import {flagReason} from '../dev-room/labels.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-chain-flags-')),registry=openRegistry(dir),db=new DatabaseSync(registry.file),review=reviewStore(db),day=86400000,base=1800000000000;
let checks=0,sequence=0;const equal=(a,b)=>{assert.deepEqual(a,b);checks++;};
async function user(){const ctx={browser:'browser'+sequence,ip:'local'},q=await registry.handle('challenge',{},ctx),n=q.question.match(/\d+/g);return (await registry.handle('register',{username:'ChainTester'+sequence++,password:'Password42',confirmPassword:'Password42',country:'IS',challengeId:q.id,answer:String(+n[0]+ +n[1])},ctx)).account.playerId;}
function match(player,cells,endedAt,{roots=[],complete=true,finalized=1}={}){
 const id='chain-'+sequence++,participants=[{actor:'p0',kind:'account',playerId:player,seat:0},{actor:'p1',kind:'ai',seat:1}],descriptor={id,participants};
 db.prepare('INSERT INTO stat_matches(id,mode,player_count,rules_version,build,started_at,ended_at,descriptor,event_cursor,command_cursor,finalized) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,'Single Player',2,'test','test',endedAt-1000,endedAt,JSON.stringify(descriptor),roots.length+(complete?0:1),0,finalized);
 db.prepare('INSERT INTO stat_participants(match_id,actor,player_id,kind,seat,summary) VALUES(?,?,?,?,?,?)').run(id,'p0',player,'account',0,JSON.stringify({biggestChain:cells}));
 roots.forEach((count,i)=>db.prepare('INSERT INTO stat_facts VALUES(?,?,?,?)').run(id,'event',i,JSON.stringify({index:i,chainId:'root'+i,originActor:'p0',event:{kind:'impact',rootId:'root'+i,statistics:{rootActorId:'p0'},cells:Array.from({length:count},()=>({x:0,y:0}))}})));
 review.retain(id);return id;
}
const signals=id=>review.account(id).signals.filter(s=>s.reason.includes('chain'));
try{
 equal(REVIEW_POLICY.extremeChain,200);equal(REVIEW_POLICY.repeatedChain,150);equal(REVIEW_POLICY.chainWindowDays,7);
 for(const cells of [149,150,199]){const id=await user();match(id,cells,base);equal(signals(id).length,0);}
 for(const cells of [200,225]){const id=await user();match(id,cells,base);equal(signals(id).map(s=>s.reason),['large-chain-observation']);equal(review.account(id).status,'NORMAL');}
 const id=await user(),first=match(id,150,base),second=match(id,199,base+7*day);equal(signals(id).map(s=>s.reason),['repeated-large-chains']);equal(signals(id)[0].measurements.chains.map(c=>c.matchId),[second,first]);review.retain(second);equal(signals(id).length,1);equal(review.account(id).status,'NORMAL');equal(db.prepare('SELECT count(*) n FROM review_pending').get().n,0);equal(flagReason(signals(id)[0]),'Two chains of 150+ cells within 7 days');
 const old=await user();match(old,150,base);match(old,199,base+7*day+1);equal(signals(old).length,0);
 const low=await user();match(low,149,base);match(low,199,base+day);equal(signals(low).length,0);
 const other=await user();match(other,199,base+day);equal(signals(other).length,0);
 const missing=await user();match(missing,180,base,{complete:false});match(missing,180,base+day);equal(signals(missing).length,0);
 const active=await user();match(active,180,base,{finalized:0});match(active,180,base+day);equal(signals(active).length,0);
 const backwards=await user();match(backwards,180,base+day);match(backwards,180,base);equal(signals(backwards).length,0);
 const same=await user();match(same,199,base,{roots:[150,199]});equal(signals(same).map(s=>s.reason),['repeated-large-chains']);equal(signals(same)[0].measurements.chains.map(c=>c.cells),[150,199]);
 const one=await user();match(one,199,base,{roots:[199,149]});equal(signals(one).length,0);
 const audit=JSON.stringify(db.prepare('SELECT * FROM review_signals ORDER BY id').all());review.backfill();equal(JSON.stringify(db.prepare('SELECT * FROM review_signals ORDER BY id').all()),audit);
 console.log(JSON.stringify({passed:true,checks,singleBelow200Ignored:true,two150Within7Days:true,sameMatchChains:true,manualOnly:true,auditPreserved:true}));
}finally{db.close();registry.close();}
