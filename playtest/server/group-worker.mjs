import {archiveEncoder,archiveDecoder} from './archive-wire.mjs';
import {metricsContext} from './beta-metrics.mjs';
import {parentPort} from 'node:worker_threads';
import {createRingService} from './ring-pvp.mjs';
const encodeArchive=archiveEncoder(),decodeArchive=archiveDecoder();
let service=null,at=0,lastJob=0;
// Retain only this worker's last committed authority. The parent may reference it
// by the acknowledged job number; all replacements use the full validated restore.
parentPort.on('message',async workerData=>{workerData=decodeArchive(workerData);
const {room,roster,seed,token,binding,action,body,job,reuse}=workerData;at=workerData.at;
const betaMetrics=workerData.betaMetrics?{}:undefined;
await metricsContext.run(betaMetrics,async()=>{try{
 let r;
 if(reuse!==null){if(!service||reuse!==lastJob||room.host!==null)throw Error('Worker authority version mismatch');r=service.rooms.get(room.code);if(!r)throw Error('Worker room mismatch');Object.assign(r,{...room,host:r.host,queue:r.queue});}
 else {await service?.close();service=createRingService(roster,{seed,now:()=>at,workers:false,onFrame:(seat,update)=>parentPort.postMessage({type:'progress',seat,update})});service.restoreState([room],true);r=service.rooms.get(room.code);Object.assign(r,{epoch:room.epoch,revision:room.revision,handles:room.handles,choices:room.choices});}
 const cursors=r.host.config.players.map(p=>r.host.state.match.knowledge[p.id].events.length);
 const result=action==='tick'?await service.tick():await service.route(token,binding,action,body);service.finishProgress(room.code);
 const updates=await Promise.all(r.seats.map((s,i)=>s.controller==='human'&&s.token&&!s.left&&!s.absence?service.route(s.token,s.binding,'read',{after:cursors[i]}):null));
 lastJob=job;parentPort.postMessage(encodeArchive({type:'done',job,betaMetrics,room:service.exportState(true)[0],result,updates}));
 }catch(e){parentPort.postMessage({type:'failure',message:e.message,stack:e.stack});}});
});
