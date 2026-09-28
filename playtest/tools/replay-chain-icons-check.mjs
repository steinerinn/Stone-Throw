import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {buildReplay} from '../server/replay.mjs';
import {repairReplayPresentation} from '../server/replay-store.mjs';
import {createReplayCursor} from '../client-v13/replay-state.js';
const types=['inf','archer','monk','dwarf','goblin','catapult','elf','cleric','necro','wizard','demon','dragon','assassin','cav','castle','hero'];
const d={id:'chain-test',startedAt:1,configuration:{size:15,players:[{id:'p0',boardId:'b0'},{id:'p1',boardId:'b1'}]},participants:[{seat:0,actor:'p0',displayName:'A'},{seat:1,actor:'p1',displayName:'B'}]};
const facts=types.map((unitType,index)=>({index,turnIndex:1,event:{kind:'impact',unitId:'private-'+index,cells:[{x:index%15,y:Math.floor(index/15)}],meta:{ownerId:'p0',targetBoardId:'b1',source:index%2?'dragon':'plague'},statistics:{unitType}}}));
const replay=buildReplay(d,facts),cursor=createReplayCursor(replay);let checks=0;
for(let i=0;i<types.length;i++){const cell=cursor.seek(i+2).boards[1].cells[(i%15)+','+Math.floor(i/15)];assert.equal(cell.kind,i<13||types[i]==='hero'?types[i]:undefined);if(i<13)assert.equal(cell.unitPresentation.hit,true);assert.equal(Object.keys(cursor.seek(i+2).boards[1].cells).length,i+1);checks++;}
assert.ok(!JSON.stringify(replay).includes('private-'));checks++;
const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE stat_matches(id TEXT,descriptor TEXT,event_cursor INTEGER);CREATE TABLE stat_facts(match_id TEXT,kind TEXT,sequence INTEGER,payload TEXT)');db.prepare('INSERT INTO stat_matches VALUES(?,?,?)').run(d.id,JSON.stringify(d),facts.length);for(const f of facts)db.prepare('INSERT INTO stat_facts VALUES(?,?,?,?)').run(d.id,'event',f.index,JSON.stringify(f));
const old=structuredClone(replay);for(const e of old.timeline)if(e.cells)e.cells=e.cells.map(({x,y})=>({x,y}));const before=JSON.stringify(old),changes=db.prepare('SELECT total_changes() n').get().n;
assert.deepEqual(repairReplayPresentation(db,old),replay);assert.equal(JSON.stringify(old),before);assert.equal(db.prepare('SELECT total_changes() n').get().n,changes);checks+=3;
db.prepare('DELETE FROM stat_facts WHERE sequence=0').run();assert.deepEqual(repairReplayPresentation(db,old),old);checks++;db.close();
const hf=[0,1,2].flatMap((n)=>[{index:n*2,event:{kind:'impact',unitId:'secret-hero',cells:[{x:n+1,y:4}],meta:{ownerId:'p0',targetBoardId:'b1',source:'dragon'},statistics:{unitType:'hero'}}},{index:n*2+1,event:{kind:'hero-moved',unitId:'secret-hero',cells:[{x:14,y:14}]}}]);
const hr=buildReplay(d,hf,[{cursor:6,value:{round:1,turn:1,active:0,boards:[{seat:1,cells:[],hero:[]}]}}]),hc=createReplayCursor(hr);
assert.equal(hc.seek(0).boards[1].hero,undefined);assert.deepEqual(hc.seek(1).boards[1].hero,[{cell:{x:1,y:4},state:'hit'}]);assert.deepEqual(hc.seek(hc.length).boards[1].hero.map(m=>m.state),['hit','wounded','dead']);assert.ok(!JSON.stringify(hr).includes('secret-hero'));assert.ok(!JSON.stringify(hr).includes('14'));checks+=5;
console.log(JSON.stringify({passed:true,checks,chainHitsImmediate:true,noFutureMultiCellOrHeroDisclosure:true,oldReplayRepairReadOnly:true}));
