import type {ResolutionContext,Operation} from './contracts.js';
import {seat,parseKey,emit} from './access.js';
import {random} from './rng.js';
import {work} from './scheduling.js';
/** Reserve all targets before any impact. Never inspect hidden occupancy. */
export function beginRevoltPulse(ctx:ResolutionContext,level:number){
 const pulse=ctx.state.revolt?.pulse;if(!pulse||pulse.level!==level)throw Error('Missing Revolt pulse');
 ctx.environmental={kind:'peasant-revolt',level};
 emit(ctx,'peasant-revolt',null,null,[],level,'round-complete');
 const ops:Operation[]=[];
 for(const id of pulse.players){const p=seat(ctx.state,id),size=ctx.state.match.boards.find(b=>b.id===p.boardId)!.width,cells:string[]=[];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const k=x+','+y;if(!p.shots.includes(k))cells.push(k);}
  for(let i=0;i<level&&cells.length;i++){const [k]=cells.splice(Math.floor(random(ctx.rng,'peasant-revolt-target')*cells.length),1),cell=parseKey(k!);
   // These IDs route canonical consequences. Environmental emitted facts have no actor/owner.
   ops.push({kind:'impact',meta:{actorId:id,ownerId:id,targetPlayerId:id,targetBoardId:p.boardId,sourceUnitId:null,source:'revolt',origin:null},cell,deferReactions:false});
  }
 }
 ops.push({kind:'hero-queue'},{kind:'same-turn-effects'});
 const frame=ctx.frames.at(-1)!;frame.current.splice(frame.cursor,0,...ops.map(op=>work(ctx,op,'turn-boundary')));
}
