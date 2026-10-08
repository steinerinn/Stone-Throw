// Repair only the known two-seat shared-first display defect, without writes.
export function historicalPlacements(descriptor){
 const saved=descriptor.finalResult?.placements,players=descriptor.participants||[];
 if(!saved||players.length!==2||descriptor.finalResult.outcome!=='win'||!players.every(p=>saved[p.actor]===1))return saved;
 const winners=players.filter(p=>p.outcome==='Win'&&p.reliability==='Full');
 let winner=winners.length===1?winners[0]:null;
 if(!winner){const losers=players.filter(p=>p.outcome==='Loss'&&p.placement===2&&p.reliability==='Full'&&!p.takeover);if(losers.length===1){const other=players.find(p=>p!==losers[0]);if(other.kind==='ai')winner=other;}}
 return winner?Object.fromEntries(players.map(p=>[p.actor,p===winner?1:2])):saved;
}
export function storedResultPlacements(db,matchId,result){
 const row=db.prepare('SELECT descriptor FROM stat_matches WHERE id=?').get(matchId);if(!row)return result;
 const d=JSON.parse(row.descriptor),places=historicalPlacements(d);if(places===d.finalResult?.placements)return result;
 return {...result,players:result.players.map(p=>{const participant=d.participants.find(q=>q.seat===p.seat);return participant?{...p,placement:places[participant.actor]}:p;})};
}
