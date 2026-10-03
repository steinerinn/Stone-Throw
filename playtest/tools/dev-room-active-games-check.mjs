import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {devRoomGames,localPlayActivity,LOCAL_PLAY_WINDOW_MS} from '../server/dev-room.mjs';
import {createPvpService} from '../server/multiplayer.mjs';
import {acknowledgeInput,requiredInput,reconcileAfk,cancelAfk} from '../server/afk-policy.mjs';
import {startServer} from '../server/main.mjs';
import {profileFixture} from './profile-fixture.mjs';
let checks=0,now=100000;
const equal=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
const roster=Object.fromEntries('inf cav archer monk castle dwarf goblin catapult elf cleric demon dragon wizard necro hero assassin'.split(' ').map(k=>[k,k==='inf'?2:0]));
for(const count of [2,3,4]){
 const service=createPvpService(roster,{seed:42,workers:false,now:()=>now});
 try{
  const clients=[await service.lobby('make',{name:'Human0',seats:count,controllers:Array(count).fill('human')},'browser0')],code=clients[0].update.lan.code;
  const list=()=>devRoomGames(service.rooms,new Map(),true,now);
  equal((await list()).length,0,'Waiting room excluded');
  for(let i=1;i<count;i++)clients.push(await service.lobby('join',{code,name:'Human'+i},'browser'+i));
  equal((await list()).length,0,'Full placement lobby excluded');
  for(let i=0;i<count;i++)for(const intent of [{kind:'place',unit:'inf',cells:[{x:14,y:14}]},{kind:'place',unit:'inf',cells:[{x:12,y:14}]},{kind:'start'}]){const {snapshot:s}=await service.route(clients[i].token,'browser'+i,'read');await service.route(clients[i].token,'browser'+i,'command',{contract:s.contract,battle:s.battle,revision:s.revision,intent});}
  const r=service.rooms.get(code),before=JSON.stringify(service.exportState());
  equal((await list()).map(g=>g.code),[code],'Started connected battle is live');
  equal(JSON.stringify(service.exportState()),before,'Dashboard cannot change saved state');
  const status=r.host.status;for(const phase of ['running','awaiting-turn']){r.host.status=phase;equal((await list()).length,1,'AI/chain progress remains active');}r.host.status=status;
  now+=7000;equal((await list()).length,0,'Heartbeat silence excluded before grace expires');
  equal(service.rooms.has(code),true,'Reconnect room retained');
  for(const seat of r.seats)seat.seen=now;
  equal((await list()).length,1,'Heartbeat recovery returns battle');
  for(const seat of r.seats)seat.absence={startedAt:now,policy:'wait'};
  equal((await list()).length,0,'Fresh seen cannot override disconnect grace');
  for(const seat of r.seats)delete seat.absence;
  const input=requiredInput(r);assert.ok(input);acknowledgeInput(r,input.seat,input.key,now);
  now+=30000;for(const seat of r.seats)seat.seen=now;reconcileAfk(r,now,()=>assert.fail('No takeover expected'));
  equal((await list()).length,0,'Current AFK warning excludes paused battle');
  cancelAfk(r);equal((await list()).length,1,'AFK resolution restores display');
  r.afk={key:'old-input',warningAt:now};equal((await list()).length,1,'Stale AFK metadata is not a live warning');cancelAfk(r);
  for(const seat of r.seats)seat.controller='ai';equal((await list()).length,0,'AI-only retained battle excluded');
  r.seats[0].controller='human';r.seats[0].left=true;equal((await list()).length,0,'Released human excluded');r.seats[0].left=false;
  if(r.host.state.ring){const order=r.host.state.ring.order;r.host.state.ring.order=order.filter(id=>id!==r.host.config.players[0].id);equal((await list()).length,0,'Eliminated observer does not make game active');r.host.state.ring.order=order;}
  r.closed=true;equal((await list()).length,0,'Closed battle excluded');
 }finally{await service.close();}
}
const activity=localPlayActivity(()=>now),slot={configuration:{singlePlayer:{npcNames:['AI']}},session:{client:{read:async()=>({snapshot:{phase:'battle',round:1,secret:'never expose'}})}}},entry={mode:'single',slots:{single:slot}},locals=new Map([['private',entry]]),list=()=>devRoomGames(new Map(),locals,true,now,activity.active);
equal((await list()).length,0,'Restored local session is not presence');activity.observe(slot);equal((await list()).length,1,'Recent local play included');equal(JSON.stringify(await list()).includes('secret'),false);
now+=LOCAL_PLAY_WINDOW_MS;equal((await list()).length,0,'Idle local session expires from dashboard only');equal(locals.size,1);activity.observe(slot);entry.mode='main-menu';equal((await list()).length,0);entry.mode='story';entry.slots.story=slot;equal((await list())[0].mode,'Story');activity.forget(slot);equal((await list()).length,0,'Menu hint clears activity');
// HTTP coverage uses an isolated Registry, real local battle commands and both Dev Room endpoints.
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-active-games-')),fixture=await profileFixture(dir),developer=fixture.users[0];
const db=new DatabaseSync(fixture.registry.file);db.prepare("UPDATE accounts SET moderation_role='developer' WHERE id=?").run(developer.account.playerId);db.close();fixture.registry.close();
const app=await startServer({port:0,lan:true,bind:'127.0.0.1',registryDir:dir,now:()=>now,seed:42,logger:()=>{}}),jar=new Map();
const post=async(route,body={},dev=false)=>{const r=await fetch(app.origin+'/api/'+route,{method:'POST',headers:{Origin:app.origin,'Content-Type':'application/json',Cookie:dev?'csAccount='+developer.token:[...jar].map(([k,v])=>k+'='+v).join('; ')},body:JSON.stringify(body)});for(const c of r.headers.getSetCookie()){const [k,v]=c.split(';')[0].split('=');jar.set(k,v);}const v=await r.json();assert.equal(r.status,200,JSON.stringify(v));return v;};
const count=async expected=>{const games=await post('dev-room/games',{},true),overview=await post('dev-room/overview',{},true);equal(games.games.length,expected);equal(overview.activeGames,expected);};
try{
 await post('open');await post('single/setup',{npcNames:['Cruns','Snurk','Rackler']});await count(0);
 const command=async intent=>{const s=(await post('read')).snapshot;return post('command',{contract:s.contract,battle:s.battle,revision:s.revision,intent});};
 await command({kind:'random-placement'});await count(0);equal((await command({kind:'start'})).accepted,true);await count(1);
 const checkpoint=await app.checkpoint(jar.get('st11sid'));
 now+=LOCAL_PLAY_WINDOW_MS;await post('read');await post('registry/usage-visit',{playing:true});await count(0);
 equal(await app.checkpoint(jar.get('st11sid')),checkpoint,'Observational reads and idle timeout preserve exact local state');
 await post('mode',{mode:'single'});await count(1);await post('registry/usage-visit',{playing:false});await count(0);
 equal(await app.checkpoint(jar.get('st11sid')),checkpoint,'Menu activity hint preserves resumable state');
 await post('mode',{mode:'single'});await count(1);now+=LOCAL_PLAY_WINDOW_MS;await command({kind:'shoot',cell:{x:-1,y:-1}});await count(0);
 equal(await app.checkpoint(jar.get('st11sid')),checkpoint,'Rejected commands cannot revive a retained game');
 // Repeat the authoritative local activity test on a real Story battle.
 const old=(await post('read')).snapshot;const army={size:5,...roster};
 await post('configure',{battle:old.battle,revision:old.revision,configuration:{size:5,story:true,battle:0,player:army,enemy:army}});
 await command({kind:'random-placement'});await command({kind:'start'});await count(1);equal((await post('dev-room/games',{},true)).games[0].mode,'Story');
 now+=LOCAL_PLAY_WINDOW_MS;await count(0);await post('mode',{mode:'story'});await count(1);await post('registry/usage-visit',{playing:false});await count(0);
 console.log(JSON.stringify({passed:true,checks,duel3p4p:true,graceAndAfk:true,localAndStory:true,httpCountsAgree:true,statePreserved:true}));
}finally{await app.close();}
