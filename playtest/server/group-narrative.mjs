// Projection only: executed special routing, never random geometry or hit identities.
const specials=new Set(['wizard','dragon','demon','goblin','archer','monk-deflect']);
export function createGroupNarrative(){
 const cache=new WeakMap();
 return function narrative(r,self){
  const h=r.host;let c=cache.get(r);
  if(!c||c.epoch!==r.epoch||c.cursor>h.events.length){c={epoch:r.epoch,cursor:0,roots:new Map(),launches:new Map(),seen:new Set(),rows:[],serial:0};cache.set(r,c);}
  const ids=new Set(h.config.players.map(p=>p.id));
  // Settled elimination annotates the last existing event. Revisit only that tail.
  for(let index=Math.max(0,c.cursor-1);index<h.events.length;index++){
   const e=h.events[index].event,meta=e.meta,root=e.rootId;
   if(!c.roots.has(root)&&ids.has(e.statistics?.rootActorId))c.roots.set(root,e.statistics.rootActorId);
   if(e.kind==='decision-answered'&&e.reason==='catapult-target')c.launches.set(root,e.sequence);
   const add=(key,row)=>{if(c.seen.has(key))return;c.seen.add(key);c.rows.push({id:++c.serial,...row});if(c.rows.length>120)c.rows.shift();};
   if(e.kind==='attack-started'&&specials.has(e.reason)&&ids.has(meta?.ownerId)&&ids.has(meta?.targetPlayerId))add('attack:'+root+':'+e.sequence,{kind:'special',special:e.reason==='monk-deflect'?'monk':e.reason,actor:meta.ownerId,target:meta.targetPlayerId});
   if(e.kind==='impact'&&meta?.source==='catapult-shot'&&ids.has(meta.ownerId)&&ids.has(meta.targetPlayerId))add('catapult:'+root+':'+(c.launches.get(root)??e.workId),{kind:'special',special:'catapult',actor:meta.ownerId,target:meta.targetPlayerId});
   for(const dead of e.statistics?.eliminationBoundary?.dead||[])if(ids.has(dead))add('elimination:'+dead,{kind:'elimination',target:dead,actor:c.roots.get(root)||null});
  }
  c.cursor=h.events.length;
  return {self:h.config.players[self].id,players:h.config.players.map((p,i)=>({id:p.id,name:r.seats[i].name})),events:c.rows.map(row=>({...row}))};
 };
}
