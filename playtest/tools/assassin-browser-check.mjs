import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {startServer,roster} from '../server/main.mjs';import {createRingService} from '../server/ring-pvp.mjs';
const {launch}=await import(process.env.ST_BROWSER_HARNESS||'playwright');
const app=await startServer({port:0,registryDir:fs.mkdtempSync(path.join(os.tmpdir(),'assassin-browser-')),playtestSnapshotOnly:true,logger:()=>{}}),service=createRingService(roster,{seed:42,workers:false}),browser=await launch();const evidence=process.env.ST_ASSASSIN_EVIDENCE||path.join(os.tmpdir(),'assassin-evidence');fs.mkdirSync(evidence,{recursive:true});let checks=0;
try{for(const width of [1440,390]){
 const local=service.localSession({npcNames:['Rackler','Snurk','Cruns']}),read=()=>local.client.read(),first=await read();
 const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.exposeFunction('localRead',read);await page.exposeFunction('localDispatch',q=>local.client.dispatch(q));
 await page.route('**/client-v13/bootstrap-production.js',route=>route.fulfill({contentType:'text/javascript',body:`import './strength-renderer.js';import {mountClient} from './presentation.js';window.client=await mountClient({read:()=>localRead(),dispatch:q=>localDispatch(q)},{configuration:()=>({story:false})});document.getElementById('stStartup')?.remove();document.getElementById('stLoadingScreen')?.remove();document.body.classList.remove('st-main-menu-mode');window.ready=true;`}));
 await page.goto(app.origin);assert.equal((await page.request.get(app.origin+'/assets/units/assassin/assassin.png')).status(),200);await page.waitForFunction(()=>window.ready).catch(e=>{throw Error(errors.join('|')||e.message);});
 assert.equal(await page.locator('#playerUnitStrip [data-unit="assassin"]').count(),1);assert.equal(await page.locator('#enemyUnitStrip [data-unit="assassin"]').count(),1);
 const positions=()=>page.evaluate(()=>Object.fromEntries(['playerUnitStrip','enemyUnitStrip','playerGrid','enemyGrid'].map(id=>{const el=document.getElementById(id),r=(id.endsWith('Strip')?el.firstElementChild:el).getBoundingClientRect();return [id,[r.x,r.y,r.width,r.height]];})));
 const withAssassin=await positions();const without=structuredClone(first);delete without.snapshot.rosters.self.assassin;delete without.snapshot.rosters.opponent.assassin;without.snapshot.revision+=10;await page.evaluate(u=>client.apply(u),without);const old=await positions();
 const again=structuredClone(first);again.snapshot.revision+=11;await page.evaluate(u=>client.apply(u),again);const restored=await positions();
 assert.ok(Math.abs(restored.playerUnitStrip[0]-(old.playerUnitStrip[0]-22))<1,JSON.stringify({old,restored}));assert.ok(Math.abs(restored.enemyUnitStrip[0]-old.enemyUnitStrip[0])<1,JSON.stringify({old,restored}));assert.deepEqual(restored.playerGrid,old.playerGrid);assert.deepEqual(restored.enemyGrid,old.enemyGrid);checks++;
 // Real palette clicks and board placement, including adjacency to Infantry.
 await page.reload();await page.waitForFunction(()=>window.ready);
 await page.locator('#playerUnitStrip [data-unit="inf"]').click();await page.locator('#playerGrid .cell').nth(64).click();await page.locator('#playerGrid .infantry-cell').waitFor();
 await page.locator('#playerUnitStrip [data-unit="assassin"]').click();await page.locator('#playerGrid .cell').nth(79).click();await page.locator('#playerGrid .assassin-cell').waitFor();
 await page.locator('#playerUnitStrip [data-unit="inf"]').click();await page.locator('#playerGrid .cell').nth(94).click();await page.waitForFunction(()=>document.querySelectorAll('#playerGrid .infantry-cell').length===2);
 assert.equal(await page.locator('#playerGrid .assassin-cell').count(),1);assert.equal(await page.locator('#playerGrid .assassin-cell').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(89, 99, 111)');assert.match(await page.evaluate(()=>window.__stoneThrowUnitInfoData('assassin').info.ability),/original attacker/);assert.deepEqual(errors,[]);checks++;
 // A real public hit state must display the marker, while an untouched Assassin must not.
 assert.equal(await page.locator('#playerGrid .assassin-cell').evaluate(el=>getComputedStyle(el,'::after').display),'none');
 const hit=await read();hit.snapshot.ownImpacts.push({x:4,y:5});hit.snapshot.revision+=20;await page.evaluate(u=>client.apply(u),hit);
 const mark=await page.locator('#playerGrid .assassin-hit').evaluate(el=>{const s=getComputedStyle(el,'::after');return {display:s.display,image:s.backgroundImage,width:parseFloat(s.width)};});assert.equal(mark.display,'block');assert.match(mark.image,/player-shot.png/);assert.ok(mark.width>0);checks++;
 const enemyMarker=await page.locator('#enemyGrid .cell').first().evaluate(el=>{el.classList.add('assassin-hit');const display=getComputedStyle(el,'::after').display;el.classList.remove('assassin-hit');return display;});assert.equal(enemyMarker,'none','enemy Assassin must not have the own-board shot marker');checks++;
 await page.screenshot({path:path.join(evidence,'assassin-'+width+'.png'),fullPage:true});await page.close();
 }console.log(JSON.stringify({passed:true,checks,evidence,widths:[1440,390],exactStripOffsets:true,unchangedMaps:true,adjacentPlacement:true}));
}finally{await browser.close();await service.close();await app.close();}
