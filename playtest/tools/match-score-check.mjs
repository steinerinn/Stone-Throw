import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {calculateScores,numeric,rational,add,scoreCareer} from '../server/match-score.mjs';
import {migrateScores,persistScores,backfillScores,scoreReadModel} from '../server/score-store.mjs';
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
function descriptor(n=3,kinds=['account','account','ai']){return {id:'match-a',mode:n===2?'Duel':n+' Players',startedAt:1,endedAt:2,finalResult:{outcome:'win',placements:Object.fromEntries(Array.from({length:n},(_,i)=>['p'+i,i+1]))},participants:Array.from({length:n},(_,i)=>({actor:'p'+i,seat:i,kind:kinds[i]||'ai',playerId:kinds[i]==='account'?'account'+i:null,reliability:'Full',outcome:i?'Loss':'Win'}))};}
function shot(index,{actor='p0',hit=false,type='inf',source='direct-human',root='r'+index,unitId='unit'+index}={}){return {index,eventId:'event'+index,chainId:root,originActor:actor,event:{kind:'impact',rootId:root,workId:'w'+index,cells:[{x:index%15,y:0}],unitId:hit?unitId:null,meta:{ownerId:actor,source},statistics:{unitType:hit?type:null,rootActorId:actor}}};}
const component=(r,key)=>numeric(r.scores[0].components[key]);
for(const n of [2,3,4]){const r=calculateScores(descriptor(n),[]);eq(component(r,'completion'),500);eq(component(r,'placement'),{2:200,3:250,4:300}[n]);}
for(const hits of [0,1,2,3,4,8]){const fs=Array.from({length:10},(_,i)=>shot(i,{hit:i<hits}));eq(component(calculateScores(descriptor(),fs),'efficiency'),Math.min(100,hits*25));}
eq(component(calculateScores(descriptor(),[]),'efficiency'),0);
const chain=Array.from({length:170},(_,i)=>shot(i,{root:'chain',source:'dragon'}));eq(component(calculateScores(descriptor(),chain),'biggestChain'),170);
let d=descriptor(),fs=[shot(0),shot(1,{actor:'p1'}),shot(2,{actor:'p1'})];eq(component(calculateScores(d,fs),'fewerShots'),100);eq(component(calculateScores(d,fs.slice(0,2)),'fewerShots'),0);
eq(component(calculateScores(descriptor(2,['account','ai']),fs),'fewerShots'),0);
fs=[shot(0,{hit:true,type:'catapult'}),shot(1,{hit:true,type:'wizard',source:'plague'}),shot(2,{hit:true,type:'wizard',source:'archer'}),shot(3,{hit:true,type:'wizard',source:'dragon'}),shot(4,{hit:true,type:'hero',unitId:'hero'}),{index:5,event:{kind:'hero-activated',unitId:'hero',statistics:{}}},shot(6,{hit:true,type:'hero',unitId:'hero'})];
eq(component(calculateScores(d,fs),'directSpecialPenalty'),-20);
// With a single ordinary miss per participant, Blind One and Chain Master tie.
for(const n of [2,3,4]){d=descriptor(n);fs=Array.from({length:n},(_,i)=>shot(i,{actor:'p'+i}));eq(component(calculateScores(d,fs),'awardBonus'),20/n);}
d=descriptor(2);fs=[shot(0)];eq(component(calculateScores(d,fs),'awardBonus'),20);
d=descriptor();d.finalResult.placements={p0:1,p1:1,p2:2};eq(calculateScores(d,[]).scores.map(s=>s.placement),[1,1,2]);
for(const reliability of ['Quit','Disconnect','Kick']){d=descriptor();Object.assign(d.participants[0],{reliability,cutoff:1});fs=[shot(0,{hit:true}),shot(1,{hit:true,type:'catapult',root:'r0'}),shot(2,{hit:true,type:'catapult'})];const r=calculateScores(d,fs);for(const k of ['completion','placement','fewerShots','awardBonus','directSpecialPenalty'])eq(component(r,k),0);eq(component(r,'biggestChain'),1);eq(component(r,'efficiency'),100);eq(r.scores[0].participation,'Disconnect/Abandon');}
d=descriptor();d.reliabilityEvents=[{kind:'disconnected'},{kind:'rejoined'}];eq(component(calculateScores(d,[]),'completion'),500);
for(const [n,human]of [[2,1],[3,1],[3,2],[4,1],[4,2],[4,3]])for(const winner of ['player','ai']){d=descriptor(n,Array.from({length:n},(_,i)=>i<human?'account':'ai'));d.finalResult.placements=Object.fromEntries(d.participants.map((p,i)=>[p.actor,i===(winner==='player'?0:human)?1:2]));const f=calculateScores(d,[]).faction;eq(f[winner==='player'?'playerUnits':'aiUnits'],6*n/(winner==='player'?human:n-human));}
d=descriptor(4,['account','account','ai','ai']);d.finalResult.placements={p0:1,p1:1,p2:2,p3:2};eq(calculateScores(d,[]).faction.playerUnits,12);d.finalResult.placements.p2=1;eq(calculateScores(d,[]).faction.playerUnits,0);d.finalResult.outcome='draw';eq(calculateScores(d,[]).faction.aiUnits,0);
d=descriptor(2,['account','account']);eq(calculateScores(d,[]).faction.qualifying,false);d.mode='Story';eq(calculateScores(d,[]).faction.qualifying,false);
d=descriptor(2,['account','ai']);d.participants[0].takeover='disconnect';d.participants[0].reliability='Disconnect';d.participants[0].cutoff=0;eq(calculateScores(d,[]).faction.playerUnits,12);
eq(add(add(rational(10,3),rational(10,3)),rational(10,3)),rational(10));
const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE stat_matches(id TEXT PRIMARY KEY,descriptor TEXT,event_cursor INTEGER,finalized INTEGER,started_at INTEGER);CREATE TABLE stat_facts(match_id TEXT,kind TEXT,sequence INTEGER,payload TEXT);CREATE TABLE stat_participants(match_id TEXT,actor TEXT,player_id TEXT,match_score REAL,score_formula_version TEXT);');migrateScores(db);d=descriptor();db.prepare('INSERT INTO stat_matches VALUES(?,?,0,1,1)').run(d.id,JSON.stringify(d));for(const p of d.participants)db.prepare('INSERT INTO stat_participants(match_id,actor,player_id) VALUES(?,?,?)').run(d.id,p.actor,p.playerId);const dry=backfillScores(db);eq(db.prepare('SELECT match_score FROM stat_participants LIMIT 1').get().match_score,null);eq(backfillScores(db,{apply:true}),dry);const before=scoreReadModel(db,'account0');backfillScores(db,{apply:true});eq(scoreReadModel(db,'account0'),before);persistScores(db,d,[]);eq(scoreReadModel(db,'account0'),before);eq(before.scoredMatchCount,1);db.close();
const high=calculateScores(descriptor(),chain).scores[0];high.exact=rational(1000);eq(scoreCareer([high]).thousandPlusCount,1);high.completed=false;eq(scoreCareer([high]).thousandPlusCount,0);
d=descriptor(2,['account','ai']);d.mode='Story';eq(calculateScores(d,[]).faction.qualifying,false);d.mode='Single Player';d.endedAt=null;eq(calculateScores(d,[]).faction.qualifying,false);eq(calculateScores(d,[]).scores[0].score,null);
d=descriptor();fs=[shot(0,{hit:true,type:'catapult'}),{...shot(1,{hit:true,type:'catapult'}),eventId:'event0'}];eq(component(calculateScores(d,fs),'directSpecialPenalty'),-10);
eq(numeric(calculateScores(d,[]).scores[1].components.fewerShots),0);
// Guest and AI scores use the same performance components, with no AI career identity.
d=descriptor(2,['guest','ai']);fs=[shot(0,{actor:'p1',hit:true,type:'catapult',source:'direct-ai'})];const aiResult=calculateScores(d,fs);eq(aiResult.scores.length,2);eq(numeric(aiResult.scores[1].components.efficiency),100);eq(numeric(aiResult.scores[1].components.directSpecialPenalty),-10);eq(numeric(aiResult.scores[1].components.completion),500);eq(numeric(aiResult.scores[1].components.fewerShots),0);eq(aiResult.scores[0].issues,[]);
console.log(JSON.stringify({passed:true,checks}));
