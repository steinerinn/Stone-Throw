import {isDeepStrictEqual} from 'node:util';
import {archiveValue,archiveSequence,archiveRows,isArchive} from '../canonical/compiled/archives.js';
// Private channel codec. Archives are append-only sequences; replacement/truncation
// starts a new sequence. Mutable live state is sent on every transaction.
export function archiveEncoder({prune=false}={}){const paths=new Map();let serial=0,last;const encode=value=>{const updates=[],visited=new Set();const sequence=(rows,path)=>{visited.add(path);let p=paths.get(path);if(p?.source===rows)return{$archive:p.id,length:rows.length};if(!p||rows.length<p.rows.length||p.rows.some((r,i)=>r!==rows[i]&&!isDeepStrictEqual(r,rows[i]))){p={id:++serial,rows:[]};paths.set(path,p);}const from=p.rows.length;if(rows.length>from||!p.sent)updates.push({id:p.id,from,rows:rows.slice(from)});p.sent=true;p.rows=archiveRows(rows);p.source=isArchive(rows)?rows:null;return{$archive:p.id,length:rows.length};};const walk=(v,path)=>{if(!v||typeof v!=='object')return v;if(v.contract==='stone-throw-host-v1'){const combat=(s,p)=>({...s,match:{...s.match,history:sequence(s.match.history,p+'.history'),knowledge:Object.fromEntries(Object.entries(s.match.knowledge).map(([id,k])=>[id,{...k,boards:Object.fromEntries(Object.entries(k.boards).map(([owner,b])=>[owner,{...b,cells:sequence(b.cells,p+'.cells.'+id+'.'+owner)}])),events:sequence(k.events,p+'.events.'+id)}]))}}),state=combat(v.state,path+'.state'),rng={...v.rng,draws:sequence(v.rng.draws,path+'.rng')};return{$host:{...v,state,rng,events:sequence(v.events,path+'.events'),history:sequence(v.history,path+'.commands'),initial:sequence([v.initial],path+'.initial'),initialRng:sequence([v.initialRng],path+'.initial-rng'),pendingRoot:v.pendingRoot?{...v.pendingRoot,state,rng}:null}};}if(v instanceof Map)return{$map:[...v].map(([k,x],i)=>[k,walk(x,path+'.map.'+i)])};if(Array.isArray(v))return v.map((x,i)=>walk(x,path+'.'+i));return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,walk(x,path+'.'+k)]));};const next=walk(value,'root'),released=[];for(const [path,p]of paths)if(prune&&!visited.has(path)){released.push(p.id);paths.delete(path);}last=next;return{archiveWire:1,value:next,updates,...(released.length?{released}:{})};};encode.checkpoint=()=>({archiveWire:1,value:last,updates:[...paths.values()].map(p=>({id:p.id,from:0,rows:p.rows}))});return encode;}
function legacyArchiveDecoder(){const sequences=new Map(),snapshots=new Map();return packet=>{if(packet?.archiveWire!==1||!Array.isArray(packet.updates))throw Error('Invalid archive packet');for(const u of packet.updates){if(!Number.isSafeInteger(u.id)||u.id<1||!Number.isSafeInteger(u.from)||!Array.isArray(u.rows))throw Error('Invalid archive update');let a=sequences.get(u.id);if(!a){if(u.from!==0)throw Error('Missing archive base');a=[];sequences.set(u.id,a);}if(a.length!==u.from)throw Error('Archive cursor mismatch');for(const row of u.rows)a.push(archiveValue(row));}for(const id of packet.released||[]){sequences.delete(id);snapshots.delete(id);}const walk=v=>{if(!v||typeof v!=='object')return v;if(Object.hasOwn(v,'$archive')){const a=sequences.get(v.$archive);if(!a||!Number.isSafeInteger(v.length)||v.length<0||v.length>a.length)throw Error('Missing archive records');let cached=snapshots.get(v.$archive);if(!cached||cached.length!==v.length){cached=archiveSequence(a.slice(0,v.length));snapshots.set(v.$archive,cached);}return cached;}if(Object.hasOwn(v,'$host')){const h=v.$host,state=walk(h.state),rng=walk(h.rng);return{...h,state,rng,events:walk(h.events),history:walk(h.history),initial:walk(h.initial)[0],initialRng:walk(h.initialRng)[0],pendingRoot:h.pendingRoot?{...h.pendingRoot,state,rng}:null};}if(Object.hasOwn(v,'$map'))return new Map(v.$map.map(([k,x])=>[k,walk(x)]));if(Array.isArray(v))return v.map(walk);return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,walk(x)]));};return walk(packet.value);};}

// Journal v2 retains unchanged local-session records once, outside the live value.
// The inner host archive format and reconstructed authoritative value are unchanged.
export function journalArchiveEncoder(){
 const inner=archiveEncoder({prune:true}),records=new Map();let serial=0,last;
 const encode=value=>{
  const packet=inner(value),used=new Set(),snapshotUpdates=[];
  if(Array.isArray(packet.value?.local))packet.value={...packet.value,local:packet.value.local.map(row=>{
   if(typeof row.token!=='string')throw Error('Invalid persisted local session');
   if(used.has(row.token))throw Error('Duplicate persisted local session');used.add(row.token);
   const text=JSON.stringify(row);let record=records.get(row.token);
   if(!record||record.text!==text){record={id:record?.id??++serial,text,value:row};records.set(row.token,record);snapshotUpdates.push({id:record.id,value:row});}
   return {$snapshot:record.id};
  })};
  const snapshotReleased=[];for(const [key,record]of records)if(!used.has(key)){snapshotReleased.push(record.id);records.delete(key);}
  last=packet.value;return {...packet,archiveWire:2,snapshotUpdates,snapshotReleased};
 };
 encode.checkpoint=()=>({...inner.checkpoint(),archiveWire:2,value:last,snapshotUpdates:[...records.values()].map(({id,value})=>({id,value})),snapshotReleased:[]});
 return encode;
}
export function archiveDecoder(){
 const inner=legacyArchiveDecoder(),snapshots=new Map();
 return packet=>{
  if(packet?.archiveWire===1)return inner(packet);
  if(packet?.archiveWire!==2||!Array.isArray(packet.snapshotUpdates)||!Array.isArray(packet.snapshotReleased))throw Error('Invalid snapshot packet');
  const changed=new Set();for(const entry of packet.snapshotUpdates){if(!Number.isSafeInteger(entry.id)||entry.id<1||changed.has(entry.id)||!entry.value||typeof entry.value.token!=='string')throw Error('Invalid snapshot update');changed.add(entry.id);snapshots.set(entry.id,entry.value);}
  for(const id of packet.snapshotReleased){if(!Number.isSafeInteger(id)||changed.has(id)||!snapshots.delete(id))throw Error('Invalid snapshot release');}
  let value=packet.value;
  if(Array.isArray(value?.local))value={...value,local:value.local.map(ref=>{if(!ref||Object.keys(ref).join(',')!=='$snapshot'||!Number.isSafeInteger(ref.$snapshot)||!snapshots.has(ref.$snapshot))throw Error('Missing session snapshot');return snapshots.get(ref.$snapshot);})};
  return inner({...packet,archiveWire:1,value});
 };
}
