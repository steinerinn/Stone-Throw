import type {HostState} from '../host/contracts.js';
import type {StrengthSample,PublicStatistics} from '../client-contract/public.js';
import {coreSurvivors,unitsDestroyed} from '../host/statistics.js';
import {cellKey} from '../combat/access.js';
export interface StatisticsMemory {strength:StrengthSample[];rounds:{round:number;player:number;enemy:number}[];lastCells:number[]}
export const emptyStatistics=():StatisticsMemory=>({strength:[],rounds:[],lastCells:[0,0]});
/** The only hidden statistic exception. Candidate footprints are already-public
 * casualties. Compare possible contributions, never publish the selected one. */
export function enemyStrengthUnknown(h:HostState):boolean {
 const s=h.state.seats[1]!;if(h.status==='complete'||!s.resurrection.searchActive)return false;
 const sizes=s.resurrection.suspects.map(id=>h.state.match.units.find(u=>u.id===id)!.cells.length);
 return new Set(sizes).size>1;
}
/** Called by private execution, never by renderer timing or reads. Known samples
 * keep the legacy per-round replacement. An unknown sample is never backfilled. */
export function captureStatistics(h:HostState,m:StatisticsMemory,round=h.round):void {
 const totals=h.config.players.map(p=>h.counters.find(c=>c.playerId===p.id)!.cellsAffected);
 if(h.status==='placement'){m.lastCells=totals;return;}
 let bucket=m.rounds.find(r=>r.round===Math.max(1,round));const delta=totals.map((n,i)=>n-m.lastCells[i]!);
 if(delta.some(n=>n!==0)){if(!bucket){bucket={round:Math.max(1,round),player:0,enemy:0};m.rounds.push(bucket);}bucket.player+=delta[0]!;bucket.enemy+=delta[1]!;}m.lastCells=totals;
 if(h.round<=0)return;
 const unknown=enemyStrengthUnknown(h),sample:StrengthSample={round:h.round,player:coreSurvivors(h,h.config.players[0]!.id),enemy:unknown?null:coreSurvivors(h,h.config.players[1]!.id),...(unknown?{enemyUnknown:true as const}:{})};
 const last=m.strength.at(-1);
 if(last?.round===sample.round&&((last.enemy===null)===(sample.enemy===null)))m.strength[m.strength.length-1]=sample;else m.strength.push(sample);
}
export function publicStatistics(h:HostState,m:StatisticsMemory):PublicStatistics {
 const [p,e]=h.config.players,pc=h.counters.find(c=>c.playerId===p!.id)!,ec=h.counters.find(c=>c.playerId===e!.id)!;
 const neutralDead=new Map<string,string>();for(const {event:e}of h.events){if(e.unitId&&['unit-destroyed','hero-killed'].includes(e.kind)){if(e.statistics?.environmental)neutralDead.set(e.unitId,String(e.statistics.unitOwner));else neutralDead.delete(e.unitId);}if(e.kind==='resurrection'&&e.unitId)neutralDead.delete(e.unitId);}
 const neutralCount=(owner:string,core=false)=>h.state.match.units.filter(u=>neutralDead.get(u.id)===owner&&(!core||['inf','cav','castle','archer','monk','hero'].includes(u.type||''))).length;
 const coreDestroyed=(owner:string)=>{const shots=h.state.seats.find(s=>s.playerId===owner)!.shots;return h.state.match.units.filter(u=>u.ownerId===owner).reduce((n,u)=>n+(u.hero?(u.hero.activated&&!u.hero.currentCell?1:0):(['inf','cav','castle','archer','monk'].includes(u.type||'')&&u.cells.every(c=>shots.includes(cellKey(c)))?1:0)),0);};
 return {playerShots:pc.shots,enemyShots:ec.shots,playerDirectHits:pc.directHits,enemyDirectHits:ec.directHits,playerCells:pc.cellsAffected,enemyCells:ec.cellsAffected,playerLongestChain:pc.longestChain,enemyLongestChain:ec.longestChain,playerBiggestAttack:pc.biggestAttack,enemyBiggestAttack:ec.biggestAttack,playerUnitsDestroyed:Math.max(0,unitsDestroyed(h,e!.id)-neutralCount(e!.id)),enemyUnitsDestroyed:Math.max(0,unitsDestroyed(h,p!.id)-neutralCount(p!.id)),playerCoreDestroyed:Math.max(0,coreDestroyed(e!.id)-neutralCount(e!.id,true)),enemyCoreDestroyed:Math.max(0,coreDestroyed(p!.id)-neutralCount(p!.id,true)),rounds:structuredClone(m.rounds),strength:structuredClone(m.strength)};
}
