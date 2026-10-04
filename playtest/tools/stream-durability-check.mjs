import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import http from 'node:http';import {createGunzip} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {openAsyncStore} from '../server/async-store.mjs';
import {publicStreamWriter} from '../server/public-stream-compression.mjs';

const pendingTimers=new Set(),originalInterval=globalThis.setInterval,originalClear=globalThis.clearInterval;
globalThis.setInterval=(fn,ms,...args)=>{const t=originalInterval(fn,ms,...args);if(ms===5000)pendingTimers.add(t);return t;};
globalThis.clearInterval=t=>{pendingTimers.delete(t);return originalClear(t);};
const mode=process.argv[2],expectAbort=process.argv.includes('--expect-abort');
if(!['identity','gzip','failure'].includes(mode)){
 for(const kind of expectAbort?['gzip']:['identity','gzip','failure']){
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'cs-stream-durable-'));
  const run=spawnSync(process.execPath,['--import',new URL('./fixtures/durable-hold.mjs',import.meta.url).href,fileURLToPath(import.meta.url),kind,...(expectAbort?['--expect-abort']:[])],{windowsHide:true,stdio:'inherit',env:{...process.env,ST_TEST_DURABLE_HOLD:directory,ST_TEST_DURABLE_FAIL:kind==='failure'?'1':'0'},timeout:45000});
  assert.equal(run.status,0,kind+' durable stream test failed');
 }
 console.log(JSON.stringify({passed:true,realFsyncHeldBeyondIdleTimeout:true,noAcknowledgementBeforeDurability:true,failedFsyncNeverAcknowledged:expectAbort?undefined:true,expectAbort}));
}else{
 const directory=process.env.ST_TEST_DURABLE_HOLD,store=await openAsyncStore(directory,'stream-test','production');
 await store.write({local:[],counter:0});fs.writeFileSync(path.join(directory,'hold'),'test');
 let completed=false,failed=false,operation,heartbeats=0;const frames=[];
 const server=http.createServer((req,res)=>{
  if(req.url==='/health'){heartbeats++;res.end('healthy');return;}
  if(req.url==='/abandon'){const abandoned=publicStreamWriter(req,res);res.writeHead(200,{'Content-Type':'application/x-ndjson'});abandoned.write('{"type":"pending"}\n');return;}
  const writer=publicStreamWriter(req,res);res.writeHead(200,{'Content-Type':'application/x-ndjson'});
  writer.write('{"type":"progress","update":{"presentation":[]}}\n');
  operation=(async()=>{try{await store.write({local:[],counter:1});completed=true;writer.write('{"type":"result","update":{"accepted":true}}\n');}catch{failed=true;writer.write('{"type":"error","error":"save-failed"}\n');}finally{writer.end();}})();
 });
 // Identical idle timeout to main.mjs; it must not be increased by the fix.
 server.setTimeout(20000,socket=>socket.destroy());
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port,started=performance.now();let timer;
 try{
  timer=setInterval(()=>{http.get(origin+'/health',r=>r.resume()).on('error',()=>{});},1000);
  let aborted=false;
  await new Promise((resolve,reject)=>{
   const request=http.get(origin,{headers:{'Accept-Encoding':mode==='identity'?'identity':'gzip'}},res=>{
    const stream=res.headers['content-encoding']==='gzip'?res.pipe(createGunzip()):res;let buffer='';stream.setEncoding('utf8');
    stream.on('data',chunk=>{buffer+=chunk;let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);if(!line)continue;const item=JSON.parse(line);frames.push({type:item.type,ms:performance.now()-started});if(item.type==='result')assert.equal(completed,true,'Response cannot acknowledge before fsync');if(item.type==='pending'){assert.equal(item.update,undefined);assert.equal(item.accepted,undefined);}}});
    res.on('aborted',()=>{aborted=true;resolve();});stream.on('end',resolve);stream.on('error',e=>{if(expectAbort)resolve();else reject(e);});res.on('error',e=>{if(expectAbort)resolve();else reject(e);});
   });request.on('error',reject);
  });
  await operation;
  assert.equal(pendingTimers.size,0,'Pending stream timers released');
  assert.ok(fs.existsSync(path.join(directory,'entered')),'Real persistence worker reached fsync hold');
  assert.ok(heartbeats>=15,'HTTP event loop remains responsive during worker fsync');
  if(expectAbort){assert.equal(aborted,true);assert.equal(frames.some(f=>f.type==='result'),false);}
  else{assert.equal(aborted,false);assert.ok(frames.filter(f=>f.type==='pending').length>=3);assert.equal(frames.at(-1).type,mode==='failure'?'error':'result');assert.equal(failed,mode==='failure');assert.equal(completed,mode!=='failure');}
  await new Promise((resolve,reject)=>{http.get(origin+'/abandon',{headers:{'Accept-Encoding':mode==='identity'?'identity':'gzip'}},res=>{res.once('data',()=>{res.destroy();resolve();});res.on('error',()=>{});}).on('error',reject);});
  await new Promise(resolve=>setTimeout(resolve,20));assert.equal(pendingTimers.size,0,'Disconnected streams release their timer');
  console.log(JSON.stringify({passed:true,mode,aborted,completed,failed,heartbeats,frames,evidence:directory}));
 }finally{clearInterval(timer);await operation;await new Promise(resolve=>server.close(resolve));await store.release();}
}
