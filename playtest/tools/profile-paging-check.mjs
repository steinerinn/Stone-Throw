import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {profileFixture} from './profile-fixture.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-profile-pages-')),f=await profileFixture(dir),owner=f.users[0],other=f.users[1];
const original=DatabaseSync.prototype.prepare,materialized=[];
DatabaseSync.prototype.prepare=function(sql){const statement=original.call(this,sql);if(!sql.startsWith('SELECT p.*,m.descriptor,m.ended_at'))return statement;return {all(...args){const rows=statement.all(...args);materialized.push(rows.length);return rows;}};};
const read=(body,token=owner.token)=>f.registry.handle('profile-view',body,{token});
try{
 const pages=[];for(let page=0;page<3;page++){const view=await read({section:'battles',page});assert.equal(view.total,13);assert.equal(view.pages,3);assert.equal(view.battles.length,page===2?3:5);pages.push(...view.battles);}
 assert.equal(new Set(pages.map(r=>r.matchId)).size,13);assert.ok(pages.every((r,i)=>!i||r.date<=pages[i-1].date));assert.deepEqual(materialized,[5,5,3]);
 const publicPage=await read({playerId:owner.account.playerId,section:'battles'},other.token);assert.equal(publicPage.total,5);assert.equal(publicPage.pages,1);assert.equal(publicPage.battles.length,5);assert.ok(publicPage.battles.every(r=>!('matchId'in r)));
 await assert.rejects(read({playerId:owner.account.playerId,section:'battles',page:1},other.token),e=>e.status===404);
 for(const section of ['result','replay']){materialized.length=0;await read({section,matchId:pages[0].matchId});assert.deepEqual(materialized,[1]);await assert.rejects(read({playerId:owner.account.playerId,section,matchId:pages[0].matchId},other.token),e=>e.status===403);}
 await assert.rejects(read({section:'battles',page:3}),e=>e.status===404);
 console.log(JSON.stringify({passed:true,checks:18,ownerPages:[5,5,3],publicRows:5,resultRows:1,replayRows:1,privacyPreserved:true}));
}finally{DatabaseSync.prototype.prepare=original;f.registry.close();}
