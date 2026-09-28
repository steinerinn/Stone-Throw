import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';
import {openRegistry} from '../server/registry.mjs';import {reviewStore} from '../server/anomaly-review.mjs';import {shotAudit} from '../canonical/compiled/host/shot-audit.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-anomaly-'));let registry=openRegistry(dir);const context={browser:'a'.repeat(48),ip:'same-household'};
async function register(username){const c=await registry.handle('challenge',{},context),n=c.question.match(/\d+/g);return registry.handle('register',{username,password:'Password42',confirmPassword:'Password42',country:'IS',challengeId:c.id,answer:String(+n[0]+ +n[1])},context);}
const user=await register('AuditPlayer'),dev=await register('AuditDeveloper'),id=user.account.playerId;
let db=new DatabaseSync(registry.file);db.exec('PRAGMA foreign_keys=ON');db.prepare("UPDATE accounts SET moderation_role='developer' WHERE id=?").run(dev.account.playerId);let review=reviewStore(db);let checks=0;const check=(v)=>{assert.ok(v);checks++;};
const api=(action,body={},token=dev.token)=>registry.handle(action,body,{...context,token});
function add(name,{types=['inf','archer'],known=[false,false],units=['u1','u2'],score=1000,historical=false,finalized=1}={}){
 const d={id:name,mode:'Single Player',startedAt:1,endedAt:Date.now(),classification:{mode:'single',participantCount:2,format:'duel'},participants:[{actor:'p0',seat:0,kind:'account',playerId:id,outcome:'Win',reliability:'Full'},{actor:'p1',seat:1,kind:'ai',outcome:'Loss'}]};
 db.prepare('INSERT INTO stat_matches(id,mode,player_count,rules_version,build,started_at,ended_at,descriptor,event_cursor,command_cursor,finalized) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(name,d.mode,2,'test','test',1,d.endedAt,JSON.stringify(d),3,2,finalized);
 const summary={outcome:'Win',reliability:'Full',shots:2,hits:2,awards:[],biggestChain:30};
 db.prepare('INSERT INTO stat_participants(match_id,actor,player_id,kind,seat,outcome,reliability,summary,match_score,score_formula_version,score_components) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(name,'p0',id,'account',0,'Win','Full',JSON.stringify(summary),score,'MATCH_SCORE_V1',JSON.stringify({completed:true,issues:[]}));
 for(let i=0;i<2;i++){const event={kind:'impact',unitId:units[i],meta:{ownerId:'p0',source:i?'direct-ai':'direct-human'},statistics:{unitType:types[i]},cells:[{x:i,y:0}]};db.prepare('INSERT INTO stat_facts VALUES(?,?,?,?)').run(name,'event',i,JSON.stringify({index:i,event}));const command={sequence:i+1,eventStart:i,eventEnd:i+1,command:{kind:'shoot',actorId:'p0',boardId:'b1',cell:{x:i,y:0}},...(!historical?{shotAudit:{version:1,unitId:units[i],unitType:types[i],core:types[i]!=='hero',hit:true,previouslyKnown:known[i],unitPreviouslyKnown:known[i]}}:{})};db.prepare('INSERT INTO stat_facts VALUES(?,?,?,?)').run(name,'command',i,JSON.stringify(command));}
 db.prepare('INSERT INTO stat_facts VALUES(?,?,?,?)').run(name,'event',2,JSON.stringify({index:2,event:{kind:'impact',unitId:'dragon-hit',meta:{source:'dragon',ownerId:'p0'},statistics:{unitType:'inf'}}}));
 review.retain(name);return d;
}
try{
 check(review.account(id).totalSignals===0);check((await api('review-notice',{},user.token)).notice===null);
 add('castle',{types:['castle','castle'],units:['castle','castle'],known:[false,true]});check(review.account(id).totalSignals===0);
 add('scouted',{known:[true,true]});check(review.account(id).totalSignals===0);
 add('old',{historical:true});check(review.account(id).totalSignals===0);
 add('independent');let summary=review.account(id);check(summary.signals.some(s=>s.reason==='two-independent-unknown-core-openers'));check(summary.status==='NORMAL');check((await api('review-notice',{},user.token)).notice===null);check(summary.matches.every(m=>m.metrics.shots===2));
 add('independent-again');check(review.account(id).reviewWeight===20);check(review.account(id).status==='NORMAL');
 await assert.rejects(api('dev-review-account',{playerId:id},user.token),e=>e.status===403);checks++;
 registry.completeStory(id,{battle:20,finished:true});
 const baseline=registry.statistics.globalHallOfFame('All',id,{bypass:true}).topScores.all[0].value;
 await api('dev-review-decide',{playerId:id,action:'REVIEW'});check((await api('review-notice',{},user.token)).notice.status==='REVIEW');check((await api('review-notice',{},dev.token)).notice===null);check(registry.identity(user.token).playerId===id);
 add('pending',{score:5000});check(registry.statistics.globalHallOfFame('All',id,{bypass:true}).topScores.all[0].value===baseline);check(db.prepare("SELECT status FROM review_pending WHERE match_id='pending'").get().status==='PENDING REVIEW');check(db.prepare("SELECT match_score FROM stat_participants WHERE match_id='pending'").get().match_score===5000);
 const details=await api('dev-review-match',{matchId:'pending'});check(details.participants[0].shots.length===2);check(!/password|salt|email|token|seed|initialPlacements/.test(JSON.stringify(details)));
 await api('dev-review-decide',{playerId:id,action:'KEEP UNDER REVIEW'});await api('dev-review-decide',{playerId:id,action:'CLEAR'});check((await api('review-notice',{},user.token)).notice===null);check(registry.statistics.globalHallOfFame('All',id,{bypass:true}).topScores.all[0].value===5000);check(review.account(id).reviewWeight===0);check(review.account(id).totalSignals>0);check(review.account(id).decisions.length===3);
 add('new-after-clear');check(review.account(id).status==='CLEARED');check(review.account(id).reviewWeight===10);
 assert.throws(()=>db.exec("DELETE FROM stat_facts WHERE match_id='castle'"),/Retained review/);checks++;assert.throws(()=>db.exec("DELETE FROM stat_matches WHERE id='castle'"),/Retained review/);checks++;
 add('live',{finalized:0});const request={contract:'c',battle:'b',revision:1,intent:{kind:'shoot',cell:{x:-1,y:0}}},result={accepted:false,error:'illegal',snapshot:{contract:'c',battle:'b',revision:1}};
 for(const error of ['stale','unsupported'])review.rejected({playerId:id,matchId:'live',request,result:{...result,error},size:15});check(review.account(id).technicalSignals===0);
 review.rejected({playerId:id,matchId:'live',request,result,size:15});review.rejected({playerId:id,matchId:'live',request,result,size:15});check(review.account(id).technicalSignals===1);check(review.account(id).status==='CLEARED');
 const sample={state:{seats:[{boardId:'b',occupied:['1,1'],shots:[]}],match:{units:[{id:'castle',type:'castle',boardId:'b',lifecycle:'present',cells:[{x:1,y:1},{x:1,y:2}],damage:{cells:[]},hero:null}],knowledge:{p:{boards:{b:{boardId:'b',cells:[],contacts:[],clues:[]}}}}}}};
 const command={kind:'shoot',actorId:'p',boardId:'b',cell:{x:1,y:1}};const before=JSON.stringify(sample);check(shotAudit(sample,command).unitPreviouslyKnown===false);check(JSON.stringify(sample)===before);sample.state.match.units[0].damage.cells.push({x:1,y:2});check(shotAudit(sample,command).unitPreviouslyKnown===true);sample.state.match.units[0].damage.cells=[];sample.state.match.knowledge.p.boards.b.cells.push({cell:{x:1,y:2},observation:'occupied'});check(shotAudit(sample,command).unitPreviouslyKnown===true);
 check((await api('dev-review-search',{metric:'firstTwoIndependentCore'})).length>0);
 db.close();registry.close();registry=openRegistry(dir);db=new DatabaseSync(registry.file);review=reviewStore(db);check(review.account(id).status==='CLEARED');check(review.account(id).technicalSignals===1);check(review.account(id).decisions.length===3);check(registry.identity(user.token).playerId===id);
 console.log(JSON.stringify({passed:true,checks,hiddenSignalsNeverHold:true,manualReviewOnly:true,castleAndScoutExcluded:true,chainsExcluded:true,persistence:true,isolatedRegistry:true}));
}finally{db.close();registry.close();}
