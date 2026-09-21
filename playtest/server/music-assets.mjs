import fs from 'node:fs';
// Called only after the exact static asset allowlist. Stream selected music;
// byte ranges let phone browsers seek/loop without redownloading whole tracks.
export function serveMusic(req,res,file){
 const size=fs.statSync(file).size,headers={'Content-Type':'audio/mpeg','Accept-Ranges':'bytes','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'};
 let start=0,end=size-1,status=200;
 if(req.headers.range){const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!m||(!m[1]&&!m[2])){res.writeHead(416,{...headers,'Content-Range':'bytes */'+size});return res.end();}
  if(!m[1])start=Math.max(0,size-Number(m[2]));else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]));}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size){res.writeHead(416,{...headers,'Content-Range':'bytes */'+size});return res.end();}status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
 }
 res.writeHead(status,{...headers,'Content-Length':end-start+1});const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}
