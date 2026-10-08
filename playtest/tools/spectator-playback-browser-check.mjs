import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {startServer} from '../server/main.mjs';
const {launch}=await import(process.env.ST_BROWSER_HARNESS||'playwright');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-live-playback-'));
const app=await startServer({port:0,registryDir:path.join(dir,'registry'),playtestSnapshotOnly:true,logger:()=>{}}),browser=await launch();let checks=0;
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(app.origin);
 await page.evaluate(async()=>{
  const {spectate}=await import('/client-v13/spectator.js');window.calls=[];window.effectCount=0;
  window.effectProbe=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1&&n.querySelector?.('.archer-arrow-flight,.demon-rune'))effectCount++;});effectProbe.observe(document.body,{childList:true,subtree:true});
  window.feed={code:'PUBLIC',epoch:'1',cursor:0,revision:0,round:1,phase:'battle',current:0,boards:Array.from({length:4},(_,seat)=>({seat,name:'Player '+(seat+1),size:5,cells:[]})),events:[]};
  window.observer=await spectate({request:async(route,body)=>{calls.push(body);if(window.failOnce){window.failOnce=false;throw Error('offline');}return structuredClone({...feed,reset:body.epoch!==feed.epoch,events:body.after===feed.cursor?[]:feed.events});}},'PUBLIC');
 });
 assert.equal(await page.locator('.cs-spectator-grid').count(),4);assert.equal(await page.locator('.cs-spectator-grid .hit').count(),0);checks+=2;
 await page.evaluate(()=>{feed.cursor=2;feed.events=[1,2].map(y=>({kind:'contact',actor:0,board:1,observation:'miss',cells:[{x:2,y}],animation:{kind:'archer',group:'first',origin:{x:2,y:0}}}));feed.boards[1].cells=[1,2].map(y=>({x:2,y,hit:false,kind:null}));});
 await page.waitForFunction(()=>document.querySelectorAll('.cs-spectator-grid .miss').length===2);await page.waitForTimeout(1400);const effects=await page.evaluate(()=>effectCount);assert.ok(effects>0);assert.equal(await page.locator('.cs-spectator-grid .miss').count(),2);await page.waitForTimeout(1300);assert.equal(await page.evaluate(()=>effectCount),effects);checks+=3;
 // A split attack must continue contacts without replaying its full animation.
 await page.evaluate(()=>{feed.cursor=3;feed.events=[{kind:'contact',actor:0,board:1,observation:'miss',cells:[{x:2,y:3}],animation:{kind:'archer',group:'first',origin:{x:2,y:0}}}];feed.boards[1].cells.push({x:2,y:3,hit:false,kind:null});});
 await page.waitForFunction(()=>document.querySelectorAll('.cs-spectator-grid .miss').length===3);await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>effectCount),effects);checks++;
 await page.getByRole('button',{name:'Pause live playback',exact:true}).click();const pausedCalls=await page.evaluate(()=>calls.length);
 await page.evaluate(()=>{feed.cursor=4;feed.events=[{kind:'shot',actor:1,board:0,observation:'miss',cells:[{x:1,y:1}],animation:{kind:'enemy-shot',group:'next'}}];feed.boards[0].cells=[{x:1,y:1,hit:false,kind:null}];});
 await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>calls.length),pausedCalls);assert.equal(await page.locator('.cs-spectator-grid .miss').count(),3);checks+=2;
 await page.getByRole('button',{name:'Resume live playback',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.cs-spectator-grid .miss').length===4);checks++;
 await page.evaluate(()=>{failOnce=true;});await page.waitForFunction(()=>document.querySelector('.cs-spectator>p').textContent.includes('interrupted'));
 await page.waitForTimeout(1500);assert.equal(await page.locator('.cs-spectator-grid .miss').count(),4);assert.equal(await page.evaluate(()=>effectCount),effects);checks+=2;
 await page.evaluate(()=>{feed.epoch='2';feed.cursor=0;feed.events=[];feed.boards.forEach(b=>b.cells=[]);});await page.waitForFunction(()=>document.querySelectorAll('.cs-spectator-grid .miss').length===0);assert.ok(await page.locator('.cs-spectator>p').textContent().then(t=>t.includes('Caught up')));checks+=2;
 await page.screenshot({path:path.join(dir,'live-four-boards.png')});await page.getByRole('button',{name:'LEAVE SPECTATING',exact:true}).click();const ended=await page.evaluate(()=>calls.length);await page.waitForTimeout(1300);assert.equal(await page.evaluate(()=>calls.length),ended);assert.equal(await page.locator('[data-battlefield-effect-plane],.cs-spectator').count(),0);assert.deepEqual(errors,[]);checks+=3;
 console.log(JSON.stringify({passed:true,checks,liveAnimation:true,splitChainDedup:true,reconnectPauseResetCleanup:true,dir}));
}finally{await browser.close();await app.close();}
