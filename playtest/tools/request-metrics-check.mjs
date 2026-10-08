import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {requestMetrics,metricValues,mergeMetrics,measuredRequest} from '../server/request-metrics.mjs';
import {migrateDashboard,dashboardStore} from '../server/dashboard-store.mjs';
const tiny=requestMetrics();for(const value of [.2,.4,.6])tiny.response(value);assert.ok(metricValues(tiny.take()).responseMedian<=.42);
const m=requestMetrics();assert.equal(metricValues(m.take()).responseP95,null);
for(let i=0;i<99;i++)m.response(10);m.response(600);m.queue(40);const a=m.take(75),v=metricValues(a);
assert.ok(v.responseMedian>=10&&v.responseMedian<=10.5);assert.ok(v.responseP95<=10.5);assert.equal(v.responseWorst,600);assert.equal(v.requestCount,100);assert.ok(v.queueP95>=40&&v.queueP95<=42);assert.equal(v.loopMax,75);
m.response(2000);const b=m.take(25),merged=metricValues(mergeMetrics([a,b]));assert.ok(merged.responseP95<=10.5,'merge observations, never average percentiles');assert.equal(merged.requestCount,101);assert.equal(merged.responseWorst,2000);assert.equal(merged.loopMax,75);
for(const url of ['/api/pvp/watch','/api/pvp/watch?x=1','/api/dev-room/overview','/api/registry/dev-review-games','/api/registry/usage-visit'])assert.equal(measuredRequest('POST',url),false);
assert.equal(measuredRequest('POST','/api/command'),true);assert.equal(measuredRequest('POST','/api/registry/login'),true);assert.equal(measuredRequest('GET','/health'),false);
for(let i=0;i<100000;i++)m.response(i);assert.ok(Object.keys(m.take().response.bins).length<=512);
const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE accounts(id TEXT PRIMARY KEY,created_at INTEGER);CREATE TABLE stat_matches(finalized INTEGER,ended_at INTEGER);');let now=Date.parse('2026-10-08T12:00:00Z');migrateDashboard(db,now);const store=dashboardStore(db,{now:()=>now}),health={cpuPercent:1,ram:null,disk:null};
assert.equal(store.read().points.at(-1).requestCount,null);store.sample(health,600);assert.equal(store.read().points.at(-1).responseP95,null,'legacy means cannot become percentiles');store.sample(health,null,a);now+=300000;store.sample(health,null,b);
for(const range of ['24h','7d','30d']){const p=store.read(range).points.at(-1);assert.equal(p.requestCount,101);assert.ok(p.responseP95<=10.5);assert.equal(p.responseWorst,2000);assert.equal(p.loopMax,75);}
now+=32*86400000;store.sample(health,null,m.take());assert.equal(db.prepare('SELECT count(*) n FROM dev_request_samples').get().n,1);db.close();console.log('PASS: response distribution, weighted merge, maxima, exclusion rules, bounded memory, all ranges, absent history, 31-day retention');
