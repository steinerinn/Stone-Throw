// Best-effort diagnostics. Never part of the durable gameplay acknowledgement path.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {monitorEventLoopDelay,PerformanceObserver,performance} from 'node:perf_hooks';
const routes=new Set(['command','read','open','configure','mode','single/setup','pvp/watch','pvp/heartbeat','pvp/make','pvp/join','pvp/leave','registry/login','registry/register','registry/profile-view','registry/feedback-submit']);
export function performanceLog({directory,stateDir,build,context=()=>({}),fileBytes=2*1024*1024,files=4,interval=1000,sampleMs=10000}={}){
 if(!directory)return {enabled:false,begin(){},async close(){}};
 let queue=[],bytes=0,dropped=0,failed=0,writing=null,closed=false,initialized=false,size=0,serial=0,completed=0,gcMs=0,gcMax=0;
 const active=new Map(),loop=monitorEventLoopDelay({resolution:20});loop.enable();
 const gc=new PerformanceObserver(list=>{for(const e of list.getEntries()){gcMs+=e.duration;gcMax=Math.max(gcMax,e.duration);}});gc.observe({entryTypes:['gc']});
 const file=i=>path.join(directory,'performance-'+i+'.jsonl');
 function record(event,data){if(closed)return;const line=JSON.stringify({time:new Date().toISOString(),event,build,...data})+'\n',n=Buffer.byteLength(line);if(n>Math.min(8192,fileBytes)||bytes+n>256*1024||queue.length>=256){dropped++;return;}queue.push(line);bytes+=n;}
 async function flush(){if(writing)return writing;if(!queue.length)return;const batch=queue;queue=[];bytes=0;writing=(async()=>{try{
  if(!initialized){await fs.mkdir(directory,{recursive:true,mode:0o700});size=await fs.stat(file(0)).then(s=>s.size,()=>0);initialized=true;}
  let chunk='',chunkBytes=0;
  const append=async()=>{if(!chunk)return;await fs.appendFile(file(0),chunk,{mode:0o600});size+=chunkBytes;chunk='';chunkBytes=0;};
  for(const line of batch){const n=Buffer.byteLength(line);if(size+chunkBytes+n>fileBytes){await append();for(let i=files-1;i>=1;i--){await fs.rm(file(i),{force:true});try{await fs.rename(file(i-1),file(i));}catch(e){if(e.code!=='ENOENT')throw e;}}size=0;}chunk+=line;chunkBytes+=n;}await append();
 }catch{failed++;dropped+=batch.length;initialized=false;}finally{writing=null;}})();return writing;}
 const hostCpu=()=>os.cpus().reduce((a,c)=>({idle:a.idle+c.times.idle,total:a.total+Object.values(c.times).reduce((x,y)=>x+y,0)}),{idle:0,total:0});
 let host=hostCpu(),disk=null,diskBusy=false,lastDisk=-Infinity;
 let cpu=process.cpuUsage(),clock=performance.now(),elu=performance.eventLoopUtilization();
 const sampler=setInterval(()=>{const at=performance.now(),elapsed=at-clock,next=process.cpuUsage(),usage=performance.eventLoopUtilization(),memory=process.memoryUsage(),nextHost=hostCpu(),io=process.resourceUsage();
  if(stateDir&&!diskBusy&&at-lastDisk>=60000){diskBusy=true;lastDisk=at;void Promise.all([fs.statfs(stateDir),fs.stat(path.join(stateDir,'checkpoint.journal')).catch(()=>null)]).then(([d,j])=>{disk={at:new Date().toISOString(),availableBytes:d.bavail*d.bsize,totalBytes:d.blocks*d.bsize,journalBytes:j?.size??null};}).catch(()=>{}).finally(()=>{diskBusy=false;});}
  record('sample',{windowMs:elapsed,completed,hostCpuPercent:nextHost.total>host.total?100*(1-(nextHost.idle-host.idle)/(nextHost.total-host.total)):null,hostAvailableRamBytes:os.freemem(),loadAverage:os.loadavg(),fsReadBlocks:io.fsRead,fsWriteBlocks:io.fsWrite,disk,loopMaxMs:loop.count?loop.max/1e6:null,loopP99Ms:loop.count?loop.percentile(99)/1e6:null,cpuPercent:100*((next.user-cpu.user)+(next.system-cpu.system))/(elapsed*1000),eventLoopUtilization:performance.eventLoopUtilization(usage,elu).utilization,rssBytes:memory.rss,heapUsedBytes:memory.heapUsed,externalBytes:memory.external,gcMs,gcMaxMs:gcMax,inflight:[...active.values()].slice(0,32).map(r=>({id:r.id,route:r.route,ageMs:at-r.start,matchId:r.matchId||null})),...context(),dropped,writeFailures:failed});
  loop.reset();host=nextHost;cpu=next;clock=at;elu=usage;completed=0;gcMs=gcMax=0;
 },sampleMs);sampler.unref();const timer=setInterval(()=>{void flush();},interval);timer.unref();
 record('start',{pid:process.pid,fileBytes,files,sampleMs,slowRequestMs:250});
 return {enabled:true,begin(req,res){const raw=req.url.split('?')[0];if(!raw.startsWith('/api/')||raw.startsWith('/api/dev-room/')||raw.startsWith('/api/registry/dev-'))return;
  const route=routes.has(raw.slice(5))?raw.slice(5):'other-api',r={id:++serial,route,start:performance.now(),metrics:{}};req.diagnostic=r;if(active.size<128)active.set(r.id,r);
  let done=false;const end=()=>{if(done)return;done=true;active.delete(r.id);completed++;const totalMs=performance.now()-r.start;
   if(route==='pvp/watch'&&res.writableFinished&&res.statusCode<500)return;
   if(totalMs<250&&res.statusCode<500&&res.writableFinished)return;
   const stages={};for(const [key,value]of Object.entries(r.metrics).slice(0,64))if(/^[a-z][a-z0-9-]{0,63}$/.test(key)&&Number.isFinite(value?.ms))stages[key]={ms:value.ms,count:value.count};
   record('request',{id:r.id,route,status:res.statusCode,aborted:!res.writableFinished,totalMs,queueMs:r.queueMs??null,firstProgressMs:r.firstProgressMs??null,matchId:typeof r.matchId==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(r.matchId)?r.matchId:null,stages});
  };res.once('finish',end);res.once('close',end);
 },async close(){clearInterval(timer);clearInterval(sampler);loop.disable();gc.disconnect();await flush();await flush();closed=true;active.clear();},flush};
}
