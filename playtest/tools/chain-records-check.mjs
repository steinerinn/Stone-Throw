import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {hofFixture} from './global-hof-fixture.mjs';
import {globalHallOfFame} from '../server/global-hall-of-fame.mjs';
import {globalMenuStats} from '../server/global-menu-stats.mjs';
import {ensureProfileAggregates} from '../server/profile-aggregates.mjs';
const f=await hofFixture(fs.mkdtempSync(path.join(os.tmpdir(),'cs-chain-ranks-')),Date.UTC(2026,8,27));
try{
 const set=(i,value)=>f.db.prepare("UPDATE stat_participants SET summary=json_set(summary,'$.biggestChain',?) WHERE player_id=?").run(value,f.ids[i]);
 set(0,138);set(1,99);set(2,75);
 for(const mode of ['All','Duel','3 Players','4 Players'])for(const period of ['month','year','all']){
 const rows=globalHallOfFame(f.db,mode,f.ids[0],{now:f.now}).topChains[period];
 assert.deepEqual(rows.map(r=>r.value),[138,99,75]);assert.equal(rows[0].country,'IS');assert(rows[0].own);
 }
 f.add({i:3,count:2,at:f.year-1});
 const latest=f.db.prepare('SELECT id FROM stat_matches ORDER BY rowid DESC LIMIT 1').get().id;
 f.db.prepare("UPDATE stat_participants SET summary=json_set(summary,'$.biggestChain',200) WHERE match_id=?").run(latest);
 let d=globalHallOfFame(f.db,'Duel',null,{now:f.now});assert.equal(d.topChains.all[0].value,200);assert.equal(d.topChains.year[0].value,138);
 f.db.prepare("INSERT INTO review_pending VALUES(?,?,'PENDING REVIEW')").run(f.ids[3],latest);
 d=globalHallOfFame(f.db,'Duel',null,{now:f.now});assert.equal(d.topChains.all[0].value,138);
 f.db.prepare("UPDATE review_pending SET status='RELEASED' WHERE match_id=?").run(latest);
 assert.equal(globalHallOfFame(f.db,'Duel',null,{now:f.now}).topChains.all[0].value,200);
 ensureProfileAggregates(f.db);
 const g=JSON.parse(f.db.prepare('SELECT value FROM profile_global WHERE id=1').get().value);
 Object.assign(g,{complete:true,chain:138,chainHolder:{playerId:f.ids[0],displayName:'Old name',country:'GB'}});
 f.db.prepare('UPDATE profile_global SET value=? WHERE id=1').run(JSON.stringify(g));
 const menu=globalMenuStats(f.db);assert.equal(menu.biggestChain,138);assert.equal(menu.chainHolder.displayName,'Einar');assert.equal(menu.chainHolder.country,'IS');
 console.log('PASS: chain rankings across all filters/periods, year boundary, pending/released review scores, current record-holder name and flag.');
}finally{f.db.close();f.registry.close();}
