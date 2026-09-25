import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {createRingService} from '../server/ring-pvp.mjs';import {roster} from '../server/main.mjs';import {prepareStatistics} from '../server/statistics-capture.mjs';
const repository=fileURLToPath(new URL('../../',import.meta.url));
let source=execFileSync('git',['show','c008851de246968eda21ae37e50484e3e2ffb7f7:playtest/server/ring-pvp.mjs'],{cwd:repository,encoding:'utf8'});
// Compare Result behavior under the same explicitly revised gameplay rules.
source=source.replaceAll("rulesVersion:'stone-throw-v1.427'","rulesVersion:'stone-throw-pacing-v1'");
source=source.replace(/from '([^']+)'/g,(all,p)=>p.startsWith('.')?"from '"+new URL(p,new URL('../server/ring-pvp.mjs',import.meta.url)).href+"'":all);
const original=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).createRingService;
const a=original(roster,{seed:42,workers:false,now:()=>100000}),b=createRingService(roster,{seed:42,workers:false,now:()=>100000});
try{
 const body={name:'Registered Human',identity:{kind:'account',playerId:'p'},seats:4,controllers:['human','ai','ai','ai']};
 const old=await a.lobby('make',body,'a'),fresh=await b.lobby('make',body,'a'),ra=a.rooms.get(old.update.lan.code),rb=b.rooms.get(fresh.update.lan.code);
 assert.deepEqual(rb.host,ra.host);assert.equal(new Set(rb.seats.slice(1).map(s=>s.name)).size,3);
 for(const [svc,made,r]of [[a,old,ra],[b,fresh,rb]]){const s=made.update.snapshot;await svc.route(made.token,'a','command',{contract:s.contract,battle:s.battle,revision:s.revision,intent:{kind:'random-placement'}});}
 assert.deepEqual(rb.host,ra.host);
 // The final Human surrender records its normal cutoff/outcome before closure.
 rb.host.status='awaiting-command'; // descriptor-only setup: no combat executed here.
 const d=prepareStatistics(rb,rb.host,rb.epoch,{mode:'4 Players',build:'test',now:()=>100000,participants:rb.seats});assert.ok(d.startedAt);
 const before=JSON.stringify(rb.host);await b.route(fresh.token,'a','give-up');assert.ok(rb.closed);assert.equal(JSON.stringify(rb.host),before);
 const final=prepareStatistics(rb,rb.host,rb.epoch,{mode:'4 Players',build:'test',now:()=>100001,participants:rb.seats,closed:rb.closed});assert.equal(final.participants[0].outcome,'Loss');assert.equal(final.participants[0].reliability,'Quit');assert.ok(final.endedAt);assert.equal(rb.seats[0].npc,undefined);assert.equal(new Set(rb.seats.filter(s=>s.npc).map(s=>s.npc)).size,3);
 console.log('PASS accepted-base host/RNG/placement equality; final Human surrender cutoff, Quit/Loss, room closure without NPC or combat mutation');
}finally{await a.close();await b.close();}
