import {mergeMetrics,metricValues} from './request-metrics.mjs';
// Owner-only aggregates. No credentials, IP addresses, combat state or request logs.
import {createHash} from 'node:crypto';
const HOUR=3600000,DAY=24*HOUR,RETENTION=31*DAY;
export function dashboardRange(range,now){
 if(!['24h','7d','30d'].includes(range))throw Object.assign(Error('Invalid dashboard range.'),{status:400});
 const step=range==='24h'?HOUR:DAY,count=range==='24h'?24:range==='7d'?7:30;
 const start=Math.floor(now/step)*step-(count-1)*step;
 return {range,start,end:now,step,count};
}
export function migrateDashboard(db,now){db.exec(`
 CREATE TABLE IF NOT EXISTS dev_usage_meta(id INTEGER PRIMARY KEY CHECK(id=1),started_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS dev_usage_visits(hour INTEGER NOT NULL,visitor TEXT NOT NULL,account_id TEXT,last_seen INTEGER NOT NULL,PRIMARY KEY(hour,visitor));
 CREATE INDEX IF NOT EXISTS dev_usage_visits_last ON dev_usage_visits(last_seen);
 CREATE INDEX IF NOT EXISTS dev_usage_visits_identity ON dev_usage_visits(visitor);
 CREATE TABLE IF NOT EXISTS dev_usage_accounts(account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,first_seen INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS dev_usage_story(hour INTEGER PRIMARY KEY,battles INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS dev_request_samples(at INTEGER PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS dev_health_samples(at INTEGER PRIMARY KEY,cpu REAL,ram REAL,disk REAL,response REAL);
 `);db.prepare('INSERT OR IGNORE INTO dev_usage_meta VALUES(1,?)').run(now);}
export function dashboardStore(db,{now=Date.now}={}){
 const all=(sql,...args)=>db.prepare(sql).all(...args),one=(sql,...args)=>db.prepare(sql).get(...args),run=(sql,...args)=>db.prepare(sql).run(...args);
 const transaction=fn=>{db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}};
 const began=()=>one('SELECT started_at FROM dev_usage_meta WHERE id=1').started_at;
 const unique=rows=>new Set(rows.map(r=>r.visitor)).size;
 function visits(from,to){return all('SELECT visitor,account_id,last_seen FROM dev_usage_visits WHERE hour>=? AND hour<=? AND last_seen>=? AND last_seen<=?',Math.floor(from/HOUR)*HOUR,to,from,to);}
 function totals(rows,from){const accounts=new Set(rows.filter(r=>r.account_id).map(r=>r.account_id));const first=new Map(all('SELECT account_id,first_seen FROM dev_usage_accounts').map(r=>[r.account_id,r.first_seen]));return {visitors:unique(rows),registered:accounts.size,returning:[...accounts].filter(id=>first.get(id)<from).length};}
 return {
  onlineAccounts(serverStarted){const at=now();return [...new Set(visits(Math.max(serverStarted,at-120000),at).map(r=>r.account_id).filter(Boolean))];},
  visit(browser,accountId){
   const at=now(),hour=Math.floor(at/HOUR)*HOUR,guest='b:'+createHash('sha256').update(browser).digest('hex'),visitor=accountId?'a:'+accountId:guest;
   // One row per observed identity/hour. A guest who signs in is folded into that account.
   transaction(()=>{
    if(accountId){run('INSERT OR IGNORE INTO dev_usage_accounts VALUES(?,?)',accountId,Math.min(at,one('SELECT created_at FROM accounts WHERE id=?',accountId)?.created_at??at));run(`INSERT INTO dev_usage_visits(hour,visitor,account_id,last_seen) SELECT hour,?,NULL,last_seen FROM dev_usage_visits WHERE visitor=? ON CONFLICT(hour,visitor) DO UPDATE SET last_seen=max(last_seen,excluded.last_seen)`,visitor,guest);run('DELETE FROM dev_usage_visits WHERE visitor=?',guest);}
    run(`INSERT INTO dev_usage_visits VALUES(?,?,?,?) ON CONFLICT(hour,visitor) DO UPDATE SET last_seen=excluded.last_seen,account_id=COALESCE(excluded.account_id,account_id) WHERE last_seen<? OR (account_id IS NULL AND excluded.account_id IS NOT NULL)`,hour,visitor,accountId||null,at,at-30000);
   });
  },
  storyStart(){run('INSERT INTO dev_usage_story VALUES(?,1) ON CONFLICT(hour) DO UPDATE SET battles=battles+1',Math.floor(now()/HOUR)*HOUR);},
  sample(health,response,timing){
   const at=now(),percent=x=>x&&x.total>0?100*(1-x.available/x.total):null;
   transaction(()=>{run('INSERT OR REPLACE INTO dev_health_samples VALUES(?,?,?,?,?)',at,health.cpuPercent,percent(health.ram),percent(health.disk),response);
    if(timing)run('INSERT OR REPLACE INTO dev_request_samples VALUES(?,?)',at,JSON.stringify(timing));
    for(const [table,column]of [['dev_request_samples','at'],['dev_usage_visits','hour'],['dev_usage_story','hour'],['dev_health_samples','at']])run(`DELETE FROM ${table} WHERE ${column}<?`,at-RETENTION);
   });
  },
  read(range='24h',serverStarted=now()){
   const at=now(),window=dashboardRange(range,at),recordingSince=began(),today=Math.floor(at/DAY)*DAY;
   const visitRows=visits(window.start,at),todayVisits=visits(today,at);
   const games=all('SELECT ended_at at FROM stat_matches WHERE finalized=1 AND ended_at>=? AND ended_at<=?',Math.min(window.start,today),at);
   const story=all('SELECT hour,battles FROM dev_usage_story WHERE hour>=? AND hour<=?',window.start,at);
   const samples=all('SELECT * FROM dev_health_samples WHERE at>=? AND at<=?',window.start,at);
   const timings=all('SELECT at,value FROM dev_request_samples WHERE at>=? AND at<=?',window.start,at).map(r=>({at:r.at,value:JSON.parse(r.value)}));
   const first=new Map(all('SELECT account_id,first_seen FROM dev_usage_accounts').map(r=>[r.account_id,r.first_seen]));
   const mean=(rows,key)=>{const values=rows.map(r=>r[key]).filter(Number.isFinite);return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;};
   const points=Array.from({length:window.count},(_,i)=>{const from=window.start+i*window.step,to=Math.min(from+window.step,at+1),available=to>recordingSince,rows=visitRows.filter(r=>r.last_seen>=from&&r.last_seen<to),accounts=new Set(rows.filter(r=>r.account_id).map(r=>r.account_id)),health=samples.filter(r=>r.at>=from&&r.at<to);
    const recorded=timings.filter(r=>r.at>=from&&r.at<to),timing=recorded.length?metricValues(mergeMetrics(recorded.map(r=>r.value))):{responseMedian:null,responseP95:null,responseWorst:null,requestCount:null,queueP95:null,loopMax:null};
    return {...timing,at:from,visitors:available?unique(rows):null,registered:available?accounts.size:null,returning:available?[...accounts].filter(id=>first.get(id)<window.start).length:null,games:games.filter(r=>r.at>=from&&r.at<to).length,story:available?story.filter(r=>r.hour>=from&&r.hour<to).reduce((n,r)=>n+r.battles,0):null,cpu:mean(health,'cpu'),ram:mean(health,'ram'),disk:mean(health,'disk'),response:mean(health,'response')};});
   return {range,recordingSince,start:window.start,end:at,partial:recordingSince>window.start,points,totals:{...totals(visitRows,window.start),games:games.filter(r=>r.at>=window.start).length,story:story.reduce((n,r)=>n+r.battles,0)},today:{...totals(todayVisits,today),games:games.filter(r=>r.at>=today).length},onlineNow:unique(visits(Math.max(serverStarted,at-120000),at))};
  }
 };
}
