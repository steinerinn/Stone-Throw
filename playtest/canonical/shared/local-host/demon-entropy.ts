import {reserveResultMessage} from './result-message.js';
import type {ResolutionContext} from '../combat/contracts.js';
import {random} from '../combat/rng.js';
import {boardSize,cellKey,parseKey} from '../combat/access.js';
import {demonPatternFrom} from '../rules/attacks.js';
import type {NormalMemory} from './normal-policy.js';
import type {HostExecution} from '../host/lifecycle.js';

export interface DemonRuneBatch {boardId:string;runes:{cell:{x:number;y:number};glyph:string;rotation:number}[]}
const glyphs=['ᚠ','ᚢ','ᚦ','ᚱ','ᚲ','ᚷ','ᛉ','ᛏ','ᛒ','ᛞ'];
/** Authorized Stage 10 exception. Legacy visual order is row ascending X,
 * then column ascending Y, deduplicated by the ritual's rune map. Combat's
 * column-first impact order is deliberately not reused here. */
export function reserveNormalDemonRunes(ctx:ResolutionContext,memory:NormalMemory):void {
 const frame=ctx.frames.at(-1),op=frame?.current[frame.cursor]?.operation;
 if(op?.kind!=='attack'||op.entry.kind!=='demon')return;
 const meta=op.entry.meta;if(!meta.origin)throw Error('Demon presentation requires origin');
 const pattern=demonPatternFrom({size:boardSize(ctx.state,meta.targetBoardId)},cellKey(meta.origin)).map(parseKey);
 const row=pattern.filter(c=>c.y===meta.origin!.y).sort((a,b)=>a.x-b.x),column=pattern.filter(c=>c.x===meta.origin!.x).sort((a,b)=>a.y-b.y);
 const seen=new Set<string>(),runes:DemonRuneBatch['runes']=[];
 for(const cell of [...row,...column]){const key=cellKey(cell);if(seen.has(key))continue;seen.add(key);
  const glyph=glyphs[Math.floor(random(ctx.rng,'normal-demon-glyph')*glyphs.length)]!;
  const rotation=Math.floor(random(ctx.rng,'normal-demon-rotation')*8)*45;
  runes.push({cell:{...cell},glyph,rotation});
 }
 (memory.demonRunes??=[]).push({boardId:meta.targetBoardId,runes});
}
export const normalExecution=(memory:NormalMemory):HostExecution=>({reserveNormalDemonRunes:ctx=>reserveNormalDemonRunes(ctx,memory),normalTerminalMessage:host=>reserveResultMessage(host,memory)});
