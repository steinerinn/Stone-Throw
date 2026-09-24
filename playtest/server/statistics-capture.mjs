import {finalPlacements} from './result-screen.mjs';
import {classifyMatch} from './match-classification.mjs';
import {randomUUID} from 'node:crypto';
// Stored beside (never inside) authoritative combat state. No clocks/randomness enter gameplay.
export function prepareStatistics(holder,h,epoch,{mode,build,now,participants,news=[],closed=false,gaveUp=false}){
 if(h.config.story)return null;
 let d=holder.matchStatistics;if(!d||d.epoch!==epoch)d=holder.matchStatistics={id:randomUUID(),epoch,mode,build,startedAt:null,endedAt:null,participants:[],reliabilityEvents:[],newsCursor:0};
 if(d.endedAt){d.classification??=classifyMatch(d);return d;}
 if(!d.startedAt){d.participants=participants.map((s,i)=>({actor:h.config.players[i].id,seat:i,kind:s?.controller==='ai'?'ai':s?.identity?.kind==='account'?'account':'guest',playerId:s?.controller==='ai'?null:s?.identity?.playerId||null,displayName:s?.name||s?.identity?.displayName||'Guest',outcome:null,reliability:null}));if(h.status==='placement')return null;d.startedAt=now();d.configuration=structuredClone(h.config);d.initialPlacements=structuredClone(h.placements);d.initialRng=structuredClone(h.initialRng);}
 d.classification??=classifyMatch(d);
 if(holder.deploymentDiagnostics)d.deploymentDiagnostics=structuredClone(holder.deploymentDiagnostics);
 for(const n of news){if(n.id<=d.newsCursor)continue;d.reliabilityEvents.push({...n,observedAt:now()});d.newsCursor=Math.max(d.newsCursor,n.id);}
 for(let i=0;i<d.participants.length;i++){const p=d.participants[i],s=participants[i];if(p.kind==='ai')continue;if(s?.statDeparture){p.cutoff=s.statDeparture.eventCursor;p.takeover=s.statDeparture.reason;p.reliability=s.statDeparture.reason==='surrender'?'Quit':s.statDeparture.reason==='kick'?'Kick':'Disconnect';p.outcome='Loss';}}
 if(gaveUp){const p=d.participants[0];p.outcome='Loss';p.reliability='Quit';p.cutoff??=h.events.length;p.takeover='surrender';}
 const noHumans=d.participants.every(p=>p.kind==='ai'||p.reliability&&p.reliability!=='Full');
 if(h.status==='complete'||closed||noHumans){d.endedAt=now();const outcome=h.state.match.outcome;if(h.status==='complete')d.finalResult={outcome:outcome.kind,placements:Object.fromEntries(h.config.players.map((p,i)=>[p.id,finalPlacements(h)[i]]))};
  for(const p of d.participants){if(p.kind==='ai')continue;p.outcome??=outcome.kind==='draw'?'Draw':outcome.kind==='win'&&outcome.winnerIds.includes(p.actor)?'Win':'Loss';p.reliability??='Full';const boundary=h.events.find(row=>row.event.statistics?.eliminationBoundary?.dead.includes(p.actor))?.event.statistics.eliminationBoundary;p.placement=p.outcome==='Win'||p.outcome==='Draw'?1:boundary?boundary.survivors+1:h.config.players.length;}
 }
 return d;
}
