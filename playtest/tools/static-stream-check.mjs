import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Writable} from 'node:stream';
import {publicAssetCache} from '../server/static-cache.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-static-stream-')),file=path.join(dir,'large.wav');
fs.writeFileSync(file,Buffer.alloc(16*1024*1024,23));
const serve=publicAssetCache(),original=fs.createReadStream;let opened=0,closed=0,maxBuffered=0;
fs.createReadStream=function(name,...args){const s=original.call(this,name,...args);if(name===file){opened++;s.once('close',()=>closed++);}return s;};
function response(abort=false){const r=new Writable({highWaterMark:1024,write(chunk,encoding,done){this.bytes+=chunk.length;maxBuffered=Math.max(maxBuffered,this.writableLength);if(abort)this.destroy();setImmediate(done);}});return Object.assign(r,{bytes:0,headers:{},setHeader(k,v){this.headers[k]=v;},writeHead(status){this.status=status;}});}
try{
 const a=response(),b=response();await Promise.all([serve({headers:{}},a,file),serve({headers:{}},b,file)]);
 assert.equal(a.bytes,16*1024*1024);assert.equal(b.bytes,a.bytes);assert.equal(a.headers.ETag,b.headers.ETag);
 assert.equal(opened,3,'Concurrent cold requests share one hash stream');assert.equal(closed,opened);
 const cached=response();await serve({headers:{'if-none-match':'W/'+a.headers.ETag}},cached,file);assert.equal(cached.status,304);assert.equal(cached.bytes,0);assert.equal(opened,3);
 for(let n=0;n<10;n++)await serve({headers:{}},response(true),file);
 assert.equal(closed,opened,'Aborted downloads must close their source streams');assert.ok(maxBuffered<=128*1024,'Slow downloads must not buffer whole assets');
 console.log(JSON.stringify({passed:true,checks:9,assetBytes:a.bytes,concurrentHashStreams:1,maxBuffered,abortedDownloads:10,openStreams:opened-closed}));
}finally{fs.createReadStream=original;}
