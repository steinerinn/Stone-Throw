import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {startServer} from '../server/main.mjs';
import {createLocalSession} from '../canonical/compiled/local-host/session.js';
const {launch}=await import(process.env.ST_BROWSER_HARNESS);
const app=await startServer({port:0,registryDir:fs.mkdtempSync(path.join(os.tmpdir(),'impact-hold-')),playtestSnapshotOnly:true,logger:()=>{}}),browser=await launch();let checks=0;
try{for(const width of [390,1440])for(const mode of ['single','story','online']){
 const session=createLocalSession({matchId:'hold',rulesVersion:'stone-throw-pacing-v1',size:15,story:mode==='story',seed:42,players:[{id:'a',boardId:'a',roster:{inf:1},decisionMode:'interactive'},{id:'b',boardId:'b',roster:{inf:1},decisionMode:'policy'}]}),sample=await session.client.read();
 const page=await browser.newPage({viewport:{width,height:844}});
 await page.addInitScript(v=>window.sample=v,sample);
 await page.route('**/client-v13/bootstrap-production.js',r=>r.fulfill({contentType:'text/javascript',body:`import {mountClient} from './presentation.js';document.getElementById('stStartup')?.remove();document.getElementById('stLoadingScreen')?.remove();document.body.classList.remove('st-main-menu-mode');window.client=await mountClient({read:async()=>sample,dispatch:async()=>sample});window.ready=true;`}));
 await page.goto(app.origin);await page.waitForFunction(()=>window.ready);
 const times=await page.evaluate(async mode=>{
  const {mountCombatPlayback}=await import('/client-v13/combat-playback.js');const p=mountCombatPlayback(),out=[];
  for(const actor of ['human','ai']){
   let painted;const frame={snapshot:{...sample.snapshot,...(mode==='online'?{groupRoom:'online'}:{})},events:[{kind:'impact',source:'direct',side:actor==='human'?'opponent':'self',cell:{x:0,y:0},unitKind:'dragon'}],...(actor==='ai'?{animation:{kind:'enemy-shot',side:'self',ownerSide:'opponent',origin:{x:0,y:0},cell:{x:0,y:0},group:1}}:{})};
   await p.play([frame],async()=>{painted=performance.now();},async()=>{});
   out.push({actor,held:performance.now()-painted});
  }
  // Unmount cancels the hold rather than delaying a menu/new game.
  const frame={snapshot:sample.snapshot,events:[{kind:'miss',side:'opponent',cell:{x:0,y:0}}]};
  let signal;const painted=new Promise(r=>signal=r);const pending=p.play([frame],async()=>signal(),async()=>{});await painted;p.unmount();await pending;
  return out;
 },mode);
 for(const t of times){if(width===390)assert.ok(t.held>=190,JSON.stringify({mode,width,...t}));else if(t.actor==='human')assert.ok(t.held<190,JSON.stringify(t));checks++;}
 await page.close();
}console.log(JSON.stringify({passed:true,checks}));}finally{await browser.close();await app.close();}
