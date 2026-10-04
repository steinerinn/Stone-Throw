import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {journalJson,journalBuffers,appendBuffers} from '../server/journal-json.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');let checks=0;const prepare=journalJson({budget:100000,threshold:32});
const samples=[null,0,-0,NaN,Infinity,true,false,'í😀\n\\"'.repeat(30000),{empty:undefined,nested:['x'.repeat(50),undefined,null,{a:'\\u1234"\r\n\t'.repeat(200)}]},[,,undefined,'z'.repeat(100)],{['long key'.repeat(40)]:'value',other:'x'.repeat(100)}];
let seed=17;const next=()=>seed=(Math.imul(seed,1664525)+1013904223)>>>0;
for(let i=0;i<100;i++){const o={};for(let j=0;j<10;j++)o['key'+j]=next()%2?'í\\"\n'.repeat(next()%200):[next(),undefined,{x:String(next()).repeat(next()%50)}];samples.push(o);}
for(const v of samples){const native=JSON.stringify(v),r=prepare()(v),raw=Buffer.concat(r.parts.map(p=>p.raw)).toString();assert.equal(raw,native);assert.equal(r.sha256,hash(native));const buffers=journalBuffers(7,'previous',r),envelope=JSON.parse(Buffer.concat(buffers));assert.equal(envelope.payload,native);assert.equal(envelope.sha256,hash(native));assert.deepEqual(JSON.parse(envelope.payload),JSON.parse(native));checks+=5;}
const buffers=[Buffer.from('abc'),Buffer.from(''),Buffer.from('defgh'),Buffer.from('ijk')],out=[];let calls=0;
assert.equal(appendBuffers({writevSync(fd,b){const bytes=Buffer.concat(b).subarray(0,++calls%4+1);out.push(bytes);return bytes.length;}},0,buffers),11);assert.equal(Buffer.concat(out).toString(),'abcdefghijk');checks+=2;
assert.throws(()=>appendBuffers({writevSync(){return 0;}},0,buffers),/short-write/);checks++;
let tries=0;assert.throws(()=>appendBuffers({writevSync(){tries++;throw Error('disk failure');}},0,buffers),/disk failure/);assert.equal(tries,1);checks+=2;
// Reusing the same large strings under a small memory budget remains exact.
for(let i=0;i<20;i++){const v={a:'old'.repeat(1000),b:String(i).repeat(2000)};assert.equal(Buffer.concat(prepare()(v).parts.map(p=>p.raw)).toString(),JSON.stringify(v));checks++;}
// One-write live fragment reuse must preserve exact envelope bytes/checksums.
for(const value of samples){const json=prepare(),live=json(value),envelope={before:1,packet:{value,updates:[{n:2}]},after:'end'},encoded=json(envelope,{value,parts:live.parts}),native=JSON.stringify(envelope);assert.equal(Buffer.concat(encoded.parts.map(p=>p.raw)).toString(),native);assert.equal(encoded.sha256,hash(native));assert.equal(JSON.parse(Buffer.concat(journalBuffers(1,'',encoded))).payload,native);checks+=3;}
// An in-place edit on the next write must be re-encoded, never use an old cache.
const mutable={rows:[{n:1}]};const first=prepare()(mutable);mutable.rows[0].n=2;const second=prepare()(mutable);assert.notEqual(first.sha256,second.sha256);assert.equal(Buffer.concat(second.parts.map(p=>p.raw)).toString(),JSON.stringify(mutable));checks+=2;
console.log(JSON.stringify({passed:true,checks,byteExactV1:true,partialWrites:true,failedAppendsNotRetried:true}));

