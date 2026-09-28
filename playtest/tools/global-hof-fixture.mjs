import {openRegistry} from '../server/registry.mjs';
import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';
// Synthetic authoritative-table fixtures in an isolated test Registry only.
export async function hofFixture(directory,now=Date.now()){
 const registry=openRegistry(directory),options={browser:'b'.repeat(48),ip:'hof-fixture'},c=await registry.handle('challenge',{},options),n=c.question.match(/\d+/g);
 const user=await registry.handle('register',{username:'HofReviewer',password:'Password42',confirmPassword:'Password42',country:'IS',challengeId:c.id,answer:String(+n[0]+ +n[1])},options);
 const db=new DatabaseSync(path.join(directory,'registry.sqlite')),template=db.prepare('SELECT * FROM accounts WHERE id=?').get(user.account.playerId),ids=[];
 const names=['Einar','Freya','Bjorn','Astrid','Magnus','Sigrid','Leif','Ingrid','Ragnar','Solveig','Erik','Helga','Olaf','Kari','Arne','Liv','Harald','Runa','Ivar','Sif','Gunnar','Yrsa','Hakon','HofReviewer','Matti','Vondur'];
 for(let i=0;i<26;i++){const id=i===23?user.account.playerId:'hof-public-'+String(i).padStart(2,'0');ids.push(id);if(i===23)continue;const row={...template,id,username:'Fixture'+i,username_key:'fixture'+i,display_name:names[i],display_key:names[i].toLowerCase(),country:['IS','NO','GB','DE','FI','SE'][i%6],email:'private-fixture@example.invalid'};const keys=Object.keys(row);db.prepare('INSERT INTO accounts('+keys.join(',')+') VALUES('+keys.map(()=>'?').join(',')+')').run(...Object.values(row));}
 const date=new Date(now),month=Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),1),year=Date.UTC(date.getUTCFullYear(),0,1);
 let serial=0;
 function add({i=0,count=2,j=0,score=1000,at=month+1000,mode=j%2?'single':'online',kind='account',completed=true,reliability='Full',cutoff,classified=true,issues=[],finalized=1}){
  const id='hof-match-'+(++serial),label=mode==='single'?'Single Player':{2:'Duel',3:'3 Players',4:'4 Players'}[count],actor='actor',participant={actor,seat:0,kind,playerId:kind==='account'?ids[i]:null,reliability,...(cutoff===undefined?{}:{cutoff})};
  const descriptor={id,mode:label,endedAt:at,participants:[participant],...(classified?{classification:{mode,participantCount:count,format:count===2?'duel':count+'p'}}:{})};
  const summary={outcome:j<29-i?'Win':'Loss',reliability,awards:[],shots:100,hits:20+i,bestHitStreak:2,bestMissStreak:3,biggestChain:5};
  db.prepare('INSERT INTO stat_matches(id,mode,player_count,rules_version,build,started_at,ended_at,descriptor,finalized) VALUES(?,?,?,?,?,?,?,?,?)').run(id,label,count,'test','test',at-1000,at,JSON.stringify(descriptor),finalized);
  db.prepare('INSERT INTO stat_participants(match_id,actor,player_id,kind,seat,outcome,reliability,summary,match_score,score_formula_version,score_components) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,actor,kind==='account'?ids[i]:null,kind,0,summary.outcome,reliability,JSON.stringify(summary),score,'MATCH_SCORE_V1',JSON.stringify({completed,issues,exact:{n:String(Math.round(score*10)),d:"10"}}));
 }
 db.exec('BEGIN');for(let i=0;i<26;i++)for(const count of [2,3,4])for(let j=0;j<30;j++)add({i,count,j,score:1200+count*30-i*11+j/10,at:j===0?year-1000:j===1?year+1000:month+1000+j});
 for(const count of [2,3,4]){add({i:25,count,score:99999,completed:false,cutoff:1,reliability:'Disconnect'});add({i:25,count,score:99998,kind:'ai'});add({i:25,count,score:99997,kind:'guest'});add({i:25,count,score:99996,issues:['missing-history']});add({i:25,count,score:99995,classified:false});add({i:25,count,score:99994,at:now+86400000});add({i:25,count,score:99993,finalized:0});}
 db.exec('COMMIT');return {registry,db,user,ids,now,month,year,add};
}
