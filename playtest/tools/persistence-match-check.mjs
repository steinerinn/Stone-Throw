import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createRingService} from '../server/ring-pvp.mjs';import {roster} from '../server/main.mjs';import {openStore} from '../server/store.mjs';import {serializeHost} from '../canonical/compiled/host/serialization.js';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'cs-versioned-match-')),results=[];
for(const n of [3,4]){
 const options={seed:42,workers:false,now:()=>100000};let service=createRingService(roster,options),store=openStore(root+'/'+n,'old-build','production');
 try{
 const made=await service.lobby('make',{name:'Tester',seats:n,controllers:Array(n).fill('human')},'p0');let room=service.rooms.get(made.update.lan.code);const code=room.code,tokens=[made.token];
 for(let i=1;i<n;i++)tokens.push((await service.lobby('join',{name:'P'+i,code},'p'+i)).token);
 const act=async(i,intent)=>{const {snapshot:s}=await service.route(tokens[i],'p'+i,'read');const u=await service.route(tokens[i],'p'+i,'command',{contract:s.contract,battle:s.battle,revision:s.revision,intent});assert.equal(u.accepted,true,JSON.stringify({error:u.error,intent,status:room.host.status,active:room.host.activePlayerId,choice:s.choice,turn:s.turn,opponent:s.opponent.slice(0,3)}));store.write({multiplayer:service.exportState(true)});return u;};
 for(let i=0;i<n;i++){await act(i,{kind:'random-placement'});await act(i,{kind:'start'});}
 for(let j=0;j<36;j++){
  room=service.rooms.get(code);const snapshots=await Promise.all(tokens.map((token,i)=>service.route(token,'p'+i,'read')));let i=snapshots.findIndex(u=>u.snapshot.choice);if(i<0)i=room.host.config.players.findIndex(p=>p.id===room.host.activePlayerId);const s=snapshots[i].snapshot;
  const cell=Array.from({length:225},(_,k)=>({x:k%15,y:Math.floor(k/15)})).find(c=>!s.opponent.some(o=>o.cell.x===c.x&&o.cell.y===c.y&&['impact','miss'].includes(o.observation)));
  await act(i,s.choice?{kind:'answer',choice:s.choice.handle,cell:s.choice.cells[0],unit:s.choice.units?.[0]?.handle??null}:{kind:'shoot',cell});
 }
 const exact=serializeHost(service.rooms.get(code).host),seats=structuredClone(service.rooms.get(code).seats);await store.cacheReady();store.release();await service.close();
 const before=fs.statSync(root+'/'+n+'/checkpoint.journal').size,t=performance.now();store=openStore(root+'/'+n,'new-build','production');service=createRingService(roster,options);service.restoreState(store.value.multiplayer,true);const ms=performance.now()-t;
 assert.equal(serializeHost(service.rooms.get(code).host),exact);assert.deepEqual(service.rooms.get(code).seats,seats);assert.equal(fs.statSync(root+'/'+n+'/checkpoint.journal').size,before);assert.equal(store.diagnostics.cacheUsed,true);
 const snapshots=await Promise.all(tokens.map((token,i)=>service.route(token,'p'+i,'read')));let i=snapshots.findIndex(u=>u.snapshot.choice);if(i<0)i=service.rooms.get(code).host.config.players.findIndex(p=>p.id===service.rooms.get(code).host.activePlayerId);const s=snapshots[i].snapshot;
 const cell=Array.from({length:225},(_,k)=>({x:k%15,y:Math.floor(k/15)})).find(c=>!s.opponent.some(o=>o.cell.x===c.x&&o.cell.y===c.y&&['impact','miss'].includes(o.observation)));
 await act(i,s.choice?{kind:'answer',choice:s.choice.handle,cell:s.choice.cells[0],unit:s.choice.units?.[0]?.handle??null}:{kind:'shoot',cell});
 results.push({players:n,recoveryMs:Math.round(ms),journalBytes:before,...store.diagnostics,exactHostRngSeats:true,continued:true});
 }finally{store.release();await service.close();}
}
console.log(JSON.stringify({passed:true,results}));



