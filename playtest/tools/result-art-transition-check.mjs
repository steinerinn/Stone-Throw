import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {startServer} from '../server/main.mjs';
const {launch}=await import(process.env.ST_BROWSER_HARNESS||'playwright');
const app=await startServer({port:0,registryDir:fs.mkdtempSync(path.join(os.tmpdir(),'cs-result-art-')),playtestSnapshotOnly:true,logger:()=>{}}),browser=await launch();let checks=0;
try{
 const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/result-fixture',r=>r.fulfill({contentType:'text/html',body:`<img id="art"><script type="module">import {setResultArt} from '/client-v13/result-screen.js';window.show=o=>setResultArt(document.getElementById('art'),o);window.ready=true;</script>`}));
 await p.goto(app.origin+'/result-fixture');await p.waitForFunction(()=>window.ready);
 await p.evaluate(()=>show('loss'));await p.waitForFunction(()=>document.getElementById('art').style.visibility==='visible');checks++;
 for(const outcome of ['win','loss','draw']){
  const filename=outcome==='loss'?'lose':outcome;let release;const gate=new Promise(r=>release=r);
  await p.route('**/assets/results/'+filename+'.svg',async r=>{await gate;await r.continue();});
  await p.evaluate(o=>show(o),outcome);
  assert.equal(await p.locator('#art').evaluate(e=>e.style.visibility),'hidden');checks++;
  await p.waitForTimeout(100);assert.equal(await p.locator('#art').evaluate(e=>e.style.visibility),'hidden');checks++;
  release();await p.waitForFunction(()=>document.getElementById('art').style.visibility==='visible');
  assert.ok((await p.locator('#art').getAttribute('src')).endsWith(filename+'.svg'));checks++;
  await p.unroute('**/assets/results/'+filename+'.svg');
 }
 // A superseded decode cannot reveal the stale banner.
 await p.evaluate(()=>{show('loss');show('win');show('draw');});
 await p.waitForFunction(()=>document.getElementById('art').style.visibility==='visible');
 assert.ok((await p.locator('#art').getAttribute('src')).endsWith('draw.svg'));assert.deepEqual(errors,[]);checks++;
 console.log(JSON.stringify({passed:true,checks}));
}finally{await browser.close();await app.close();}
