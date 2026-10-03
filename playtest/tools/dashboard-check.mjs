import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {migrateDashboard,dashboardStore,dashboardRange} from '../server/dashboard-store.mjs';
import {devRoomHealthReader} from '../server/dev-room.mjs';
const db=new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON;CREATE TABLE accounts(id TEXT PRIMARY KEY,created_at INTEGER);INSERT INTO accounts VALUES (\'old\',1788264000000),(\'new\',1788955200000);CREATE TABLE stat_matches(id TEXT,finalized INTEGER,ended_at INTEGER);');
const DAY=86400000,HOUR=3600000;let time=Date.parse('2026-09-01T12:00:00Z'),checks=0;
migrateDashboard(db,time);let store=dashboardStore(db,{now:()=>time});
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
try{
 let d=store.read('30d',time);eq(d.points.length,30);eq(d.points.at(-2).visitors,null);eq(d.points.at(-1).visitors,0);eq(d.points.at(-1).cpu,null);eq(d.points.at(-1).response,null);
 store.visit('one','old');store.visit('another','old');store.visit('guest',null);store.visit('guest',null);
 eq(store.read('24h',time).totals,{visitors:2,registered:1,returning:0,games:0,story:0});eq(store.read('24h',time).onlineNow,2);
 time+=8*DAY;store.visit('one','old');store.visit('two','new');store.visit('guest2',null);
 store.storyStart();store.storyStart();
 db.prepare('INSERT INTO stat_matches VALUES(?,?,?)').run('finished',1,time);db.prepare('INSERT INTO stat_matches VALUES(?,?,?)').run('active',0,null);
 d=store.read('7d',time);eq(d.totals,{visitors:3,registered:2,returning:1,games:1,story:2});eq(d.today.returning,1);eq(d.points.at(-1).returning,1);eq(d.points.at(-1).games,1);eq(d.points.at(-1).story,2);
 eq(store.read('30d',time).totals.returning,0);eq(store.read('30d',time).totals.registered,2);
 // Signing in folds browser identity, but never invents a registered visit in a past guest-only hour.
 time+=HOUR;store.visit('guest2','new');eq(store.read('24h',time).totals.visitors,2);eq(store.read('24h',time).points.at(-2).registered,2);
 store.visit('anonymous',null);time+=HOUR;store.visit('anonymous','new');eq(store.read('24h',time).points.at(-2).registered,1);
 const reading={cpuPercent:25,ram:{total:100,available:40},disk:{total:100,available:80}};
 store.sample(reading,12);time+=300000;store.sample({...reading,cpuPercent:75},28);
 d=store.read('24h',time);eq(d.points.at(-1).cpu,50);eq(d.points.at(-1).ram,60);assert.ok(Math.abs(d.points.at(-1).disk-20)<1e-9);checks++;eq(d.points.at(-1).response,20);eq(d.points.at(-2).cpu,null);
 const since=d.recordingSince;store=dashboardStore(db,{now:()=>time});migrateDashboard(db,time);eq(store.read('24h',time).recordingSince,since);eq(store.read('24h',time).points.at(-1).cpu,50);
 for(const [range,count]of [['24h',24],['7d',7],['30d',30]]){eq(store.read(range,time).points.length,count);eq(dashboardRange(range,time).range,range);}
 assert.throws(()=>store.read('all'),e=>e.status===400);checks++;
 time+=32*DAY;store.sample({...reading,cpuPercent:null},null);eq(db.prepare('SELECT count(*) n FROM dev_usage_visits').get().n,0);eq(db.prepare('SELECT count(*) n FROM dev_usage_story').get().n,0);eq(db.prepare('SELECT count(*) n FROM dev_health_samples').get().n,1);
 store.visit('one','old');eq(store.read('7d',time).totals.returning,1);eq(store.read('7d',time).points.at(-1).cpu,null);eq(store.read('7d',time).points.at(-1).response,null);eq(store.read('7d',time+1).onlineNow,0);
 db.prepare('INSERT INTO accounts VALUES(?,?)').run('legacy',time-DAY);store.visit('legacy-browser','legacy');eq(store.read('24h',time).today.returning,2);
 const readHealth=devRoomHealthReader();eq(readHealth('.').cpuPercent,null);eq(readHealth('Z:/missing-dashboard-drive').disk,null);
 assert.ok(!/password|token|browser|account_id|visitor:/.test(JSON.stringify(store.read('7d',time))));checks++;
 console.log(JSON.stringify({passed:true,checks,metrics:true,boundedHistory:true,missingSamples:true}));
}finally{db.close();}
