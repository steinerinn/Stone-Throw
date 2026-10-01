import {createHash} from 'node:crypto';
// The journal envelope contains JSON inside a JSON string. Retained checkpoints
// are themselves strings, so repeatedly escaping/copying them dominates saves.
// Reuse their exact UTF-8 fragments; emitted bytes remain ordinary v1 JSON.
export function journalJson({budget=64*1024*1024,threshold=16384}={}){
 const cache=new Map();let bytes=0;
 function textParts(text){let p=cache.get(text);if(p){cache.delete(text);cache.set(text,p);return p;}
  const raw=JSON.stringify(text);p={raw:Buffer.from(raw),quoted:Buffer.from(JSON.stringify(raw).slice(1,-1))};p.bytes=p.raw.length+p.quoted.length+text.length*2;
  if(p.bytes<=budget){while(bytes+p.bytes>budget){const [key,old]=cache.entries().next().value;cache.delete(key);bytes-=old.bytes;}cache.set(text,p);bytes+=p.bytes;}return p;
 }
 return function prepare(){const large=new WeakMap();
  function contains(v){if(typeof v==='string')return v.length>=threshold;if(!v||typeof v!=='object')return false;if(large.has(v))return large.get(v);const yes=Object.values(v).some(contains);large.set(v,yes);return yes;}
  return value=>{const parts=[];let pending=[];
   function flush(){if(!pending.length)return;const raw=pending.join('');parts.push({raw:Buffer.from(raw),quoted:Buffer.from(JSON.stringify(raw).slice(1,-1))});pending=[];}
   function emit(v,array=false){
    if(typeof v==='string'&&v.length>=threshold){flush();parts.push(textParts(v));return;}
    if(!contains(v)){const text=JSON.stringify(v);pending.push(text===undefined&&array?'null':text);return;}
    if(Array.isArray(v)){pending.push('[');for(let i=0;i<v.length;i++){if(i)pending.push(',');emit(v[i],true);}pending.push(']');return;}
    pending.push('{');let first=true;for(const key of Object.keys(v)){if(v[key]===undefined||typeof v[key]==='function'||typeof v[key]==='symbol')continue;if(!first)pending.push(',');first=false;pending.push(JSON.stringify(key),':');emit(v[key]);}pending.push('}');
   }
   emit(value);flush();const hash=createHash('sha256');for(const p of parts)hash.update(p.raw);return {parts,sha256:hash.digest('hex')};
  };
 };
}
export function journalBuffers(sequence,previous,encoded){
 return [Buffer.from('{"sequence":'+sequence+',"previous":'+JSON.stringify(previous)+',"sha256":'+JSON.stringify(encoded.sha256)+',"payload":"'),...encoded.parts.map(p=>p.quoted),Buffer.from('"}\n')];
}
// Handle partial writes without repeating bytes already appended. Never retry an
// ambiguous failed append. The existing failed-store path then stops serving.
export function appendBuffers(fs,fd,buffers){let index=0,offset=0,total=0;
 while(index<buffers.length){const batch=buffers.slice(index,index+512);if(offset)batch[0]=batch[0].subarray(offset);const written=fs.writevSync(fd,batch);if(written<=0)throw Error('checkpoint-short-write');total+=written;let left=written;
  while(index<buffers.length&&left>=buffers[index].length-offset){left-=buffers[index].length-offset;index++;offset=0;}offset+=left;
 }return total;
}
