// Public aggregate projection of retained canonical results. No identities or new storage.
export function globalMenuStats(db){
 const battles=Number(db.prepare("SELECT count(*) n FROM stat_matches WHERE finalized=1 AND mode!='Story'").get().n);
 const rows=db.prepare("SELECT p.summary FROM stat_participants p JOIN stat_matches m ON m.id=p.match_id WHERE m.finalized=1 AND m.mode!='Story'").all();
 let units=0,chain=0,complete=battles===0||rows.length>0;
 for(const row of rows){const s=row.summary?JSON.parse(row.summary):null;if(!s||!Number.isFinite(s.unitsKilled)||!Number.isFinite(s.biggestChain)){complete=false;continue;}units+=s.unitsKilled;chain=Math.max(chain,s.biggestChain);}
 const factions=db.prepare('SELECT value FROM stat_factions').all().map(r=>JSON.parse(r.value));
 const humans=factions.reduce((n,r)=>n+r.playerUnits,0),ai=factions.reduce((n,r)=>n+r.aiUnits,0);
 return {battles,unitsDestroyed:complete?units:null,biggestChain:complete?chain:null,factions:{humanScore:humans/12,aiScore:ai/12,qualifyingMatches:factions.length},coverage:'Retained completed battles; kills and chains are player-credited; Story excluded'};
}
