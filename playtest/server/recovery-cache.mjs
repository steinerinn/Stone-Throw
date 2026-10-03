import {readableStateVersion} from './persistence-contract.mjs';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Worker} from 'node:worker_threads';
import {journalRecords} from './journal-reader.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const identity=stat=>({dev:stat.dev,ino:stat.ino});
export function loadRecoveryCache(file,journal,stateVersion,mode,storageBuild){
 try{const envelope=JSON.parse(fs.readFileSync(file,'utf8'));if(hash(envelope.payload)!==envelope.sha256)return null;const c=JSON.parse(envelope.payload),s=fs.statSync(journal);
  if(c.format!=='chainsiege-recovery-cache-v1'||!readableStateVersion(c.stateVersion)||c.mode!==mode||c.journal.dev!==s.dev||c.journal.ino!==s.ino||!Number.isSafeInteger(c.sequence)||c.sequence<1||!Number.isSafeInteger(c.start)||c.start<0||!Number.isSafeInteger(c.end)||c.end<=c.start||c.end>s.size)return null;
  const lines=journalRecords(journal,c.start);let anchor;try{anchor=lines.next().value;}finally{lines.return();}
  if(!anchor||anchor.end!==c.end)return null;const r=JSON.parse(anchor.line);if(r.sequence!==c.sequence||r.sha256!==c.previous||hash(r.payload)!==r.sha256)return null;
  const entry=JSON.parse(r.payload);if(entry.mode!==mode||entry.build!==storageBuild||entry.format!=='controlled-playtest-v1'||!readableStateVersion(entry.stateVersion))return null;
  return c;
 }catch{return null;}
}
export function recoveryCacheWriter(file,journal,stateVersion,mode,snapshot){
 let worker=null,busy=false,closed=false,scheduled=null,lastEnd=0,lastSequence=0,latest=null;
 const schedule=()=>{if(closed||busy||scheduled||!latest||latest.sequence===lastSequence)return;
  scheduled=setImmediate(()=>{scheduled=null;if(closed)return;try{
   if(!worker){worker=new Worker(new URL('./recovery-cache-worker.mjs',import.meta.url));worker.unref();}
   const c={...latest,format:'chainsiege-recovery-cache-v1',stateVersion,mode,journal:identity(fs.statSync(journal)),packet:snapshot()};
   const current=worker;
   const cleanup=()=>{current.removeListener('message',done);current.removeListener('error',failed);current.removeListener('exit',failed);};
   const failed=()=>{cleanup();worker=null;busy=false;};
   const done=result=>{cleanup();busy=false;if(result.ok){lastEnd=c.end;lastSequence=c.sequence;}};
   current.once('message',done);current.once('error',failed);current.once('exit',failed);
   busy=true;current.postMessage({file,cache:c});
  }catch{busy=false;}});scheduled.unref();
 };
 // Derivative runtime maintenance only; never required to acknowledge a write,
 // perform a deployment, or shut down. Failed writes retry on the next interval.
 const timer=setInterval(schedule,30000);timer.unref();
 return {record(anchor){latest=anchor;if(!lastSequence||anchor.sequence-lastSequence>=32||anchor.end-lastEnd>=16*1024*1024)schedule();},
  idle:()=>new Promise(resolve=>{const poll=()=>{if(!busy&&!scheduled)resolve();else setTimeout(poll,5);};poll();}),
  close(){closed=true;clearInterval(timer);if(scheduled)clearImmediate(scheduled);scheduled=null;worker?.terminate();busy=false;}};
}
