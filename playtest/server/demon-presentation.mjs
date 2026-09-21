// Bind a visible Demon impact to its existing reserved decorative data. The
// filtered two-board projection's array index is not an activation identity.
// This also survives suspension of the parent attack by a nested decision.
export function demonPresentationRunes(host,memory,impact,cache){
 const key=impact.rootId+':'+impact.meta.sourceUnitId+':'+impact.meta.targetBoardId;
 if(cache.has(key))return cache.get(key);
 let index=0,selected=null;
 for(const {event:e} of host.events){
  if(e.kind!=='attack-started'||e.reason!=='demon')continue;
  if(e.rootId===impact.rootId&&e.meta.sourceUnitId===impact.meta.sourceUnitId&&e.meta.targetBoardId===impact.meta.targetBoardId)selected=memory.demonRunes?.[index];
  index++;
 }
 if(!selected||selected.boardId!==impact.meta.targetBoardId)throw Error('Missing authoritative Demon presentation reservation');
 const runes=structuredClone(selected.runes);cache.set(key,runes);return runes;
}
