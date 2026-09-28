// Explicit public projection: no seat credentials, placements, Scout knowledge or RNG.
export function spectatorView(room){
 const h=room.host,match=h.state.match;
 return {code:room.code,revision:room.revision,round:h.round,phase:h.status==='placement'?'placement':h.status==='complete'?'finished':'battle',closed:!!room.closed,current:h.config.players.findIndex(p=>p.id===h.activePlayerId),boards:h.config.players.map((p,i)=>{
  const cellsByKey=new Map(),dead=new Set();
  for(const {event:e} of h.events){if(e.kind==='unit-destroyed'&&e.unitId)dead.add(e.unitId);}
  if(h.status!=='placement')for(const {event:e} of h.events){if(e.kind!=='impact'||e.meta?.targetBoardId!==p.boardId)continue;
   const u=e.unitId?match.units.find(u=>u.id===e.unitId):null;
   const kind=u&&(dead.has(u.id)||!['cav','castle'].includes(u.type))?u.type:null;
   for(const c of e.cells)cellsByKey.set(c.x+','+c.y,{x:c.x,y:c.y,hit:!!e.unitId,kind});
  }
  const cells=[...cellsByKey.values()];
  return {seat:i,name:room.seats[i]?.name||'Waiting for PLAYER',size:h.config.size,cells};
 })};
}
