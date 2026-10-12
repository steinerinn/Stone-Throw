import {parentPort,workerData} from 'node:worker_threads';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {dashboardStore} from './dashboard-store.mjs';

// This connection only handles visits; Registry initialization/migrations stay with its owner.
const db=new DatabaseSync(workerData.file);
db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA journal_size_limit=4194304; PRAGMA foreign_keys=ON;');
parentPort.on('message',({id,close,body,token,browser,ip,at})=>{
 if(close){db.close();parentPort.close();return;}
 try{
  const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
  if(Object.keys(body).some(k=>k!=='playing')||body.playing!==undefined&&typeof body.playing!=='boolean')fail('Invalid visit.');
  const now=at===null?Date.now:()=>at,q=(sql,...args)=>db.prepare(sql).get(...args),run=(sql,...args)=>db.prepare(sql).run(...args);
  const t=now(),key='usage:'+ip;
  run('DELETE FROM limits WHERE reset <= ?',t);
  const old=q('SELECT * FROM limits WHERE key=?',key);
  if(old?.count>=24000)fail('Too many attempts. Please try again later.',429);
  run('INSERT INTO limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=count+1',key,1,t+3600000);
  const account=typeof token==='string'&&/^[a-f0-9]{64}$/.test(token)?q('SELECT a.* FROM sessions s JOIN accounts a ON a.id=s.player_id WHERE s.token_hash=? AND s.expires>? AND a.status IN (?,?)',createHash('sha256').update(token).digest('hex'),now(),'active','flagged'):null;
  dashboardStore(db,{now}).visit(browser,account?.id||null);
  parentPort.postMessage({id,result:{recorded:true}});
 }catch(error){parentPort.postMessage({id,error:{message:error.message,status:error.status}});}
});
