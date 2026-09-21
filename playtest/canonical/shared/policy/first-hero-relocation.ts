import type {HostState} from '../host/contracts.js';
import type {PlayerId} from '../model.js';
import {seat,cellKey,targetKnowledge} from '../combat/access.js';
import {neighbors8} from '../rules/coordinates.js';
import {heroPlagueSafe} from './special-decisions.js';
import {pick,draw} from './auto-target.js';
/** Approved first-hit AI policy only. The resolver supplies the legal set;
 * this policy cannot invent destinations or change subsequent relocations. */
export function firstHeroRelocation(h:HostState,owner:PlayerId,legal:string[]):string|null {
 const p=seat(h.state,owner),pool=heroPlagueSafe(h,owner,legal.filter(k=>!p.shots.includes(k)&&!p.occupied.includes(k)));
 if(!pool.length)return null;
 const units=h.state.match.units.filter(u=>u.ownerId===owner);
 const revealed=new Set(targetKnowledge(h.state,p.reactionTarget.playerId,owner).scouted);
 const adjacent=(cells:{x:number,y:number}[])=>{const near=new Set(cells.flatMap(c=>neighbors8({size:h.config.size},c.x,c.y)));return pool.filter(k=>near.has(k));};
 const hit=adjacent(units.filter(u=>u.cells.some(c=>p.shots.includes(cellKey(c))||revealed.has(cellKey(c)))||(u.damage.hitsTaken||0)>0).flatMap(u=>u.cells));
 let bait:string[]=[];
 for(const type of ['demon','dragon','wizard','necro','goblin']){
  bait=adjacent(units.filter(u=>u.type===type&&u.lifecycle!=='destroyed'&&u.cells.length&&u.cells.every(c=>!p.shots.includes(cellKey(c)))).flatMap(u=>u.cells));
  if(bait.length)break;
 }
 const roll=draw(h,'hero-first-category');
 const chosen=bait.length?(roll<.45?hit:roll<.9?bait:pool):(roll<.5?hit:pool);
 return pick(h,chosen.length?chosen:hit.length?hit:bait.length?bait:pool,'hero-first-destination');
}
