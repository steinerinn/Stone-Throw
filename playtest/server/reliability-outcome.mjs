import {reliabilityAccounting} from './statistics-metrics.mjs';
// Reliability is independent of completion/score eligibility and raw departure reasons.
export function finalReliability({incidents=0,disconnects=0,departure=false}={}){
 return incidents>=2?'AFK':departure||disconnects>=2?'DISCONNECTED':'FINISHED';
}
export function reliabilityHistory(rows){
 let accounting=null,historicalUnknown=0;
 const seen=new Set();
 for(const row of rows){
  if(seen.has(row.match_id))continue;
  const d=typeof row.descriptor==='string'?JSON.parse(row.descriptor):row.descriptor;
  if(d.classification?.mode==='single'||d.mode==='Single Player')continue;
  const p=d.participants?.find(p=>p.seat===row.seat);
  let outcome=p?.reliabilityOutcome;
  if(!outcome){
   // Older records lack inactivity telemetry. Never infer AFK from deployment.
   if(row.reliability==='AFK')outcome='AFK';
   else if(['Quit','Disconnect','Kick','DISCONNECTED'].includes(row.reliability))outcome='DISCONNECTED';
   else if(['Full','FINISHED'].includes(row.reliability))outcome='FINISHED';
   else{historicalUnknown++;continue;}
  }
  seen.add(row.match_id);
  accounting=reliabilityAccounting(accounting,{FINISHED:'Full',DISCONNECTED:'Disconnect',AFK:'AFK'}[outcome],row.match_id);
 }
 const a=accounting||{Full:0,Disconnect:0,AFK:0,forgiven:0,cleanStreak:0,forgiveness:[]};
 const r={Full:a.Full,Disconnect:a.Disconnect,AFK:a.AFK,forgivenAFK:a.forgiven,cleanStreak:a.cleanStreak,forgiveness:a.forgiveness,historicalUnknown};
 const total=r.Full+r.Disconnect+r.AFK,effectiveFull=r.Full+r.forgivenAFK,outstandingAFK=r.AFK-r.forgivenAFK;
 return {...r,status:total?'rated':'unrated',total,games:total,completed:r.Full,failures:r.Disconnect+r.AFK,afkIncidents:r.AFK,effectiveFull,outstandingAFK,gamesUntilForgiveness:outstandingAFK?10-r.cleanStreak:null,consistency:total?effectiveFull/total:null,percent:total?100*effectiveFull/total:null};
}
