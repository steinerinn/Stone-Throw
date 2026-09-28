// Projection only: executed attacks and public hit types; no private geometry or unit identifiers.
const specials=new Set(['wizard','dragon','demon','goblin','archer','monk-deflect','assassin']);
export function createGroupNarrative(){
 const cache=new WeakMap();
 return function narrative(r,self,snapshot){
  const h=r.host;let c=cache.get(r);
  if(!c||c.epoch!==r.epoch||c.cursor>h.events.length){c={epoch:r.epoch,cursor:0,roots:new Map(),launches:new Map(),seen:new Set(),rows:[],serial:0,attacks:new Map(),heroHits:new Map(),destroyed:new Set()};cache.set(r,c);}
  const ids=new Set(h.config.players.map(p=>p.id));
  // Settled elimination annotates the last existing event. Revisit only that tail.
  for(let index=Math.max(0,c.cursor-1);index<h.events.length;index++){
   const e=h.events[index].event,meta=e.meta,root=e.rootId;
   if(!c.roots.has(root)&&ids.has(e.statistics?.rootActorId))c.roots.set(root,e.statistics.rootActorId);
   if(e.kind==='decision-answered'&&e.reason==='catapult-target')c.launches.set(root,e.sequence);
   const add=(key,row)=>{if(c.seen.has(key))return;c.seen.add(key);c.rows.push({id:++c.serial,...row});if(c.rows.length>120)c.rows.shift();};
   if(!r.local&&index>=c.cursor){
    if(e.kind==='unit-destroyed'&&e.unitId)c.destroyed.add(e.unitId);
    if(['impact','repeat-ignored','suspect-eliminated'].includes(e.kind)&&['archer','goblin','wizard','dragon','demon','catapult-shot','monk-deflect','assassin'].includes(meta?.source)&&ids.has(meta.ownerId)&&ids.has(meta.targetPlayerId)){
     const key=root+':'+e.workId+':'+meta.source,attack=c.attacks.get(key)||{root,actor:meta.ownerId,target:meta.targetPlayerId,special:meta.source==='catapult-shot'?'catapult':meta.source==='monk-deflect'?'monk':meta.source,cells:0,hits:0,contacts:[]};attack.cells+=e.cells?.length||0;if(e.kind==='impact'&&e.unitId){attack.hits+=e.cells?.length||0;for(const cell of e.cells||[])attack.contacts.push({unitId:e.unitId,type:e.statistics?.unitType||null});}c.attacks.set(key,attack);
    }
    if(e.kind==='impact'&&e.statistics?.unitType==='hero'&&e.unitId&&ids.has(meta?.targetPlayerId)){const count=(c.heroHits.get(e.unitId)||0)+1;c.heroHits.set(e.unitId,count);add('hero:'+root+':'+e.sequence,{kind:'hero-hit',target:meta.targetPlayerId,count});}
    if(e.kind==='ability-spent'&&e.reason==='archer-no-shot'&&ids.has(meta?.ownerId))add('no-shot:'+root+':'+e.sequence,{kind:'archer-no-shot',actor:meta.ownerId});
    if(e.kind==='resolution-completed')for(const [key,a]of c.attacks)if(a.root===root){const {root:ignored,contacts,...summary}=a;const damage=contacts.map(hit=>['inf','archer','monk','dwarf','goblin','catapult','elf','cleric','necro','wizard','demon','dragon','assassin','hero'].includes(hit.type)||(['cav','castle'].includes(hit.type)&&c.destroyed.has(hit.unitId))?hit.type:null);add('summary:'+key,{kind:'attack-summary',...summary,damage});c.attacks.delete(key);}
   }
   if(e.kind==='peasant-revolt')add('revolt:'+root,{kind:'revolt',level:e.amount});
   if(!e.statistics?.environmental&&e.kind==='attack-started'&&specials.has(e.reason)&&ids.has(meta?.ownerId)&&ids.has(meta?.targetPlayerId))add('attack:'+root+':'+e.sequence,{kind:'special',special:e.reason==='monk-deflect'?'monk':e.reason,actor:meta.ownerId,target:meta.targetPlayerId});
   if(e.kind==='impact'&&meta?.source==='catapult-shot'&&ids.has(meta.ownerId)&&ids.has(meta.targetPlayerId))add('catapult:'+root+':'+(c.launches.get(root)??e.workId),{kind:'special',special:'catapult',actor:meta.ownerId,target:meta.targetPlayerId});
   if(['unit-destroyed','unit-damaged'].includes(e.kind)&&meta?.source==='plague'&&ids.has(meta.targetPlayerId)&&e.cells?.length)add('plague:'+root+':'+e.sequence,{kind:'plague',target:meta.targetPlayerId,destroyed:e.kind==='unit-destroyed',cell:e.cells[0]});
   for(const dead of e.statistics?.eliminationBoundary?.dead||[])if(ids.has(dead))add('elimination:'+dead,{kind:'elimination',target:dead,actor:c.roots.get(root)||null});
  }
  c.cursor=h.events.length;
  return {global:!r.local,self:h.config.players[self].id,players:h.config.players.map((p,i)=>({id:p.id,name:r.seats[i]?.name||'Waiting for PLAYER'})),events:c.rows.flatMap(row=>{if(row.kind!=='plague')return [{...row}];if(!snapshot)return [];const seat=h.config.players.findIndex(p=>p.id===row.target),same=c=>c.x===row.cell.x&&c.y===row.cell.y;const observed=seat===self?snapshot.owned?.find(u=>u.cells.some(same)):(snapshot.online?.boards?.find(b=>b.seat===seat)?.cells||(h.config.players.length===2?snapshot.opponent:[])||[]).find(c=>same(c.cell));if(!observed)return [];const {cell,...safe}=row;return [{...safe,unit:observed.kind||null}];})};
 };
}
