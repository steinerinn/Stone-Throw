import {isArchive,archiveValue} from '../canonical/compiled/archives.js';

// Process-local IPC references, never persisted. Only canonical sealed archive
// values qualify: a merely frozen container may still contain mutable children.
// Mutable arrays always cross in full, without main-thread prefix comparison.
function mapHosts(value,host){
 if(!value||typeof value!=='object'||Array.isArray(value)||value instanceof Map)return value;
 if(value.contract==='stone-throw-host-v1')return host(value);
 if(value.checkpointStrings===1)return {...value,value:mapHosts(value.value,host)};
 // Visit only authoritative host locations. Presentation caches and metadata
 // can be large too, but are mutable and must pass through without walking them.
 const room=r=>r?.host?.contract==='stone-throw-host-v1'?{...r,host:host(r.host)}:r;
 const checkpoint=c=>c?.contract==='local-group-session-v1'?{...c,battle:room(c.battle)}:room(c);
 const out=room(value);
 return {...out,...(Array.isArray(value.local)?{local:value.local.map(r=>({...r,checkpoint:checkpoint(r.checkpoint),...(r.slots?{slots:Object.fromEntries(Object.entries(r.slots).map(([k,s])=>[k,{...s,checkpoint:checkpoint(s.checkpoint)}]))}:{})}))}:{}),...(value.multiplayer&&!Array.isArray(value.multiplayer)&&typeof value.multiplayer==='object'?{multiplayer:{...value.multiplayer,...Object.fromEntries(['two','ring'].filter(k=>Array.isArray(value.multiplayer[k])).map(k=>[k,value.multiplayer[k].map(room)]))}}:{})};
}
function mapArchives(h,map){
 const state={...h.state,match:{...h.state.match,history:map(h.state.match.history),knowledge:Object.fromEntries(Object.entries(h.state.match.knowledge).map(([id,k])=>[id,{...k,events:map(k.events),boards:Object.fromEntries(Object.entries(k.boards).map(([owner,b])=>[owner,{...b,cells:map(b.cells)}]))}]))}},rng={...h.rng,draws:map(h.rng.draws)};
 return {...h,state,rng,events:map(h.events),history:map(h.history),initial:map(h.initial),initialRng:map(h.initialRng),pendingRoot:h.pendingRoot?{...h.pendingRoot,state,rng}:null};
}
export function checkpointArchiveEncoder(){
 const known=new Map();let serial=0,previous=new WeakSet();
 return value=>{
  const updates=[],refs=[],used=new Set(),observed=new WeakSet();let position=0;
  const packet=mapHosts(value,h=>mapArchives(h,v=>{
   const index=position++;
   if(!isArchive(v))return v;
   // One-shot or growing histories do not benefit from a second frozen copy in
   // the receiver. Promote only values observed unchanged on consecutive saves.
   observed.add(v);if(!previous.has(v))return v;
   let id=known.get(v);if(!id){id=++serial;if(!Number.isSafeInteger(id))throw Error('Archive transfer exhausted');known.set(v,id);updates.push([id,v]);}
   used.add(v);refs.push([index,id]);return null;
  }));
  const released=[];for(const [v,id]of known)if(!used.has(v)){known.delete(v);released.push(id);}
  previous=observed;
  return {checkpointArchives:1,value:packet,updates,refs,released};
 };
}
export function checkpointArchiveDecoder(){
 const known=new Map();
 return packet=>{
  const invalid=()=>{throw Error('Invalid archive transfer');};
  if(packet?.checkpointArchives!==1||!Array.isArray(packet.updates)||!Array.isArray(packet.refs)||!Array.isArray(packet.released))invalid();
  const added=new Set();
  for(const row of packet.updates){if(!Array.isArray(row)||row.length!==2)invalid();const [id,v]=row;if(!Number.isSafeInteger(id)||id<1||known.has(id)||!v||typeof v!=='object')invalid();known.set(id,archiveValue(v));added.add(id);}
  for(const id of packet.released){if(added.has(id)||!known.delete(id))invalid();}
  const refs=new Map();for(const row of packet.refs){if(!Array.isArray(row)||row.length!==2)invalid();const [index,id]=row;if(!Number.isSafeInteger(index)||index<0||refs.has(index)||!known.has(id))invalid();refs.set(index,id);}
  let position=0;
  const value=mapHosts(packet.value,h=>mapArchives(h,v=>{const index=position++;if(!refs.has(index))return v;if(v!==null)invalid();const id=refs.get(index);refs.delete(index);return known.get(id);}));
  if(refs.size)invalid();return value;
 };
}
