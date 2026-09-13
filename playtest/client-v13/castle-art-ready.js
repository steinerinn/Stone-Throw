const decoded=new Map();
function ready(mask){const url=`assets/units/castle/tile-${String(mask).padStart(2,'0')}.png`;if(!decoded.has(url)){const image=new Image();image.src=url;decoded.set(url,image.decode().catch(error=>{decoded.delete(url);throw error;}));}return decoded.get(url);}
// A visual commit waits for its existing tile bytes, never changes host placement/RNG.
export async function castleArtReady(snapshot){const masks=new Set();for(const u of snapshot.owned)if(u.kind==='castle'){const set=new Set(u.cells.map(c=>c.x+','+c.y));for(const c of u.cells){let m=0;if(set.has(c.x+','+(c.y-1)))m|=1;if(set.has((c.x+1)+','+c.y))m|=2;if(set.has(c.x+','+(c.y+1)))m|=4;if(set.has((c.x-1)+','+c.y))m|=8;masks.add(m);}}await Promise.all([...masks].map(ready));}
