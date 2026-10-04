import {createGzip,constants} from 'node:zlib';
export function publicStreamWriter(req,res){
 const gzip=String(req.headers['accept-encoding']||'').split(',').some(part=>{
  const [coding,...parameters]=part.trim().toLowerCase().split(';');
  const q=parameters.find(p=>p.trim().startsWith('q='));
  return coding==='gzip'&&(!q||Number(q.trim().slice(2))>0);
 });
 res.setHeader('Vary','Accept-Encoding');
 let stream=null,ended=false;
 const cleanup=()=>{ended=true;clearInterval(pending);};
 const write=text=>{if(ended||res.destroyed)return false;return (stream||res).write(text);};
 // A live command can be quiet while its ordered durable save completes.
 // This is transport liveness only: no snapshot, acceptance or early result.
 // Keep the existing socket timeout for abandoned/unresponsive connections.
 const pending=setInterval(()=>{if(!ended&&!res.destroyed&&!res.writableNeedDrain&&!stream?.writableNeedDrain)write('{"type":"pending"}\n');},5000);pending.unref();
 res.once('close',cleanup);res.once('finish',cleanup);
 if(!gzip)return {write,end:()=>{cleanup();res.end();}};
 res.setHeader('Content-Encoding','gzip');
 // Flush each completed NDJSON record: compression must not withhold progress
 // until the full AI turn or animation chain has completed.
 stream=createGzip({level:4,flush:constants.Z_SYNC_FLUSH});
 stream.on('error',error=>res.destroy(error));
 res.once('close',()=>stream.destroy());stream.pipe(res);
 return {write,end:()=>{cleanup();stream.end();}};
}
