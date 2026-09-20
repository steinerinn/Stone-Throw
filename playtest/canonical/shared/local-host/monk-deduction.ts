import type {Cell} from '../model.js';
import type {SeenCell} from '../client-contract/public.js';
import {neighbors8,parseKey} from '../rules/coordinates.js';
const key=(c:Cell)=>c.x+','+c.y;
/** Only public evidence enters this module: no host, units, RNG, or private board. */
export function updateMonkEvidence(size:number,prior:readonly Cell[],probe:Cell,deflected:boolean):Cell[]{
 const near=neighbors8({size},probe.x,probe.y).map(parseKey),around=new Set(near.map(key));
 return deflected?(prior.length?prior.filter(c=>around.has(key(c))):near).map(c=>({...c})):prior.filter(c=>key(c)!==key(probe)&&!around.has(key(c))).map(c=>({...c}));
}
export function deduceMonkCandidates(size:number,evidence:readonly Cell[],seen:readonly SeenCell[]):Cell[]{
 // A publicly identified Monk is no longer a question, alive or dead.
 if(seen.some(c=>c.kind==='monk'))return [];
 const impossible=new Set<string>();
 for(const c of seen){
  const hit=c.observation==='impact'||c.observation==='miss'||c.unitPresentation?.hit===true;
  const occupied=c.observation==='occupied'||c.observation==='impact'||c.kind!==null||c.corePresentation==='unidentified';
  if(hit||occupied||c.observation==='empty')impossible.add(key(c.cell));
  // Hero relocation is exempt from original placement spacing. Unknown core may
  // be the Monk itself: exclude its cell, but don't infer a no-touch ring yet.
  if(occupied&&c.kind!==null&&c.kind!=='hero'||c.corePresentation==='unidentified')for(const k of neighbors8({size},c.cell.x,c.cell.y))impossible.add(k);
 }
 return [...new Map(evidence.filter(c=>Number.isInteger(c.x)&&Number.isInteger(c.y)&&c.x>=0&&c.y>=0&&c.x<size&&c.y<size&&!impossible.has(key(c))).map(c=>[key(c),{...c}])).values()].sort((a,b)=>a.y-b.y||a.x-b.x);
}
