/** Stage 7 legacy-compatible pure rules. Order and quirks are intentional.
 * Explicit readonly inputs; no DOM, RNG, state mutation or AI policy.
 * See extraction-map.json for source hashes and transitive dependencies. */

export function key(x:number,y:number){return `${x},${y}`;}

export function parseKey(k:string){const [x,y]=k.split(',').map(Number); return {x:x!,y:y!};}

export function inBounds(ctx:Readonly<{size:number}>,x:number,y:number){return x>=0&&x<ctx.size&&y>=0&&y<ctx.size;}

export function neighbors4(ctx:Readonly<{size:number}>,x:number,y:number){
const out=[];for(const [dx,dy] of ([[1,0],[-1,0],[0,1],[0,-1]] as const)){
const nx=x+dx, ny=y+dy;if(inBounds(ctx,nx,ny)) out.push(key(nx,ny));}
return out;}

export function neighbors8(ctx:Readonly<{size:number}>,x:number,y:number){ const res=[]; for(let dx=-1;dx<=1;dx++){ for(let dy=-1;dy<=1;dy++){ if(dx===0&&dy===0) continue; const nx=x+dx, ny=y+dy; if(inBounds(ctx,nx,ny)) res.push(key(nx,ny)); }} return res; }

export function ring3x3CellsOf(ctx:Readonly<{size:number}>,keys:Iterable<string>){ const s=new Set<string>(); for(const k of keys){ const {x,y}=parseKey(k); for(let dx=-1;dx<=1;dx++){ for(let dy=-1;dy<=1;dy++){ const nx=x+dx, ny=y+dy; if(inBounds(ctx,nx,ny)) s.add(key(nx,ny)); }} } return s; }
