import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {pipeline} from 'node:stream/promises';
import {createHash} from 'node:crypto';
// Only called after the public static allowlist has accepted the path. HTML,
// Dev Room, music range responses and every API retain their existing policy.
export function publicAssetCache(){
 const hashes=new Map();
 return async(req,res,file)=>{
  const stat=await fsp.stat(file,{bigint:true}),stamp=[stat.dev,stat.ino,stat.size,stat.mtimeNs,stat.ctimeNs].join(':');
  let cached=hashes.get(file);
  if(!cached||cached.stamp!==stamp){
   const entry={stamp};
   // Keep only the validator, never an asset-sized body. Concurrent downloads
   // share one chunked hash; response streams provide their own backpressure.
   entry.ready=(async()=>{const hash=createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);return '"'+hash.digest('hex')+'"';})();
   hashes.set(file,entry);cached=entry;
   entry.ready.catch(()=>{if(hashes.get(file)===entry)hashes.delete(file);});
  }
  const etag=await cached.ready;if(res.destroyed)return;
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('ETag',etag);
  const matches=String(req.headers['if-none-match']||'').split(',').map(v=>v.trim().replace(/^W\//,''));
  if(matches.includes('*')||matches.includes(etag)){res.writeHead(304);res.end();return;}
  res.setHeader('Content-Length',String(stat.size));res.writeHead(200);
  try{await pipeline(fs.createReadStream(file),res);}catch(error){if(!res.destroyed)throw error;}
 };
}
