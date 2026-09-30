import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {hofFixture} from './global-hof-fixture.mjs';import {startServer} from '../server/main.mjs';
const {launch}=await import(process.env.ST_BROWSER_HARNESS||'playwright');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-chain-ui-')),f=await hofFixture(dir);f.db.close();f.registry.close();
const app=await startServer({port:0,registryDir:dir,playtestSnapshotOnly:true,logger:()=>{}}),browser=await launch(),errors=[];
try{for(const [width,height]of [[1920,1080],[390,844]]){
 const context=await browser.newContext({viewport:{width,height}});await context.addCookies([{name:'csAccount',value:f.user.token,url:app.origin},{name:'csRegistryBrowser',value:'b'.repeat(48),url:app.origin}]);const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/api/registry/global-stats',r=>r.fulfill({json:{battles:130,unitsDestroyed:4355,biggestChain:138,chainHolder:{playerId:f.ids[0],displayName:'Einar',country:'IS'},factions:{humanScore:50,aiScore:47},coverage:'Test'}}));
 await p.goto(app.origin);await p.locator('#stStartupEnter').click();await p.waitForFunction(()=>document.documentElement.dataset.localHost==='connected');await p.evaluate(()=>window.__stoneThrowOpenMainMenu());
 const holder=p.locator('.cs-menu-chain-holder');await holder.waitFor();assert.equal(await holder.textContent(),'Einar');assert((await holder.locator('img').getAttribute('src')).endsWith('/is.svg'));
 await p.locator('#csProfile').click();const d=p.locator('#csProfileWindow');await d.locator('.cp-tabs').waitFor();if(width===390)await d.getByRole('button',{name:'NEXT',exact:true}).click();
 assert.equal(await d.locator('dt',{hasText:'Best Chain'}).count(),1);assert.equal(await d.locator('dt',{hasText:'Draws'}).count(),0);assert.equal(await d.evaluate(e=>e.scrollWidth>e.clientWidth),false);await p.screenshot({path:path.join(dir,'profile-'+width+'.png')});await context.close();
}assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,desktopAndPhone:true,evidence:dir}));}finally{await browser.close();await app.close();}
