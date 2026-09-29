import {isIP} from 'node:net';

function normalize(value){
 if(typeof value!=='string'||value.includes('%')||!isIP(value))return null;
 if(isIP(value)===4)return value;
 const canonical=new URL('http://['+value+']/').hostname.slice(1,-1);
 const mapped=/^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(canonical);
 if(mapped){const high=parseInt(mapped[1],16),low=parseInt(mapped[2],16);return [high>>8,high&255,low>>8,low&255].join('.');}
 return canonical;
}

// This opt-in assumes nginx overwrites X-Real-IP; other local processes are trusted.
// Never consume forwarding chains or accept a header from a non-loopback peer.
export function registryClientIp(req,trustLoopbackProxy=false){
 const peer=normalize(req.socket.remoteAddress);
 if(!trustLoopbackProxy||!(peer==='::1'||peer?.startsWith('127.')))return peer||'unknown';
 const raw=req.rawHeaders||[];let count=0;
 for(let i=0;i<raw.length;i+=2)if(raw[i].toLowerCase()==='x-real-ip')count++;
 if(count!==1)return peer;
 return normalize(req.headers['x-real-ip'])||peer;
}
