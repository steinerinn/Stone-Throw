import assert from 'node:assert/strict';
import {createPvpService} from '../server/multiplayer.mjs';
const service=createPvpService({inf:1},{seed:42,now:()=>100000});
try{
 const made=await service.lobby('make',{name:'Host',slots:['human','human','empty','empty']},'host');
 const first=service.watchRead(made.token,'host',0,'');
 assert.equal(first.lan.deployment.deadline,null);
 assert.equal(service.watchRead(made.token,'host',0,first.deliveryCursor),null);
 await service.lobby('join',{name:'Peer',code:made.update.lan.code},'peer');
 const joined=service.watchRead(made.token,'host',0,first.deliveryCursor);
 assert.ok(joined,'Seat arrival must wake the host watch without requiring a placement command');
 assert.deepEqual(joined.lan.names,['Host','Peer']);assert.equal(joined.lan.deployment.deadline,220000);
 assert.equal(joined.snapshot.revision,first.snapshot.revision,'Notification must not change gameplay revision');
 assert.equal(service.watchRead(made.token,'host',0,joined.deliveryCursor),null);
 console.log(JSON.stringify({passed:true,joinWakesWatch:true,deploymentClockDelivered:true,unchangedGameplayRevision:true,unchangedWatchSuppressed:true}));
}finally{await service.close();}
