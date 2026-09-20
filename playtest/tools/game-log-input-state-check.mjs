import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {launch} from '../../../stage10/development-harness/browser-harness.mjs';import {startServer,roster} from '../server/main.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=fs.mkdtempSync(path.resolve(root,'../input-state-log-'));
// Test-only starting roster; real server, placement, combat and production client.
const originalRoster={...roster};Object.assign(roster,{inf:1,cav:0,castle:0,archer:0,catapult:0,necro:0});
const app=await startServer({port:0,lan:true,betaGameLog:true,playtestSnapshotOnly:true,stateDir:path.join(dir,'state'),registryDir:path.join(dir,'registry'),seed:42,logger:()=>{}}),browser=await launch(),results=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function rows(p){return p.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('StoneThrow-temporary-beta-log',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('rows').objectStore('rows').getAll();q.onsuccess=()=>{db.close();resolve(q.result);};};}));}
try{for(const viewer of [true,false]){
 const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),p=await ctx.newPage(),errors=[];p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));
 if(process.env.ST_LOG_BEFORE)await p.route('**/client-v13/game-log.js',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(process.env.ST_LOG_BEFORE,'utf8')}));
 // Small valid Single Player roster shortens normal combat; no state/engine/result stubs.
 await p.goto(app.origin);await p.waitForFunction(()=>document.documentElement.dataset.localHost==='connected');await p.locator('#stMenuFull').click();await p.locator('#csGuestSkip').click();await p.locator('#stGear').click();await p.locator('#stGameLogSetting').click();await p.locator('#stGear').click();await p.waitForTimeout(300);await p.locator('#stRandom').click();await p.waitForFunction(()=>window.__stoneThrowViewState?.().phase==='ready');await p.locator('#stCenterStart').click();
 let finished=false,shots=0;
 // Hold final response only long enough to open the viewer before the actual result is delivered.
 await p.route('**/api/command',async r=>{const response=await r.fetch(),body=(await response.text()).trim().split(/\r?\n/).map(JSON.parse).at(-1);if(body.snapshot?.phase==='finished'||body.update?.snapshot?.phase==='finished'){finished=true;if(viewer)await p.locator('#stBetaGameLog').click();}await r.fulfill({response});});
 await p.waitForFunction(()=>window.__stoneThrowViewState?.().phase==='play');
 const saved=JSON.parse(JSON.parse(fs.readFileSync(path.join(dir,'state','checkpoint.json'),'utf8')).payload),local=saved.local.at(-1),cp=JSON.parse(local.checkpoint),host=JSON.parse(cp.host);
 const targets=host.placements.filter(u=>u.ownerId==='node-ai'&&['inf','monk'].includes(u.type)).flatMap(u=>u.cells);assert.equal(targets.length,2);
 for(let i=0;i<targets.length&&!finished;i++){
  await p.waitForFunction(()=>{const v=window.__stoneThrowViewState?.();return v?.phase==='play'&&!v.inputLocked;});
  await p.locator(`#enemyGrid .cell[data-x="${targets[i].x}"][data-y="${targets[i].y}"]`).click();shots++;
  await p.waitForFunction(n=>{const v=window.__stoneThrowViewState?.();return v?.phase==='over'||v?.stats?.playerShots>=n;},shots);
 }
 assert.ok(finished,'normal combat must finish without surrender');await p.waitForFunction(()=>{const v=window.__stoneThrowViewState?.();return v?.phase==='over'&&!v.inputLocked;});
 if(viewer)assert.ok(await p.locator('#stBetaGameLogPanel').isVisible());else assert.equal(await p.locator('#stBetaGameLogPanel').count(),0);
 await sleep(700);const first=await rows(p);await sleep(6500);const after=await rows(p);
 fs.writeFileSync(path.join(dir,viewer?'open.json':'closed.json'),JSON.stringify(after,null,2));
 const over=after.filter(r=>r.event==='INPUT STATE'&&r.phase==='over'&&r.locked===false);assert.equal(over.length,1,`viewer ${viewer}: stable over must emit once`);
 assert.equal(after.filter(r=>r.event==='INPUT STATE').length,first.filter(r=>r.event==='INPUT STATE').length,'idle results append no input state');
 const states=after.filter(r=>['INPUT STATE','NEXT LEGAL INPUT ENABLED'].includes(r.event)).sort((a,b)=>a.ms-b.ms);
 assert.ok(states.some(r=>r.phase==='play'));assert.ok(states.some(r=>r.phase==='ready'));assert.ok(new Set(states.map(r=>r.locked)).size===2);assert.ok(new Set(states.map(r=>r.shots)).size>1);
 for(let i=1;i<states.length;i++)if(states[i].event==='INPUT STATE')assert.notDeepEqual([states[i].phase,states[i].locked,states[i].shots],[states[i-1].phase,states[i-1].locked,states[i-1].shots]);
 assert.equal(after.filter(r=>r.event==='COMMAND REQUEST'&&r.kind==='give-up').length,0);assert.ok(after.some(r=>r.event==='MATCH END / OBSERVER ELIMINATED'));assert.deepEqual(errors,[]);
 const count=after.length;if(viewer)await p.locator('#stBetaGameLogPanel').getByRole('button',{name:'CLOSE',exact:true}).click();await p.locator('#resultOverlay [data-beta-log]').click();await sleep(400);assert.equal((await rows(p)).length,count,'viewer is display-only');assert.equal(await p.evaluate(()=>localStorage.getItem('stoneThrow.gameLog.enabled.v1')),'1');
 results.push({viewer,shots,stableOverRows:over.length,idleMs:6500,rows:count,genuineChanges:true});await ctx.close();
}assert.ok(!fs.existsSync(path.join(dir,'state','checkpoint.journal')));console.log(JSON.stringify({passed:true,dir,results}));}finally{await browser.close();await app.close();Object.assign(roster,originalRoster);}
