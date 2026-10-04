import assert from 'node:assert/strict';
import http from 'node:http';
import {createGunzip} from 'node:zlib';
import {publicStreamWriter} from '../server/public-stream-compression.mjs';
let release,finished=false;
const server=http.createServer(async(req,res)=>{
 const writer=publicStreamWriter(req,res);res.writeHead(200,{'Content-Type':'application/x-ndjson'});
 writer.write(JSON.stringify({type:'progress',value:'public '.repeat(1000)})+'\n');
 await new Promise(resolve=>{release=resolve;});finished=true;writer.write('{"type":"result"}\n');writer.end();
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
 for(const encoding of ['gzip','gzip;q=0','identity','br, gzip; q=0.8']){
  finished=false;let wire=0,text='';
  await new Promise((resolve,reject)=>{
   http.get({host:'127.0.0.1',port:server.address().port,headers:{'Accept-Encoding':encoding}},res=>{
    const compressed=res.headers['content-encoding']==='gzip';assert.equal(compressed,encoding==='gzip'||encoding.includes('0.8'));
    assert.equal(res.headers.vary,'Accept-Encoding');res.on('data',chunk=>{wire+=chunk.length;});
    const stream=compressed?res.pipe(createGunzip()):res;stream.setEncoding('utf8');
    stream.on('data',chunk=>{text+=chunk;if(text.includes('\n')&&!finished){assert.equal(JSON.parse(text.split('\n')[0]).type,'progress');release();}});
    stream.on('error',reject);stream.on('end',resolve);
   }).on('error',reject);
  });
  assert.equal(JSON.parse(text.trim().split('\n').at(-1)).type,'result');
  if(encoding==='gzip')assert.ok(wire<text.length/10);
 }
 console.log(JSON.stringify({passed:true,firstRecordBeforeCompletion:true,qualityZeroRespected:true,identityFallback:true,actualCompressedBytes:true}));
}finally{release?.();await new Promise(resolve=>server.close(resolve));}
