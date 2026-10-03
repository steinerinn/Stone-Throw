import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';
import {startServer,roster} from '../server/main.mjs';
const {launch}=await import(process.env.ST_BROWSER_HARNESS||'playwright');
for(const key of Object.keys(roster))roster[key]=0;roster.inf=2;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-surrender-ui-'));
const app=await startServer({port:0,lan:true,bind:'127.0.0.1',seed:42,now:()=>100000,registryDir:dir,logger:()=>{}}),browser=await launch();let checks=0;
const post=async(c,route,data={})=>{const res=await c.request.post(app.origin+'/api/'+route,{headers:{Origin:app.origin},data});const out=await res.json();assert.equal(res.status(),200,JSON.stringify(out));return out;};
async function entry(){const c=await browser.newContext({viewport:{width:1440,height:1000}}),p=await c.newPage();await p.goto(app.origin);await p.locator('#stStartupEnter').click();await p.waitForFunction(()=>document.documentElement.dataset.localHost==='connected');await p.locator('#stLoadingScreen').waitFor({state:'hidden'});await p.locator('#stMenuOnline').click();await p.locator('#csGuestSkip').click();await p.waitForFunction(()=>document.getElementById('stLanMake')&&!document.getElementById('stLanMake').disabled);return {c,p};}
try{for(const count of [2,3,4]){
 const a=await entry(),clients=[a];for(let i=1;i<count;i++){clients.push(await entry());if(i>=2)await a.p.locator('[data-seat="'+i+'"] [data-option="human"]').click();}
 await a.p.locator('#stLanMake').click();await a.p.locator('#csDeployment').waitFor();const code=(await post(a.c,'read')).lan.code;
 for(const peer of clients.slice(1)){await peer.p.locator('#stLanJoinTab').click();await peer.p.locator('#stLanCode').fill(code);await peer.p.locator('#stLanJoin').click();await peer.p.locator('#csDeployment').waitFor();}
 for(const c of clients)for(const intent of [{kind:'place',unit:'inf',cells:[{x:14,y:14}]},{kind:'place',unit:'inf',cells:[{x:12,y:14}]},{kind:'start'}]){const {snapshot:s}=await post(c.c,'read');const out=await post(c.c,'command',{contract:s.contract,battle:s.battle,revision:s.revision,intent});assert.notEqual(out.accepted,false);}
 for(const c of clients)await c.p.waitForFunction(()=>document.getElementById('csDeployment').hidden);
 let room=app.pvp.rooms.get(code);const actor=room.host.config.players.findIndex(p=>p.id===room.host.activePlayerId),quitter=(actor+1)%count,q=clients[quitter],oldCookie=(await q.c.cookies()).filter(c=>['st11sid','st12seat'].includes(c.name)).map(c=>c.name+'='+c.value).join('; '),binding=room.seats[quitter].binding;
 const routes=[];q.p.on('request',r=>{if(r.method()==='POST')routes.push(new URL(r.url()).pathname);});q.p.on('dialog',d=>d.accept());
 await q.p.locator('#stGiveUp').click();if(count===2)await q.p.locator('#stGiveUpConfirm').click();
 await q.p.waitForFunction(()=>document.body.classList.contains('st-main-menu-mode')&&!document.getElementById('stMainMenu')?.hidden);
 await q.p.waitForTimeout(500);room=app.pvp.rooms.get(code);
 assert.equal(room.seats[quitter].controller,'ai');assert.notEqual(room.host.status,'complete');assert.ok(routes.includes('/api/pvp/give-up'));assert.ok(!routes.includes('/api/leave-match')&&!routes.includes('/api/pvp/leave'));assert.equal(await q.p.locator('#stRejoinDialog').count(),0);assert.equal(await q.p.locator('#resultOverlay').isVisible(),false);checks+=6;
 const e=app.sessions.get(binding);assert.equal(e.mode,'main-menu');assert.equal(e.seatToken,null);assert.equal(e.recoveryNotice,null);assert.ok(!(await post(q.c,'open')).returning);checks+=4;
 const r=await fetch(app.origin+'/api/pvp/rejoin',{method:'POST',headers:{Origin:app.origin,'Content-Type':'application/json',Cookie:oldCookie},body:'{}'});assert.equal(r.status,400);assert.equal((await r.json()).error,'seat-handed-to-ai');checks+=2;
 const remaining=await post(clients[actor].c,'read');assert.notEqual(remaining.snapshot.phase,'finished');assert.ok(!remaining.snapshot.matchScore);assert.ok(!room.matchStatistics.endedAt);checks+=3;
 const db=new DatabaseSync(path.join(dir,'registry.sqlite'));assert.equal(db.prepare('SELECT finalized FROM stat_matches WHERE id=?').get(room.matchStatistics.id).finalized,0);assert.equal(db.prepare('SELECT count(*) n FROM stat_participants WHERE match_id=? AND match_score IS NOT NULL').get(room.matchStatistics.id).n,0);db.close();checks+=2;
 for(const c of clients)await c.c.close();
}console.log(JSON.stringify({passed:true,checks,realClicks:[2,3,4],noSecondLeaveFlow:true,noFinalScore:true}));}finally{await browser.close();await app.close();}
