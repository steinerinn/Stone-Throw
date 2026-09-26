import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {startServer,roster} from '../server/main.mjs';
const {launch}=await import(process.env.ST_BROWSER_HARNESS||'playwright');
for(const k of Object.keys(roster))roster[k]=0;roster.inf=2;
let now=100000,checks=0;const pages=[];
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-afk-ui-'));
const app=await startServer({port:0,lan:true,seed:42,now:()=>now,registryDir:path.join(dir,'registry'),playtestSnapshotOnly:true,logger:()=>{}}),browser=await launch();
const post=async(c,route,data={})=>{const res=await c.request.post(app.origin+'/api/'+route,{headers:{Origin:app.origin},data});const u=await res.json();assert.equal(res.status(),200,JSON.stringify(u));return u;};
async function entry(width){const c=await browser.newContext({viewport:{width,height:1000}}),p=await c.newPage();pages.push(p);p.on('pageerror',e=>console.error('PAGE ERROR',e.message));await p.goto(app.origin);await p.locator('#stStartupEnter').click();await p.waitForFunction(()=>document.documentElement.dataset.localHost==='connected');await p.locator('#stLoadingScreen').waitFor({state:'hidden'});await p.locator('#stMenuOnline').click();await p.locator('#csGuestSkip').click();await p.waitForFunction(()=>document.getElementById('stLanMake')&&!document.getElementById('stLanMake').disabled);return {c,p};}
try{
 for(const count of [2,3,4]){
  const a=await entry(1440),b=await entry(390),clients=[a,b];
  for(let i=2;i<count;i++){clients.push(await entry(1440));await a.p.locator('[data-seat="'+i+'"] [data-option="human"]').click();}
  await a.p.locator('#stLanMake').click();await a.p.locator('#csDeployment').waitFor();const code=(await post(a.c,'read')).lan.code;
  for(const peer of clients.slice(1)){await peer.p.locator('#stLanJoinTab').click();await peer.p.locator('#stLanCode').fill(code);await peer.p.locator('#stLanJoin').click();await peer.p.locator('#csDeployment').waitFor();}
  for(const c of clients)for(const intent of [{kind:'place',unit:'inf',cells:[{x:14,y:14}]},{kind:'place',unit:'inf',cells:[{x:12,y:14}]},{kind:'start'}]){const u=await post(c.c,'read'),q=u.snapshot;const out=await post(c.c,'command',{contract:q.contract,battle:q.battle,revision:q.revision,intent});assert.notEqual(out.accepted,false,JSON.stringify({intent,error:out.error,revision:q.revision,battle:q.battle,phase:q.phase,lan:out.lan}));}
  for(const c of clients)await c.p.waitForFunction(()=>document.getElementById('csDeployment').hidden);
  let room=app.pvp.rooms.get(code);
  // Wait for real client presentation acknowledgement, not a test-supplied ACK.
  for(let attempt=0;attempt<100&&!room.afk;attempt++)await a.p.waitForTimeout(200);
  assert.ok(room.afk,'client must acknowledge settled input');checks++;
  const owner=room.afk.seat,peer=(owner+1)%count;assert.ok(owner<count);
  now+=30000;room.seats.forEach(s=>s.seen=now);await app.pvp.tick();
  await clients[owner].p.locator('#stAfkDialog').waitFor();await clients[peer].p.locator('#stAfkDialog').waitFor();
  assert.match(await clients[owner].p.locator('#stAfkDialog h2').innerText(),/take your turn/);
  assert.deepEqual(await clients[peer].p.locator('#stAfkDialog button').allTextContents(),['KICK','WAIT']);
  assert.equal(await clients[owner].p.locator('#stAfkDialog').evaluate(e=>getComputedStyle(e).pointerEvents),'none');checks++;
  for(let j=0;j<count;j++)if(j!==owner)await clients[j].p.locator('#stAfkDialog button').filter({hasText:'WAIT'}).click();
  for(let attempt=0;attempt<25&&room.afk?.deadline!==room.afk?.warningAt+120000;attempt++)await a.p.waitForTimeout(100);
  assert.equal(room.afk.deadline,room.afk.warningAt+120000);checks++;
  await clients[owner].p.screenshot({path:path.join(dir,count+'p-warning.png'),fullPage:true});
  const u=await post(clients[owner].c,'read'),q=u.snapshot;
  const out=await post(clients[owner].c,'command',{contract:q.contract,battle:q.battle,revision:q.revision,intent:{kind:'shoot',cell:{x:0,y:0}}});assert.notEqual(out.accepted,false);
  await clients[owner].p.locator('#stAfkDialog').waitFor({state:'hidden'});await clients[peer].p.locator('#stAfkDialog').waitFor({state:'hidden'});checks++;
  for(const c of clients)await c.c.close();
 }
 console.log(JSON.stringify({passed:true,checks,dir}));
}catch(e){for(let i=0;i<pages.length;i++){try{await pages[i].screenshot({path:path.join(dir,'failure-'+i+'.png'),fullPage:true});console.error('STATE',await pages[i].evaluate(()=>({ready:document.getElementById('stCenterStart')?.outerHTML,error:document.getElementById('stLanQuickMessage')?.textContent,view:window.__stoneThrowViewState?.()})));}catch{}}console.error('Artifacts',dir);throw e;}finally{await browser.close();await app.close();}
