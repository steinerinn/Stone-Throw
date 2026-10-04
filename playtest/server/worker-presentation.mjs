import {isDeepStrictEqual} from 'node:util';
// The worker's final room already contains these public frames. Reference exact
// copies within this one trusted message instead of cloning/encoding them again.
// No wire references survive into persistence or a public response.
export function packWorkerPresentation(room,result,updates,actor){
 const indices=room.presentation?.map(frames=>new Map(frames.map((f,i)=>[f.publicEvent?.id+':'+f.snapshot?.eventPosition,i])))||[];
 function pack(update,seat){
  if(!Array.isArray(update?.presentation))return {update};
  const frames=room.presentation?.[seat],map=indices[seat];if(!frames||!map)return {update};
  const refs=update.presentation.map(f=>map.get(f.publicEvent?.id+':'+f.snapshot?.eventPosition));
  if(refs.some((n,i)=>n===undefined||!isDeepStrictEqual(frames[n],update.presentation[i])))return {update};
  const {presentation,...rest}=update;return {update:rest,refs,seat};
 }
 return {result:pack(result,actor),updates:updates.map(pack)};
}
export function unpackWorkerPresentation(room,packed){
 function unpack(value){
  if(!value||!Object.hasOwn(value,'update'))throw Error('Invalid worker presentation');
  if(!Object.hasOwn(value,'refs'))return value.update;
  const frames=room.presentation?.[value.seat];
  if(!Array.isArray(frames)||!Array.isArray(value.refs)||value.refs.some(i=>!Number.isSafeInteger(i)||i<0||i>=frames.length))throw Error('Invalid worker frame reference');
  return {...value.update,presentation:value.refs.map(i=>frames[i])};
 }
 return {result:unpack(packed.result),updates:packed.updates.map(unpack)};
}
