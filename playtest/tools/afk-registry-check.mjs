import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createHost} from '../canonical/compiled/host/initialization.js';import {acceptCommand} from '../canonical/compiled/host/lifecycle.js';
import {normalTarget} from '../canonical/compiled/host/ring.js';import {prepareStatistics} from '../server/statistics-capture.mjs';
import {statisticsStore,migrateStatistics} from '../server/statistics-store.mjs';import {migrateScores} from '../server/score-store.mjs';import {migrateReplays} from '../server/replay-store.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-afk-registry-')),file=path.join(dir,'registry.sqlite');let db=new DatabaseSync(file),checks=0,now=1000;
db.exec("CREATE TABLE accounts(id TEXT PRIMARY KEY,qualifying_games INTEGER NOT NULL DEFAULT 0);INSERT INTO accounts(id) VALUES('account')");migrateStatistics(db,dir);migrateScores(db);migrateReplays(db);let store=statisticsStore(db),ids=new Set();
function play({afkIncidents=0,disconnects=0,mode='Duel',departure=false}={}){
 const holder={},participants=[{controller:'human',identity:{kind:'account',playerId:'account'},afkIncidents,disconnects,...(departure?{statDeparture:{reason:'surrender',eventCursor:0}}:{})},{controller:'ai'}];
 let h=createHost({matchId:'fixture',rulesVersion:'stone-throw-pacing-v1',size:5,story:false,seed:42,players:[0,1].map(i=>({id:'p'+i,boardId:'b'+i,roster:{inf:1},decisionMode:'interactive'}))}),serial=0;
 const cmd=c=>h=acceptCommand(h,{id:'c'+(++serial),...c});
 for(let i=0;i<2;i++)cmd({kind:'place',placement:{unitId:'u'+i,ownerId:'p'+i,boardId:'b'+i,type:'inf',cells:[{x:2,y:2}]}});
 cmd({kind:'start'});
 while(h.status!=='complete'){if(h.status==='awaiting-turn')cmd({kind:'advance-turn'});else cmd({kind:'shoot',actorId:h.activePlayerId,boardId:normalTarget(h.state,h.activePlayerId).boardId,cell:{x:2,y:2}});}
 const d=prepareStatistics(holder,h,1,{mode,build:'test',now:()=>++now,participants});assert.ok(!ids.has(d.id));ids.add(d.id);store.capture(d,h);
 const rating=store.reliability('account');store.capture(d,h);store.capture(d,h);assert.deepEqual(store.reliability('account'),rating);checks++;
 return d;
}
assert.equal(play({afkIncidents:1,disconnects:1}).participants[0].reliabilityOutcome,'FINISHED');
assert.equal(play({disconnects:2}).participants[0].reliabilityOutcome,'DISCONNECTED');
assert.equal(play({afkIncidents:2,departure:true}).participants[0].reliabilityOutcome,'AFK');
assert.equal(play({afkIncidents:3,disconnects:2}).participants[0].reliabilityOutcome,'AFK');checks+=4;
for(let i=0;i<9;i++)play();assert.equal(store.reliability('account').outstandingAFK,2);play();assert.equal(store.reliability('account').outstandingAFK,1);
for(let i=0;i<10;i++)play();let rating=store.reliability('account');assert.equal(rating.AFK,2);assert.equal(rating.forgivenAFK,2);assert.equal(rating.Disconnect,1);assert.equal(rating.forgiveness.length,2);checks+=3;
play({mode:'Single Player',afkIncidents:9,disconnects:9});assert.deepEqual(store.reliability('account'),rating);assert.equal(store.reliability(null).status,'unrated');checks+=2;
db.close();db=new DatabaseSync(file);store=statisticsStore(db);assert.deepEqual(store.reliability('account'),rating);assert.equal(db.prepare('SELECT count(*) n FROM stat_matches WHERE finalized=1').get().n,ids.size);checks+=2;
db.close();console.log(JSON.stringify({passed:true,checks,dir}));
