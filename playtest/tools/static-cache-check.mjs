import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {startServer} from '../server/main.mjs';import {publicAssetCache} from '../server/static-cache.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-static-cache-')),app=await startServer({port:0,registryDir:dir+'/registry',stateDir:dir+'/state',logger:()=>{}});
try{
 const first=await fetch(app.origin+'/client-v13/game-log.js'),body=await first.text(),etag=first.headers.get('etag');assert.equal(first.status,200);assert.ok(etag);assert.match(first.headers.get('cache-control'),/must-revalidate/);
 const repeat=await fetch(app.origin+'/client-v13/game-log.js',{headers:{'If-None-Match':etag}});assert.equal(repeat.status,304);assert.equal(await repeat.text(),'');
 const root=await fetch(app.origin);assert.equal(root.headers.get('cache-control'),'no-store');await root.arrayBuffer();
 const api=await fetch(app.origin+'/api/registry/me',{method:'POST',headers:{Origin:app.origin,'Content-Type':'application/json'},body:'{}'});assert.equal(api.headers.get('cache-control'),'no-store');assert.equal(api.headers.get('etag'),null);await api.arrayBuffer();
 const denied=await fetch(app.origin+'/dev-room');assert.equal(denied.status,403);assert.equal(denied.headers.get('etag'),null);await denied.arrayBuffer();
 // A changed file must invalidate the old validator, even at the same byte size.
 const file=dir+'/public-fixture.js',serve=publicAssetCache();fs.writeFileSync(file,'first');let prior;
 function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},writeHead(status){this.status=status;},end(body){this.body=body;}};}
 let r=response();serve({headers:{}},r,file);prior=r.headers.ETag;fs.writeFileSync(file,'other');const future=new Date(Date.now()+2000);fs.utimesSync(file,future,future);r=response();serve({headers:{'if-none-match':prior}},r,file);assert.equal(r.status,200);assert.notEqual(r.headers.ETag,prior);assert.equal(r.body.toString(),'other');
 console.log(JSON.stringify({passed:true,firstBodyBytes:Buffer.byteLength(body),repeatBodyBytes:0,changedAssetInvalidates:true,privateAndHtmlUncached:true}));
}finally{await app.close();}
