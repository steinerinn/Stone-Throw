export function createReplayCursor(replay){
 if(replay.replayVersion!=='CHAIN_SIEGE_PUBLIC_REPLAY_V1')throw Error('Unsupported replay version');
 const initial={round:null,turn:null,active:-1,boards:replay.participants.map(p=>({seat:p.seat,cells:{},eliminated:false})),highlight:[],notice:''},checkpoints=new Map([[0,structuredClone(initial)]]);
 function apply(s,e){s.highlight=[];s.notice=e.kind.toUpperCase();
  if(e.kind==='checkpoint'){s.round=e.round;s.turn=e.turn;s.active=e.active;for(const b of e.boards)for(const c of b.cells){const cells=s.boards.find(x=>x.seat===b.seat).cells,k=c.x+','+c.y;cells[k]={...cells[k],...c};}}
  if(e.kind==='turn')s.turn=e.turn;
  if(['shot','contact','plague','catapult'].includes(e.kind)){const b=s.boards.find(b=>b.seat===e.board);for(const c of e.cells){const k=c.x+','+c.y,old=b.cells[k]||{};b.cells[k]={...old,...c,observation:e.observation==='repeat'?old.observation||'hit':e.observation,plague:e.kind==='plague'||old.plague};s.highlight.push({board:e.board,...c});}}
  if(e.kind==='special'||e.kind==='announcement')s.notice=e.name.replaceAll('-',' ').toUpperCase();
  if(e.kind==='elimination')for(const seat of e.seats)s.boards.find(b=>b.seat===seat).eliminated=true;
  return s;
 }
 let building=structuredClone(initial);replay.timeline.forEach((e,i)=>{apply(building,e);if((i+1)%32===0)checkpoints.set(i+1,structuredClone(building));});
 return {length:replay.timeline.length,seek(index){index=Math.max(0,Math.min(replay.timeline.length,Math.trunc(index)||0));const start=Math.floor(index/32)*32,state=structuredClone(checkpoints.get(start));for(let i=start;i<index;i++)apply(state,replay.timeline[i]);return {index,...state};}};
}
