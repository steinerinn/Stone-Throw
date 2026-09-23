// Compatibility labels remain in mode for existing career/HOF consumers.
// Classification uses only the frozen start configuration and participant records.
export function classifyMatch(d){
 const count=d.configuration?.players?.length;
 const mode=d.mode==='Single Player'?'single':['Duel','3 Players','4 Players'].includes(d.mode)?'online':null;
 if(!mode||![2,3,4].includes(count)||d.participants?.length!==count||new Set(d.participants.map(p=>p.actor)).size!==count||d.participants.some(p=>!['account','guest','ai'].includes(p.kind)||!d.configuration.players.some(a=>a.id===p.actor)))throw Error('ambiguous-match-classification');
 if(mode==='online'&&d.mode!==({2:'Duel',3:'3 Players',4:'4 Players'})[count])throw Error('conflicting-match-classification');
 return {mode,participantCount:count,format:count===2?'duel':count+'p',startingHumans:d.participants.filter(p=>p.kind!=='ai').length,startingAI:d.participants.filter(p=>p.kind==='ai').length};
}
export function backfillClassification(db,{apply=false,transaction=true}={}){
 if(apply&&transaction)db.exec('BEGIN IMMEDIATE');try{
 const changes=[],ambiguous=[];for(const row of db.prepare('SELECT id,mode,player_count,finalized,descriptor FROM stat_matches').all()){
  try{const d=JSON.parse(row.descriptor),classification=classifyMatch(d);if(d.id!==row.id||d.mode!==row.mode||classification.participantCount!==row.player_count)throw Error('conflicting-stored-start');if(JSON.stringify(d.classification)!==JSON.stringify(classification))changes.push({id:row.id,finalized:row.finalized,descriptor:JSON.stringify({...d,classification}),classification});}
  catch(e){ambiguous.push({id:row.id,reason:e.message});}
 }
 if(apply){if(ambiguous.length)throw Error('Historical classification requires explicit review');const update=db.prepare('UPDATE stat_matches SET descriptor=? WHERE id=?');for(const c of changes)update.run(c.descriptor,c.id);}
 if(apply&&transaction)db.exec('COMMIT');
 return {changed:changes.length,finalized:changes.filter(c=>c.finalized).length,unfinished:changes.filter(c=>!c.finalized).length,categories:changes.reduce((a,c)=>{const k=c.classification.mode+' '+c.classification.format;a[k]=(a[k]||0)+1;return a;},{}),ambiguous};
 }catch(e){if(apply&&transaction)db.exec('ROLLBACK');throw e;}
}
