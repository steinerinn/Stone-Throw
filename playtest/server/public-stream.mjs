import {isDeepStrictEqual} from 'node:util';
// Negotiated command-stream optimization. Progress has already queued these exact
// public frames in the client; the final authority snapshot still arrives intact.
// This state is request-local, never persisted or shared between observers.
export function incrementalPublicStream(enabled){
 const sent=new Map();
 const key=f=>typeof f?.publicEvent?.id==='string'&&Number.isSafeInteger(f.snapshot?.eventPosition)?f.publicEvent.id+':'+f.snapshot.eventPosition:null;
 return value=>{
  if(!enabled||!Array.isArray(value.update?.presentation))return value;
  if(value.type==='progress')for(const f of value.update.presentation){const k=key(f);if(k!==null)sent.set(k,f);}
  if(value.type!=='result')return value;
  // Compare the complete public value: a reused ID with changed content must
  // still be delivered. Never infer equivalence from an event cursor alone.
  const presentation=value.update.presentation.filter(f=>{const k=key(f);return k===null||!isDeepStrictEqual(sent.get(k),f);});
  return {...value,update:{...value.update,presentation}};
 };
}
