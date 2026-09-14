import type {HostState} from '../host/contracts.js';
import type {Cell} from '../model.js';
/** Cosmetic history only: own known positions and public enemy hit sites.
 * Never publish an unscouted enemy relocation destination. No state writes/RNG. */
export function publicHeroPresentation(h:HostState){
 const marks=new Map<string,{side:'self'|'opponent';cell:Cell;state:'initial'|'active'|'hit'|'wounded'|'dead'}>();
 for(const [i,p]of h.config.players.entries()){
  const side=i===0?'self':'opponent';
  for(const hero of h.state.match.units.filter(u=>u.ownerId===p.id&&u.type==='hero')){
   let location=h.placements.find(u=>u.unitId===hero.id)?.cells[0],hits=0,visible=false;
   const put=(cell:Cell,state:'initial'|'active'|'hit'|'wounded'|'dead')=>marks.set(side+':'+cell.x+','+cell.y,{side,cell:{...cell},state});
   if(i===0&&location)put(location,'initial');
   for(const {event:e}of h.events){if(e.unitId!==hero.id)continue;
    if(e.kind==='impact'&&e.cells[0]){location=e.cells[0];visible=true;put(location,++hits===1?'hit':'wounded');}
    if(e.kind==='hero-moved'&&e.cells[0]){location=e.cells[0];visible=false;if(i===0)put(location,'active');}
    if(e.kind==='hero-killed'&&location&&(i===0||visible))put(location,'dead');
   }
   if(hero.hero?.currentCell&&i===0&&!marks.has(side+':'+hero.hero.currentCell.x+','+hero.hero.currentCell.y))put(hero.hero.currentCell,hero.hero.activated?'active':'initial');
   // Scout is an explicit accepted disclosure, not a inference from private geometry.
   if(i===1&&hero.hero?.currentCell&&h.state.seats[0]!.scouted.includes(hero.hero.currentCell.x+','+hero.hero.currentCell.y))put(hero.hero.currentCell,hero.hero.activated?'active':'initial');
  }
 }
 return [...marks.values()];
}
