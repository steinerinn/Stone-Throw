import fs from 'node:fs';
import {createHash} from 'node:crypto';
// Only called after the public static allowlist has accepted the path. HTML,
// Dev Room, music range responses and every API retain their existing policy.
export function publicAssetCache(){
 const hashes=new Map();
 return (req,res,file)=>{
  const stat=fs.statSync(file,{bigint:true}),stamp=[stat.dev,stat.ino,stat.size,stat.mtimeNs,stat.ctimeNs].join(':');
  let cached=hashes.get(file),body;
  if(!cached||cached.stamp!==stamp){body=fs.readFileSync(file);cached={stamp,etag:'"'+createHash('sha256').update(body).digest('hex')+'"'};hashes.set(file,cached);}
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('ETag',cached.etag);
  const matches=String(req.headers['if-none-match']||'').split(',').map(v=>v.trim().replace(/^W\//,''));
  if(matches.includes('*')||matches.includes(cached.etag)){res.writeHead(304);res.end();return;}
  body??=fs.readFileSync(file);res.setHeader('Content-Length',body.length);res.writeHead(200);res.end(body);
 };
}
