import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {execFileSync} from 'node:child_process';import {fileURLToPath,pathToFileURL} from 'node:url';
// Exact accepted Registry Phase 1 baseline. Tests compare against its original
// implementation, never substitute the candidate for the historical oracle.
export const phase1Commit='922258094cd44d3c1c5cd189f7c04fbfcb1ddedc';
let root;
export function phase1Module(relative){
 if(!root){
  root=fs.mkdtempSync(path.join(os.tmpdir(),'cs-registry-phase1-fixture-'));
  const archive=execFileSync('git',['archive',phase1Commit,'playtest/server','playtest/canonical/compiled'],{cwd:fileURLToPath(new URL('../..',import.meta.url)),maxBuffer:64*1024*1024,windowsHide:true});
  for(let offset=0;offset+512<=archive.length;){
   const header=archive.subarray(offset,offset+512);if(header.every(b=>b===0))break;
   const field=(start,end)=>header.subarray(start,end).toString().split('\0')[0];
   const name=[field(345,500),field(0,100)].filter(Boolean).join('/'),size=parseInt(field(124,136).trim()||'0',8),kind=field(156,157);
   if(!Number.isSafeInteger(size)||size<0||offset+512+size>archive.length)throw Error('Invalid historical fixture archive');
   if(kind==='0'||kind===''){
    const target=path.resolve(root,name);if(!target.startsWith(root+path.sep)||!name.startsWith('playtest/'))throw Error('Unsafe historical fixture path');
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,archive.subarray(offset+512,offset+512+size));
   }
   offset+=512+Math.ceil(size/512)*512;
  }
 }
 const target=path.resolve(root,'playtest',relative);if(!target.startsWith(path.join(root,'playtest')+path.sep))throw Error('Invalid historical module');
 return pathToFileURL(target).href;
}
