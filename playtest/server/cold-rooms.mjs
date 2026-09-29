import {durableReplace} from './durable-file.mjs';
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
// Private recovery archives, separate from the live checkpoint. Never a public route.
export function coldRoomStore(directory){
 if(!directory)return null;const dir=path.join(directory,'retired-rooms');fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const encode=v=>JSON.stringify(v,(_,x)=>x instanceof Map?{$map:[...x]}:x),decode=s=>JSON.parse(s,(_,x)=>x?.$map?new Map(x.$map):x);
 return {write(value){const text=encode(value),hash=createHash('sha256').update(text).digest('hex'),file=path.join(dir,hash+'.json');if(!fs.existsSync(file)){durableReplace(file,text);}return hash;},read(hash){if(!/^[a-f0-9]{64}$/.test(hash))throw Error('checkpoint-unavailable');const text=fs.readFileSync(path.join(dir,hash+'.json'),'utf8');if(createHash('sha256').update(text).digest('hex')!==hash)throw Error('checkpoint-unavailable');return decode(text);}};
}
