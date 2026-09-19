import {publicStrength} from './strength-public.js';
// Authorized Group display policy: hold a previous public-known sample across an unknown.
// Never mutate/backfill the raw public history, and never infer a value before the first known sample.
export function strengthDataset(players){const series=publicStrength(players).map(p=>{let last=null;const points=p.samples.map(s=>{if(s.known)last=s.value;return {...s,displayValue:last,held:!s.known&&last!==null};});return {...p,points};}),values=series.flatMap(p=>p.points).filter(p=>p.displayValue!==null),maxRound=Math.max(1,...series.flatMap(p=>p.samples.map(s=>s.round))),yMax=Math.max(4,Math.ceil(Math.max(1,...values.map(p=>p.displayValue))/4)*4);return{series,maxRound,yMax,ticks:Array.from({length:5},(_,i)=>yMax*i/4)};}
