import {legacyRandomPlacement} from '../canonical/compiled/policy/placement-legacy.js';
import {parseKey,cellKey} from '../canonical/compiled/combat/access.js';
import {HEARTBEAT_TIMEOUT_MS} from './disconnect-policy.mjs';
export const DEPLOYMENT_MS=120000;
export function armDeployment(r,now){if(!r.local&&!r.closed&&r.host.status==='placement'&&r.deploymentDeadline==null&&r.seats.every(s=>s&&(s.controller==='ai'||s.token&&!s.left)))r.deploymentDeadline=now+DEPLOYMENT_MS;}
export const deploymentDue=(r,now)=>!r.local&&!r.closed&&r.host.status==='placement'&&r.deploymentDeadline!=null&&now>=r.deploymentDeadline;
export const deploymentInfo=(r,now)=>({deadline:r.deploymentDeadline??null,serverNow:now});
// Existing generic canonical Random placement accepts occupied cells and a missing roster.
// No existing placement is removed, moved, or regenerated; all additions pass host validation.
export function finishDeployment(r,now,place,start){
 if(!deploymentDue(r,now))return false;
 const before={host:structuredClone(r.host),serial:r.serial,ready:[...r.ready],revision:r.revision,deploymentDiagnostics:r.deploymentDiagnostics};
 try{
  const diagnostics=[];
  for(let i=0;i<r.seats.length;i++){
   const seat=r.seats[i],p=r.host.config.players[i],existing=r.host.placements.filter(u=>u.ownerId===p.id),missing=Object.fromEntries(Object.entries(p.roster).map(([type,n])=>[type,n-existing.filter(u=>u.type===type).length]));
   if(seat.controller==='human'&&!r.ready[i]&&!seat.absence&&now-seat.seen<HEARTBEAT_TIMEOUT_MS)diagnostics.push({kind:'deployment-timeout-afk',seat:i,at:now,diagnosticOnly:true});
   if(Object.values(missing).some(n=>n>0))for(const u of legacyRandomPlacement(i?'second-seat':'first-seat',r.host.config.size,missing,r.host.rng,true,0,existing.flatMap(u=>u.cells.map(cellKey))))place(i,{kind:'place',unit:u.type,cells:u.cells.map(parseKey)});
   for(const [type,n]of Object.entries(p.roster))if(r.host.placements.filter(u=>u.ownerId===p.id&&u.type===type).length!==n)throw Error('deployment-incomplete');
  }
  r.deploymentDiagnostics=diagnostics;r.ready.fill(false);start();r.revision++;return true;
 }catch(e){Object.assign(r,before);throw e;}
}
