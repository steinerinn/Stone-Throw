import {tacticalScoreFacts} from './score-tactics.mjs';
import {summarizeMatch} from './statistics-metrics.mjs';
import {processedChainCells} from '../canonical/compiled/combat/chain-statistics.js';

export const SCORE_VERSION='MATCH_SCORE_V1';
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
export function rational(n=0,d=1){n=BigInt(n);d=BigInt(d);if(d<=0n)throw Error('Invalid denominator');const g=gcd(n,d);return {n:String(n/g),d:String(d/g)};}
export const add=(a,b)=>rational(BigInt(a.n)*BigInt(b.d)+BigInt(b.n)*BigInt(a.d),BigInt(a.d)*BigInt(b.d));
export const numeric=a=>Number(a.n)/Number(a.d);
export const completed=p=>p.kind!=='ai'&&p.reliability==='Full'&&p.cutoff===undefined;
const special=new Set(['dwarf','goblin','catapult','elf','cleric','necro','wizard','demon','dragon','assassin']);

// Historical ranks are accepted only when elimination evidence resolves them.
export function scorePlacements(d,facts){
 if(d.finalResult?.placements)return d.finalResult.placements;
 const eliminated=new Map();let boundary=0;
 for(const f of facts){const b=f.event.statistics?.eliminationBoundary;if(b){for(const a of b.dead)if(!eliminated.has(a))eliminated.set(a,boundary);boundary++;}}
 const ps=d.participants,remaining=ps.filter(p=>!eliminated.has(p.actor));
 if(ps.length===2&&ps.every(p=>p.outcome==='Draw'))return Object.fromEntries(ps.map(p=>[p.actor,1]));
 if(ps.length===2&&ps.some(p=>p.outcome==='Win'))return Object.fromEntries(ps.map(p=>[p.actor,p.outcome==='Win'?1:2]));
 if(remaining.length>1)return null;
 const values=ps.map(p=>eliminated.get(p.actor)??Infinity),ranks=[...new Set(values)].sort((a,b)=>b-a);
 return Object.fromEntries(ps.map((p,i)=>[p.actor,ranks.indexOf(values[i])+1]));
}

export function calculateScores(d,facts,{expectedEvents=facts.length}={}){
 const tactics=tacticalScoreFacts(d,facts),reasons=[];if(!d.endedAt)reasons.push('not-finalized');
 if(facts.length!==expectedEvents||facts.some((f,i)=>f.index!==i))reasons.push('incomplete-event-history');
 const placements=scorePlacements(d,facts),metrics=summarizeMatch(d,facts),activeHeroes=new Set(),penalties={},chains={},seen=new Set();
 for(const f of facts){const e=f.event,s=e.statistics||{},m=e.meta||{},p=d.participants.find(p=>p.actor===m.ownerId),eligible=p&&p.kind!=='ai'&&f.index<(p.cutoff??Infinity);
  const root=f.chainId||e.rootId,c=chains[root]??={actor:f.originActor||s.rootActorId,cells:0};
  const rootPlayer=d.participants.find(p=>p.actor===c.actor);if(rootPlayer&&f.index<(rootPlayer.cutoff??Infinity))c.cells+=processedChainCells(e);
  if(eligible&&e.kind==='impact'&&e.unitId&&['direct-human','direct-ai'].includes(m.source)&&(special.has(s.unitType)||(s.unitType==='hero'&&!activeHeroes.has(e.unitId)))){
   const key=f.eventId??f.index;if(!seen.has(key)){seen.add(key);penalties[p.actor]=(penalties[p.actor]||0)+1;}
  }
  if(e.kind==='hero-activated')activeHeroes.add(e.unitId);
 }
 // The Result Screen considers AI and PLAYER equally for ceremonial awards.
 const all=summarizeMatch({...d,participants:d.participants.map(p=>({...p,kind:'guest',cutoff:undefined}))},facts);
 const awards=new Map();for(const [actor,s]of Object.entries(all))for(const name of s.awards){if(!awards.has(name))awards.set(name,[]);awards.get(name).push(actor);}
 const scores=d.participants.filter(p=>p.kind==='account'&&p.playerId).map(p=>{
  const issues=[...reasons,...tactics[p.actor].issues],full=completed(p),m=metrics[p.actor],rank=placements?.[p.actor]??null;
  if(full&&!rank)issues.push('dense-placement-unavailable');
  if(!full&&!Number.isInteger(p.cutoff))issues.push('departure-cutoff-unavailable');
  if(!['Full','Quit','Disconnect','Kick','AFK'].includes(p.reliability))issues.push('participation-status-unavailable');
  const others=d.participants.filter(q=>q.actor!==p.actor&&completed(q));
  const components={completion:rational(full?500:0),placement:rational(full?({2:[0,200,0],3:[0,250,100,0],4:[0,300,150,75,0]}[d.participants.length]?.[rank]??0):0),efficiency:m.shots?rational(Math.min(100*m.shots,250*m.hits),m.shots):rational(),biggestChain:rational(Math.max(0,...Object.values(chains).filter(c=>c.actor===p.actor).map(c=>c.cells))),fewerShots:rational(full&&rank===1&&others.length&&others.every(q=>m.shots<metrics[q.actor].shots)?100:0),awardBonus:rational(),successfulScouting:rational(20*tactics[p.actor].scouts),plagueSpread:rational(5*tactics[p.actor].plagueCells),specialAbilityKills:rational(10*tactics[p.actor].kills),directSpecialPenalty:rational(-10*(penalties[p.actor]||0))};
  if(full)for(const winners of awards.values())if(winners.includes(p.actor))components.awardBonus=add(components.awardBonus,rational(10,winners.length));
  const exact=Object.values(components).reduce(add,rational());
  return {actor:p.actor,playerId:p.playerId,completed:full,participation:full?'completed':'Disconnect/Abandon',placement:rank,formulaVersion:SCORE_VERSION,components,exact,score:issues.length?null:numeric(exact),issues};
 });
 let faction={qualifying:false,playerUnits:0,aiUnits:0,reason:null};
 const humans=d.participants.filter(p=>p.kind!=='ai').length,ais=d.participants.length-humans;
 if(d.mode!=='Story'&&d.endedAt&&humans&&ais){faction.qualifying=true;if(!placements||reasons.length)faction.reason='result-evidence-unavailable';else {
  const winners=d.participants.filter(p=>placements[p.actor]===1),kinds=new Set(winners.map(p=>p.kind==='ai'?'ai':'player'));
  const draw=d.finalResult?.outcome==='draw'||d.participants.some(p=>p.outcome==='Draw');
  if(!draw&&kinds.size===1){const ai=kinds.has('ai');faction[ai?'aiUnits':'playerUnits']=6*d.participants.length/(ai?ais:humans);}
 }}
 return {scores,faction};
}

export function scoreCareer(scores){let total=rational(),highest=null,thousandPlusCount=0;for(const s of scores){total=add(total,s.exact);if(highest===null||numeric(s.exact)>numeric(highest))highest=s.exact;if(s.completed&&BigInt(s.exact.n)>=1000n*BigInt(s.exact.d))thousandPlusCount++;}return {exactTotal:total,lifetimeTotalScore:numeric(total),scoredMatchCount:scores.length,highestMatchScore:highest?numeric(highest):null,thousandPlusCount};}
