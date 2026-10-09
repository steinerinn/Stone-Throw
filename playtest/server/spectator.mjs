import {buildReplay} from './replay.mjs';
// Explicit public projection: no seat credentials, placements, Scout knowledge or RNG.
export function spectatorView(room){
 const h=room.host,match=h.state.match,units=new Map(match.units.map(u=>[u.id,u])),dead=new Set(),eliminated=new Set(),heroHits=new Map(),heroes=new Map();
 for(const {event:e} of h.events){if(e.kind==='unit-destroyed'&&e.unitId)dead.add(e.unitId);for(const id of e.statistics?.eliminationBoundary?.dead||[])eliminated.add(id);}
 const boards=h.config.players.map((p,i)=>({seat:i,ai:room.seats[i]?.controller==='ai',name:room.seats[i]?.name||'Waiting for PLAYER',size:h.config.size,eliminated:eliminated.has(p.id),cells:[],hero:[]})),byBoard=new Map(h.config.players.map((p,i)=>[p.boardId,{board:boards[i],cells:new Map()}]));
 if(h.status!=='placement')for(const {event:e} of h.events){const target=byBoard.get(e.meta?.targetBoardId);if(e.kind!=='impact'||!target)continue;
  const u=e.unitId?units.get(e.unitId):null,type=e.statistics?.unitType||u?.type,kind=e.unitId&&(dead.has(e.unitId)||!['cav','castle'].includes(type))?type||null:null;
  if(e.unitId&&type==='hero'){const hits=(heroHits.get(e.unitId)||0)+1;heroHits.set(e.unitId,hits);for(const c of e.cells)heroes.set(target.board.seat+':'+c.x+','+c.y,{seat:target.board.seat,cell:{x:c.x,y:c.y},state:hits>=3?'dead':hits===2?'wounded':'hit'});}
  for(const c of e.cells){const key=c.x+','+c.y,prior=target.cells.get(key);target.cells.set(key,{x:c.x,y:c.y,hit:!!e.unitId,kind,...(e.meta?.source==='plague'||prior?.plague?{plague:true}:{})});}
 }
 for(const {board,cells} of byBoard.values())board.cells=[...cells.values()];for(const {seat,...hero} of heroes.values())boards[seat].hero.push(hero);
 return {code:room.code,revision:room.revision,round:h.round,phase:h.status==='placement'?'placement':h.status==='complete'?'finished':'battle',closed:!!room.closed,current:h.config.players.findIndex(p=>p.id===h.activePlayerId),boards};
}

// A read-only delta of already-executed public events. No observer joins a seat.
export function spectatorFeed(room,{after,epoch}={}){
 const view=spectatorView(room),h=room.host,end=h.events.length,current=String(room.epoch??0),valid=Number.isSafeInteger(after)&&after>=0&&after<=end&&epoch===current&&end-after<=2000;
 const base={...view,epoch:current,cursor:end,reset:!valid,events:[]};
 if(!valid||h.status==='placement')return base;
 const d={id:room.code,configuration:h.config,participants:h.config.players.map((p,seat)=>({actor:p.id,seat,displayName:room.seats[seat]?.name,kind:room.seats[seat]?.controller==='ai'?'ai':'guest'}))};
 const facts=h.events.slice(after).map((r,i)=>({...r,index:after+i}));
 const heroHits=new Map();for(let i=0;i<after;i++){const e=h.events[i].event;if(e.kind==='impact'&&e.unitId&&e.statistics?.unitType==='hero')heroHits.set(e.unitId,(heroHits.get(e.unitId)||0)+1);}
 base.events=buildReplay(d,facts,[],{heroHits}).timeline.filter(e=>!['checkpoint','result'].includes(e.kind));
 return base;
}

// Called exclusively after Dev Room authorization. Never use for public spectators.
export function developerSpectatorView(room,request={}){
 const view=Object.hasOwn(request,'after')?spectatorFeed(room,request):spectatorView(room);
 view.inspection=true;
 for(const board of view.boards){
  const player=room.host.config.players[board.seat],seat=room.host.state.seats.find(s=>s.playerId===player.id),shots=new Set(seat.shots),cells=new Map(board.cells.map(c=>[c.x+','+c.y,c]));
  for(const u of room.host.state.match.units.filter(u=>u.ownerId===player.id)){
   const positions=u.type==='hero'&&u.hero?.activated&&u.hero.currentCell?[u.hero.currentCell]:u.cells;
   const own=new Set(positions.map(c=>c.x+','+c.y));
   for(const c of positions){const k=c.x+','+c.y,hit=shots.has(k);cells.set(k,{...cells.get(k),x:c.x,y:c.y,hit,kind:u.type,observation:hit?'hit':'revealed',...(u.type==='castle'?{castleMask:(own.has(c.x+','+(c.y-1))?1:0)|(own.has((c.x+1)+','+c.y)?2:0)|(own.has(c.x+','+(c.y+1))?4:0)|(own.has((c.x-1)+','+c.y)?8:0)}:{})});}
  }
  board.cells=[...cells.values()];
 }
 return view;
}
