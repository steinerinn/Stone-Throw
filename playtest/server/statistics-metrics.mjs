import {processedChainCells} from '../canonical/compiled/combat/chain-statistics.js';
// Private, pure accounting. Inputs are authoritative facts, never browser totals.
export const METRICS=['shots','hits','misses','unitsKilled','coreKills','heroHits','heroReceived','plagueCells','scoutInspected','scoutFound','destructiveCells','unitCellsHit','castleCatapultHits','elvesKilled','dragonsActivated','perfectVolleys','monkDeflections','resurrections','dwarfHits','wizardHits','wizardAttackHits','goblinBombs','demonKills','oneHitWonder','survivor'];
export function emptyMetrics(){return {...Object.fromEntries(METRICS.map(k=>[k,0])),bestHitStreak:0,bestMissStreak:0,biggestChain:0};}
export function summarizeMatch(descriptor,facts){
 const result=Object.fromEntries(descriptor.participants.map(p=>[p.actor,{...emptyMetrics(),actor:p.actor,playerId:p.playerId,kind:p.kind,awards:[]} ])),streak={},last={},dead=new Set(),chains={},volleys={},roots={};
 const human=(actor,index)=>{const p=descriptor.participants.find(p=>p.actor===actor);return p&&p.kind!=='ai'&&(p.cutoff===undefined||index<p.cutoff)?result[actor]:null;};
 for(const f of facts){const e=f.event;if(!e)continue;const s=e.statistics||{},m=e.meta,owner=m?.ownerId||s.unitOwner,credit=human(owner,f.index),type=s.unitType,key=e.rootId+':'+e.workId,chain=f.chainId||e.rootId;
  roots[chain]??=f.originActor||s.rootActorId;
  const processed=processedChainCells(e);if(processed){const c=chains[chain]??={actor:roots[chain],index:f.index,cells:0};c.cells+=processed;}
  if(credit&&['impact','suspect-eliminated','repeat-ignored'].includes(e.kind)){
    if(m.source==='direct-human'||m.source==='direct-ai'){credit.shots++;const hit=e.kind==='impact'&&!!e.unitId;credit[hit?'hits':'misses']++;const st=streak[owner]??={hit:0,miss:0};st.hit=hit?st.hit+1:0;st.miss=hit?0:st.miss+1;credit.bestHitStreak=Math.max(credit.bestHitStreak,st.hit);credit.bestMissStreak=Math.max(credit.bestMissStreak,st.miss);if(credit.shots===1&&hit)credit.oneHitWonder=1;}
  }
  if(e.kind==='impact'){
   if(e.unitId)last[e.unitId]={owner,index:f.index,root:chain,type,source:m?.source};
   if(credit){if(m.source==='plague')credit.plagueCells+=e.cells.length;else {credit.destructiveCells+=e.cells.length;if(e.unitId)credit.unitCellsHit+=e.cells.length;}

    if(type==='hero')credit.heroHits++;if(type==='dwarf')credit.dwarfHits++;if(type==='castle'&&m.source==='catapult-shot')credit.castleCatapultHits++;if(type==='wizard')credit.wizardHits++;if(m.source==='wizard'&&e.unitId)credit.wizardAttackHits++;
   }
   if(type==='hero'){const recipient=human(s.unitOwner,f.index);if(recipient)recipient.heroReceived++;}
   if(m.source==='archer'){const v=volleys[key]??={actor:owner,index:f.index,shots:0,hits:0};v.shots+=e.cells.length;if(e.unitId)v.hits+=e.cells.length;}
  }
  if(e.kind==='attack-started'){if(e.reason==='goblin'&&credit)credit.goblinBombs+=s.plannedCells?.length||0;if(e.reason==='dragon'&&credit)credit.dragonsActivated++;if(e.reason==='monk-deflect'&&credit)credit.monkDeflections++;}
  if(e.kind==='resurrection'){dead.delete(e.unitId);const c=human(s.unitOwner,f.index);if(c)c.resurrections++;}
  if(e.kind==='unit-destroyed'||e.kind==='hero-killed'){
   const k=last[e.unitId],c=k&&human(k.owner,k.index);if(!dead.has(e.unitId)){dead.add(e.unitId);if(c&&k.owner!==s.unitOwner){c.unitsKilled++;if(['inf','cav','castle','archer','monk','hero'].includes(type||k.type))c.coreKills++;if(type==='elf')c.elvesKilled++;if(type==='demon')c.demonKills++;}}
  }
  if(e.kind==='scouted'&&s.scout){const c=human(s.scout.actorId,f.index);if(c){c.scoutInspected+=s.scout.cells.length;c.scoutFound+=s.scout.cells.filter(c=>c.unitId).length;}}
 }
 for(const v of Object.values(volleys)){const c=human(v.actor,v.index);if(c&&v.shots===9&&v.hits===9)c.perfectVolleys++;}
 for(const c of Object.values(chains)){const p=human(c.actor,c.index);if(p)p.biggestChain=Math.max(p.biggestChain,c.cells);}
 for(const p of descriptor.participants){const m=result[p.actor];m.outcome=p.outcome;m.reliability=p.reliability;m.placement=p.placement??null;m.accuracy=m.shots?m.hits/m.shots:null;m.survivor=p.reliability==='Full'&&m.heroReceived===0?1:0;m.cellBlaster={numerator:m.destructiveCells,denominator:1};}
 const humans=Object.values(result).filter(p=>p.kind!=='ai');
 for(const [award,metric,eligible]of [['Lucky Shooter','bestHitStreak',p=>p.bestHitStreak>0],['The Blind One','bestMissStreak',p=>p.bestMissStreak>0],['Eagle Eye','accuracy',p=>p.shots>=5&&p.hits>0],['Most Fierce','unitsKilled',p=>p.unitsKilled>0],['Chain Master','biggestChain',p=>p.biggestChain>0],['Purple Death','plagueCells',p=>p.plagueCells>0]]){const entries=humans.filter(eligible),best=Math.max(...entries.map(p=>p[metric]));for(const p of entries)if(p[metric]===best)p.awards.push(award);}
 return result;
}
export function reliabilityAccounting(previous,classification,matchId){
 const r=structuredClone(previous||{Full:0,Quit:0,Disconnect:0,Kick:0,AFK:0,forgiven:0,cleanStreak:0,forgiveness:[]});if(!['Full','Quit','Disconnect','Kick','AFK'].includes(classification))throw Error('Unknown reliability class');r[classification]++;
 if(classification!=='Full')r.cleanStreak=0;
 else if(classification==='Full'){r.cleanStreak=Math.min(10,r.cleanStreak+1);if(r.cleanStreak===10){if(r.AFK>r.forgiven){r.forgiven++;r.forgiveness.push({matchId,count:1});}r.cleanStreak=0;}}
 const total=r.Full+r.Quit+r.Disconnect+r.Kick+r.AFK;r.effectiveFull=r.Full+r.forgiven;r.activeAFK=r.AFK-r.forgiven;r.total=total;r.consistency=total?r.effectiveFull/total:null;return r;
}
export function aggregate(previous,summary,matchId){const a=structuredClone(previous||{...emptyMetrics(),games:0,wins:0,losses:0,draws:0,awards:{}});a.games++;for(const k of METRICS)a[k]=(a[k]||0)+(summary[k]||0);for(const k of ['bestHitStreak','bestMissStreak','biggestChain'])a[k]=Math.max(a[k],summary[k]||0);a[({Win:'wins',Loss:'losses',Draw:'draws'})[summary.outcome]]++;for(const award of summary.awards)a.awards[award]=(a.awards[award]||0)+1;a.reliability=reliabilityAccounting(a.reliability,summary.reliability,matchId);a.accuracy=a.shots?a.hits/a.shots:null;a.winRatio=a.wins/a.games;a.lossRatio=a.losses/a.games;a.cellBlaster={numerator:a.destructiveCells,denominator:a.games};return a;}
// Future public Hall of Fame policy only. Inactive during Registry/statistics development.
export const FUTURE_HALL_OF_FAME_FULL_GAMES=10;
export const futureHallOfFameEligible=aggregate=>!!aggregate&&aggregate.reliability.Full>=FUTURE_HALL_OF_FAME_FULL_GAMES;
