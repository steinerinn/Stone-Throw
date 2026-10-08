import {createHash} from 'node:crypto';
import {publicBoardView} from './board-overview.mjs';
// Public replay format. This module never executes combat, policy or RNG.
export const REPLAY_VERSION='CHAIN_SIEGE_PUBLIC_REPLAY_V1';
export const immediateReplayKinds=new Set(['inf','archer','monk','dwarf','goblin','catapult','elf','cleric','necro','wizard','demon','dragon','assassin']);
const key=c=>c.x+','+c.y;
const validCell=(c,size)=>c&&Number.isInteger(c.x)&&Number.isInteger(c.y)&&c.x>=0&&c.y>=0&&c.x<size&&c.y<size;

// Only knowledge shared by every non-owner observer is public. Owner truth,
// Scout-only knowledge, decisions, unit IDs and compatibility clues never enter.
export function publicCheckpoint(h){
 return {round:h.round,turn:h.turnIndex,active:h.config.players.findIndex(p=>p.id===h.activePlayerId),boards:h.config.players.map((target,seat)=>{
  const views=h.config.players.filter(p=>p.id!==target.id).map(p=>h.state.match.knowledge[p.id]?.boards[target.id]);
  let hero=[];const cells=(views[0]?.cells||[]).flatMap(c=>{
   if(!validCell(c.cell,h.config.size))return [];
   const same=views.map(v=>v?.cells.find(x=>key(x.cell)===key(c.cell)));if(same.some(x=>!x))return [];
   const observation=same.every(x=>['impact','hit'].includes(x.observation))?'hit':same.every(x=>x.observation==='miss')?'miss':null;if(!observation)return [];
   const type=null;
   return [{x:c.cell.x,y:c.cell.y,observation,kind:type}];
  });
  // Reuse accepted disclosure geometry, with private Scout knowledge removed.
  // Only already-public contacts may receive the adapter's presentation art.
  if(h.initial&&h.state.seats){const observer=h.config.players.find(p=>p.id!==target.id),own=h.state.seats.find(p=>p.playerId===observer.id),enemy=h.state.seats.find(p=>p.playerId===target.id);
   const view={...h,config:{...h.config,players:[observer,target]},state:{...h.state,seats:[{...own,scouted:[],monkCandidates:[]},enemy]}};
   const presentation=publicBoardView(view,seat);hero=presentation.hero.map(({cell,state})=>({cell:{...cell},state}));const byCell=new Map(presentation.cells.map(c=>[key(c.cell),c]));
   // The accepted final battlefield explicitly publishes the completed board.
   // This occurs only at the final cursor, never in an earlier seek state.
   if(h.status==='complete')for(const shown of presentation.cells)if(validCell(shown.cell,h.config.size)&&!cells.some(c=>key(c)===key(shown.cell)))cells.push({x:shown.cell.x,y:shown.cell.y,observation:shown.observation==='miss'?'miss':'revealed',kind:null});
   for(const c of cells){const shown=byCell.get(key(c));if(!shown)continue;c.kind=shown.kind||null;for(const field of ['corePresentation','unitPresentation','castleMask','knownDestroyed'])if(shown[field]!==undefined)c[field]=structuredClone(shown[field]);}
  }
  return {seat,cells,hero};
 })};
}

export function buildReplay(d,facts,checkpoints=[],{heroHits:priorHeroHits=[]}={}){
 const size=d.configuration?.size||15,seat=a=>d.participants.findIndex(p=>p.actor===a),board=b=>d.configuration?.players?.findIndex(p=>p.boardId===b)??-1;
 const timeline=[],byCursor=new Map(checkpoints.map(c=>[c.cursor,c.value]));let lastTurn=null;const heroHits=new Map(priorHeroHits);
 const animation=e=>{const m=e.meta||{},kind=({'direct-human':'enemy-shot','direct-ai':'enemy-shot','demon-blast':'demon','catapult-shot':'catapult'})[m.source]||m.source;if(!['enemy-shot','dragon','demon','wizard','archer','goblin','catapult','assassin','plague','revolt'].includes(kind))return undefined;const identity=(kind==='revolt'?[e.rootId,'revolt']:[e.rootId,e.workId,m.source,m.targetBoardId]).join(':');return {kind,...(kind==='revolt'?{level:e.statistics?.revoltLevel||1}:{}),group:createHash('sha256').update(identity).digest('hex').slice(0,24),...(validCell(m.origin,size)?{origin:{x:m.origin.x,y:m.origin.y}}:{})};};
 const checkpoint=cursor=>{const value=byCursor.get(cursor);if(value)timeline.push({kind:'checkpoint',...value});};checkpoint(0);
 for(const f of facts){const e=f.event,m=e.meta||{},s=e.statistics||{};
  if(Number.isInteger(f.turnIndex)&&f.turnIndex!==lastTurn){lastTurn=f.turnIndex;timeline.push({kind:'turn',turn:lastTurn});}
  if(e.kind==='scouted')timeline.push({kind:'announcement',name:'scouting'});
  if(e.kind==='peasant-revolt')timeline.push({kind:'announcement',name:'peasant-revolt',level:e.amount});
  if(['impact','repeat-ignored','suspect-eliminated'].includes(e.kind)&&board(m.targetBoardId)>=0){
   const heroHit=e.kind==='impact'&&e.unitId&&s.unitType==='hero';if(heroHit)heroHits.set(e.unitId,(heroHits.get(e.unitId)||0)+1);
   const cells=e.cells.filter(c=>validCell(c,size)).map(c=>({x:c.x,y:c.y,...(heroHit?{kind:'hero',heroState:heroHits.get(e.unitId)>=3?'dead':heroHits.get(e.unitId)===2?'wounded':'hit'}:{}),...(e.kind==='impact'&&e.unitId&&immediateReplayKinds.has(s.unitType)?{kind:s.unitType,knownDestroyed:true,unitPresentation:{hit:true,scoutArt:false}}:{})}));
   if(cells.length)timeline.push({kind:m.source==='revolt'?'revolt':m.source==='plague'?'plague':['direct-human','direct-ai'].includes(m.source)?'shot':m.source==='catapult-shot'?'catapult':'contact',actor:seat(m.ownerId),board:board(m.targetBoardId),observation:e.kind==='impact'?(e.unitId?'hit':'miss'):'repeat',cells,...(animation(e)?{animation:animation(e)}:{})});
  }
  if(e.kind==='attack-started'&&['archer','catapult-shot','monk-deflect','goblin','dwarf','wizard','demon','dragon'].includes(e.reason))timeline.push({kind:'special',name:e.reason,actor:seat(m.ownerId)});
  // Announcement only: resurrection/Hero coordinates can still be secret.
  if(['resurrection','hero-moved','hero-activated','hero-killed'].includes(e.kind))timeline.push({kind:'announcement',name:e.kind});
  if(s.eliminationBoundary)timeline.push({kind:'elimination',seats:s.eliminationBoundary.dead.map(seat).filter(i=>i>=0)});
  checkpoint(f.index+1);
 }
 if(d.endedAt)timeline.push({kind:'result',placements:d.finalResult?.placements?d.participants.map(p=>d.finalResult.placements[p.actor]):null});
 return {replayVersion:REPLAY_VERSION,matchId:d.id,rulesVersion:d.configuration?.rulesVersion||null,build:d.build,mode:d.classification?.mode||d.mode,format:d.classification?.format||d.participants.length+'p',size,startedAt:d.startedAt,endedAt:d.endedAt,participants:d.participants.map(p=>({seat:p.seat,name:p.displayName||'PLAYER',ai:p.kind==='ai',participation:p.kind==='ai'?'AI':p.reliability==='Full'?'completed':'Disconnect/Abandon'})),coverage:checkpoints.length&&byCursor.has(0)?'full-public-events':'partial',timeline};
}
