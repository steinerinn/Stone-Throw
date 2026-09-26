import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {startServer} from '../server/main.mjs';
const {launch}=await import(process.env.ST_BROWSER_HARNESS||'playwright');
const app=await startServer({port:0,registryDir:fs.mkdtempSync(path.join(os.tmpdir(),'cs-rematch-ui-')),playtestSnapshotOnly:true,logger:()=>{}}),browser=await launch();let checks=0;
try{for(const width of [1440,390]){
 const p=await browser.newPage({viewport:{width,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/rematch-fixture',r=>r.fulfill({contentType:'text/html',body:`<link rel="stylesheet" href="/styles-multiplayer.css"><section class="cs-results">BATTLE RESULTS<button>REMATCH</button></section><script type="module">import {coverRematch,newsflash} from '/client-v13/rejoin.js';window.coverRematch=coverRematch;window.newsflash=newsflash;window.ready=true;</script>`}));
 await p.goto(app.origin+'/rematch-fixture');await p.waitForFunction(()=>window.ready);
 await p.evaluate(()=>newsflash({kind:'rematch',name:'VondurDEV',seat:1}));await p.waitForTimeout(650);
 const box=await p.locator('.st-rematch-notice').evaluate(e=>({border:getComputedStyle(e).borderTopWidth,background:getComputedStyle(e).backgroundImage,width:e.getBoundingClientRect().width}));assert.equal(box.border,'2px');assert.notEqual(box.background,'none');assert.ok(box.width<=width);checks++;
 await p.locator('.st-rematch-notice').waitFor({state:'detached'});checks++;
 await p.evaluate(()=>{window.uncover=coverRematch();document.querySelector('body > .cs-results').remove();document.body.insertAdjacentHTML('beforeend','<div id="menu">MAIN MENU</div>');});
 assert.equal(await p.locator('#stRematchTransition').count(),1);assert.ok(await p.locator('#stRematchTransition').innerText().then(t=>t.includes('BATTLE RESULTS')));assert.equal(await p.evaluate(()=>document.elementFromPoint(5,5).closest('#stRematchTransition')!==null),true);checks++;
 await p.evaluate(async()=>{document.getElementById('menu').remove();document.body.insertAdjacentHTML('beforeend','<section id="csDeployment">DEPLOYMENT READY</section>');await uncover();});assert.equal(await p.locator('#stRematchTransition').count(),0);assert.equal(await p.locator('#csDeployment').isVisible(),true);assert.deepEqual(errors,[]);checks++;
 await p.close();
}console.log(JSON.stringify({passed:true,checks}));}finally{await browser.close();await app.close();}
