import {isArchive} from '../canonical/compiled/archives.js';
const roots=new WeakMap();
// A private, disposable presentation index. Only immutable prefix records are
// retained; every prefix identity is checked, so replacement/truncation rebuilds.
export function presentationRecords(h){let views=roots.get(h.initial);if(!views){views=new Map();roots.set(h.initial,views);}const key=h.config.players.map(p=>p.id).join('|');let cache=views.get(key);if(!cache||cache.rows.length>h.events.length||cache.rows.some((r,i)=>r!==h.events[i])){cache={rows:[],hero:[],stationary:new Map(),catapult:new Map(),plague:new Map()};views.set(key,cache);}
 const heroes=new Set(h.state.match.units.filter(u=>u.type==='hero').map(u=>u.id));
 function add(index,row,i){const e=row.event;if(heroes.has(e.unitId)&&['impact','hero-moved','hero-killed'].includes(e.kind))index.hero.push(row);if(e.kind!=='impact')return;for(const c of e.cells){const k=e.meta?.targetBoardId+':'+c.x+','+c.y;if(e.meta?.source==='plague')index.plague.set(k,{row,i,cell:{...c},target:e.meta.targetPlayerId});else index.stationary.set(k,{row,i});if(e.meta?.source==='catapult-shot')index.catapult.set(e.unitId+':'+k,{row,i});}}
 let n=cache.rows.length;while(n<h.events.length&&isArchive(h.events[n])){const row=h.events[n];add(cache,row,n);cache.rows.push(row);n++;}
 const index=n===h.events.length?cache:{hero:[...cache.hero],stationary:new Map(cache.stationary),catapult:new Map(cache.catapult),plague:new Map(cache.plague)};for(let i=n;i<h.events.length;i++)add(index,h.events[i],i);
 const records=maps=>[...new Map(maps.flatMap(m=>[...m.values()].map(v=>[v.i,v]))).values()].sort((a,b)=>a.i-b.i).map(v=>v.row);
 return {hero:index.hero,stationary:records([index.stationary,index.plague]),catapult:records([index.catapult]),plagueCells:[...index.plague.values()].map(v=>({side:v.target===h.config.players[0].id?'self':'opponent',cell:{...v.cell}}))};
}
