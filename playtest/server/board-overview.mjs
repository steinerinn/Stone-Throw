import {multiCellDisclosure} from '../canonical/compiled/local-host/multicell-disclosure.js';
import {stationaryDisclosure} from '../canonical/compiled/local-host/stationary-disclosure.js';
import {knownCasualtyCells,maskResurrectionCells,enemyResurrectionSearch} from '../canonical/compiled/local-host/resurrection-disclosure.js';
import {publicUnitStrips} from '../canonical/compiled/local-host/unit-strip-disclosure.js';
import {publicHeroPresentation} from '../canonical/compiled/local-host/hero-presentation.js';
import {presentationRecords} from './presentation-records.mjs';
// Same observer throughout: never borrow another seat's Scout/Monk knowledge.
export function publicBoardView(h,seat){const [observer,target]=h.config.players,records=presentationRecords(h),knowledge=h.state.match.knowledge[observer.id].boards[target.id],base=knowledge.cells.map(c=>({cell:{...c.cell},observation:c.observation,kind:c.unitType})),resurrection=enemyResurrectionSearch(h);
 let cells=maskResurrectionCells(knownCasualtyCells(h,stationaryDisclosure(h,multiCellDisclosure(h,base,records.catapult),records.stationary)),resurrection);
 if(h.status==='complete'){
 const state=h.state.seats.find(s=>s.playerId===target.id),shots=new Set(state.shots),byCell=new Map(cells.map(c=>[c.cell.x+','+c.cell.y,c]));
 for(const k of shots){const [x,y]=k.split(',').map(Number);if(!byCell.has(k))byCell.set(k,{cell:{x,y},observation:'miss',kind:null});}
 for(const u of h.state.match.units.filter(u=>u.ownerId===target.id))for(const c of u.cells){const k=c.x+','+c.y,hit=shots.has(k),entry={cell:{...c},kind:u.type,observation:hit?'hit':'revealed',knownDestroyed:u.cells.every(c=>shots.has(c.x+','+c.y))};
 if(['castle','cav'].includes(u.type)){entry.corePresentation='identified';entry.scouted=!hit;if(u.type==='castle'){const own=new Set(u.cells.map(c=>c.x+','+c.y));entry.castleMask=(own.has(c.x+','+(c.y-1))?1:0)|(own.has((c.x+1)+','+c.y)?2:0)|(own.has(c.x+','+(c.y+1))?4:0)|(own.has((c.x-1)+','+c.y)?8:0);}}
 else entry.unitPresentation={scoutArt:true,hit};byCell.set(k,entry);}
 cells=[...byCell.values()].sort((a,b)=>a.cell.y-b.cell.y||a.cell.x-b.cell.x);
 }
 return {seat,boardId:target.boardId,playerId:target.id,size:h.config.size,cells,roster:{...target.roster},strip:publicUnitStrips(h).opponent,plague:records.plagueCells.filter(c=>c.side==='opponent').map(c=>c.cell),resurrection,hero:publicHeroPresentation(h,records.hero).filter(c=>c.side==='opponent')};
}
