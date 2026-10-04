// Private, process-lifetime IPC cache only. These references never reach disk.
// Strings are immutable: equality cannot conceal an in-place state mutation.
// Cache by field, never by long string content: similar histories must not cause
// hash collisions and comparisons against unrelated saved games.
// All object-valued checkpoints and all other metadata are captured every time.
export function checkpointStringEncoder(){
 const known=new Map();let serial=0;
 return value=>{
  const strings=[],refs=[],released=[],used=new Set();
  const capture=(v,index,slot)=>{
   if(typeof v!=='string')return v;
   const key=JSON.stringify([index,slot]),previous=known.get(key);let id=previous?.id;
   if(!previous||previous.text!==v){id=++serial;if(!Number.isSafeInteger(id))throw Error('Checkpoint transfer exhausted');if(previous)released.push(previous.id);known.set(key,{id,text:v});strings.push([id,v]);}
   used.add(key);refs.push([index,slot,id]);return null;
  };
  let next=value;
  if(Array.isArray(value?.local))next={...value,local:value.local.map((row,index)=>({...row,checkpoint:capture(row.checkpoint,index,null),...(row.slots?{slots:Object.fromEntries(Object.entries(row.slots).map(([name,slot])=>[name,{...slot,checkpoint:capture(slot.checkpoint,index,name)}]))}:{})}))};
  for(const [key,{id}]of known)if(!used.has(key)){known.delete(key);released.push(id);}
  return {checkpointStrings:1,value:next,strings,refs,released};
 };
}
export function checkpointStringDecoder(){
 const known=new Map();
 return packet=>{
  const invalid=()=>{throw Error('Invalid checkpoint transfer');};
  if(packet?.checkpointStrings!==1||!Array.isArray(packet.strings)||!Array.isArray(packet.refs)||!Array.isArray(packet.released))invalid();
  const added=new Set();for(const row of packet.strings){if(!Array.isArray(row)||row.length!==2)invalid();const [id,text]=row;if(!Number.isSafeInteger(id)||id<1||known.has(id)||typeof text!=='string')invalid();known.set(id,text);added.add(id);}
  for(const id of packet.released){if(added.has(id)||!known.delete(id))invalid();}
  const targets=new Set();
  for(const ref of packet.refs){
   if(!Array.isArray(ref)||ref.length!==3)invalid();const [index,slot,id]=ref;
   if(!Number.isSafeInteger(index)||index<0||!Array.isArray(packet.value?.local)||!known.has(id)||(slot!==null&&typeof slot!=='string'))invalid();
   const key=JSON.stringify([index,slot]);if(targets.has(key))invalid();targets.add(key);
   const row=packet.value.local[index];if(!row||slot!==null&&(!row.slots||!Object.hasOwn(row.slots,slot)))invalid();
   const target=slot===null?row:row.slots[slot];if(!target||target.checkpoint!==null)invalid();target.checkpoint=known.get(id);
  }
  return packet.value;
 };
}
