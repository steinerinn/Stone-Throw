import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {registryClientIp} from '../server/client-ip.mjs';
import {startServer} from '../server/main.mjs';

let checks=0;
function check(actual,expected){assert.equal(actual,expected);checks++;}
function req(peer,value,extra={}){return {socket:{remoteAddress:peer},headers:{'x-real-ip':value,...extra},rawHeaders:value===undefined?[]:['X-Real-IP',value]};}
check(registryClientIp(req('127.0.0.1','192.0.2.1')),'127.0.0.1');
for(const peer of ['192.0.2.5','::ffff:192.0.2.5','2001:db8::5'])check(registryClientIp(req(peer,'198.51.100.1'),true),peer.replace('::ffff:',''));
for(const peer of ['127.0.0.1','::1','::ffff:127.0.0.1'])check(registryClientIp(req(peer,'192.0.2.1'),true),'192.0.2.1');
for(const value of [undefined,'','host.example','192.0.2.1, 192.0.2.2','192.0.2.1:80','[::1]','fe80::1%eth0',' 192.0.2.1','999.0.0.1'])check(registryClientIp(req('127.0.0.1',value),true),'127.0.0.1');
check(registryClientIp(req('127.0.0.1','2001:0DB8:0:0:0:0:0:1'),true),'2001:db8::1');
check(registryClientIp(req('127.0.0.1','::ffff:c000:201'),true),'192.0.2.1');
check(registryClientIp(req('127.0.0.1',undefined,{'x-forwarded-for':'192.0.2.1'}),true),'127.0.0.1');
const duplicate=req('127.0.0.1','192.0.2.1');duplicate.rawHeaders.push('x-real-ip','192.0.2.2');check(registryClientIp(duplicate,true),'127.0.0.1');

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-client-ip-'));
const app=await startServer({port:0,registryDir:path.join(dir,'registry'),trustLoopbackProxy:true,logger:()=>{}});
let verifiedPeer='192.0.2.10';
// Model the nginx trust boundary: its verified address overwrites client input.
const proxy=http.createServer((incoming,outgoing)=>{
 const upstream=http.request(app.origin+incoming.url,{method:incoming.method,headers:{...incoming.headers,host:new URL(app.origin).host,origin:app.origin,'x-real-ip':verifiedPeer}},response=>{outgoing.writeHead(response.statusCode,response.headers);response.pipe(outgoing);});
 upstream.on('error',()=>{outgoing.writeHead(502);outgoing.end();});incoming.pipe(upstream);
});
await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+proxy.address().port;
async function post(action,body={},spoof='203.0.113.99'){
 const response=await fetch(origin+'/api/registry/'+action,{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,'X-Real-IP':spoof,'X-Forwarded-For':spoof},body:JSON.stringify(body)});
 await response.arrayBuffer();return response.status;
}
try{
 for(let i=0;i<100;i++)check(await post('challenge'),200);
 check(await post('challenge',{},'203.0.113.100'),429);
 verifiedPeer='192.0.2.11';check(await post('challenge'),200);
 verifiedPeer='192.0.2.20';
 for(let i=0;i<20;i++)check(await post('register'),400);
 check(await post('register',{},'203.0.113.101'),429);
 verifiedPeer='192.0.2.21';check(await post('register'),400);
 verifiedPeer='192.0.2.30';
 for(let i=0;i<80;i++)check(await post('login',{username:'!',password:'invalid'}),401);
 check(await post('login',{username:'!',password:'invalid'},'203.0.113.102'),429);
 verifiedPeer='192.0.2.31';check(await post('login',{username:'!',password:'invalid'}),401);
 // Per-username protection still spans otherwise independent IP buckets.
 for(let i=0;i<20;i++){verifiedPeer='198.51.100.'+(i+1);check(await post('login',{username:'SharedTarget',password:'invalid'}),401);}
 verifiedPeer='198.51.100.100';check(await post('login',{username:'SharedTarget',password:'invalid'}),429);
 console.log('PASS '+checks+' client-IP checks: opt-in, trusted/untrusted peers, malformed/duplicate headers, canonicalization, proxy spoofing, independent challenge/register/login buckets and shared username limit.');
}finally{
 await new Promise(resolve=>proxy.close(resolve));
 await app.close();
 assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));
 assert.ok(path.basename(dir).startsWith('cs-client-ip-'));
 fs.rmSync(dir,{recursive:true,force:true});
}
