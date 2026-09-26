import assert from 'node:assert/strict';
import {acknowledgeInput,requiredInput,reconcileAfk,voteAfk,cancelAfk,afkInfo} from '../server/afk-policy.mjs';
import {finalReliability,reliabilityHistory} from '../server/reliability-outcome.mjs';
let checks=0;
function fixture(n=4){const r={epoch:1,revision:1,seats:Array.from({length:n},(_,i)=>({controller:'human',token:'t'+i,seen:0})),host:{status:'awaiting-command',activePlayerId:'p0',events:[],config:{players:Array.from({length:n},(_,i)=>({id:'p'+i}))},state:{seats:Array.from({length:n},(_,i)=>({playerId:'p'+i,ordinaryShots:5})),ring:{order:Array.from({length:n},(_,i)=>'p'+i)}}}};let now=0,taken=[];const takeover=(room,i,reason)=>{taken.push({i,reason});room.seats[i].controller='ai';room.seats[i].statDeparture={reason,eventCursor:0};};const tick=t=>{now=t;r.seats.forEach(s=>s.seen=t);reconcileAfk(r,t,takeover);};const ready=()=>acknowledgeInput(r,0,requiredInput(r).key,now);const vote=(i,action)=>voteAfk(r,i,{episode:r.afk.id,action},now,takeover);return {r,tick,ready,vote,taken};}
{
 const f=fixture();f.ready();f.tick(29000);assert.equal(f.r.seats[0].afkIncidents,undefined);f.tick(30000);assert.equal(f.r.seats[0].afkIncidents,1);assert.equal(afkInfo(f.r,1,30000).threshold,2);f.tick(31000);assert.equal(f.r.seats[0].afkIncidents,1);f.vote(1,'kick');assert.equal(f.taken.length,0);f.vote(2,'kick');assert.equal(f.taken.length,1);checks+=4;
}
for(const n of [2,3]){const f=fixture(n);f.ready();f.tick(30000);f.vote(1,'kick');assert.equal(f.taken.length,1);checks++;}
{
 const f=fixture();f.ready();f.tick(30000);cancelAfk(f.r);f.ready();f.tick(60000);assert.equal(f.r.seats[0].afkIncidents,2);f.vote(1,'kick');assert.equal(f.taken.length,1);checks++;
}
{
 const f=fixture();f.ready();f.tick(30000);for(const i of [1,2,3])f.vote(i,'wait');assert.equal(f.r.afk.deadline,150000);f.tick(149999);assert.equal(f.taken.length,0);f.tick(150000);assert.equal(f.taken.length,1);checks++;
}
for(const mixed of [false,true]){const f=fixture();f.ready();f.tick(30000);f.vote(1,'wait');if(mixed)f.vote(2,'kick');assert.equal(f.r.afk.deadline,60000);f.tick(60000);assert.equal(f.taken.length,1);checks++;}
{
 const f=fixture();f.ready();f.tick(30000);cancelAfk(f.r);f.tick(60000);assert.equal(f.taken.length,0);assert.equal(f.r.seats[0].afkIncidents,1);assert.ok(!f.r.afk);checks++;
}
for(const [facts,outcome] of [[{incidents:1},'FINISHED'],[{incidents:2},'AFK'],[{incidents:2,departure:true},'AFK'],[{incidents:1,departure:true},'DISCONNECTED'],[{disconnects:1},'FINISHED'],[{disconnects:2},'DISCONNECTED'],...['quit','leave','surrender','kick','auto'].map(reason=>[{departure:reason},'DISCONNECTED'])]){assert.equal(finalReliability(facts),outcome);checks++;}
const row=(id,outcome,mode='online')=>({match_id:String(id),seat:0,descriptor:{classification:{mode},participants:[{seat:0,reliabilityOutcome:outcome}]}});
{
 const rows=[row(0,'AFK'),...Array.from({length:9},(_,i)=>row(i+1,'FINISHED'))];let r=reliabilityHistory(rows);assert.equal(r.outstandingAFK,1);assert.equal(r.gamesUntilForgiveness,1);rows.push(row(10,'FINISHED'));r=reliabilityHistory(rows);assert.equal(r.outstandingAFK,0);assert.equal(r.forgivenAFK,1);assert.equal(r.percent,100);assert.equal(r.AFK,1);checks+=2;
 for(const fail of ['AFK','DISCONNECTED']){r=reliabilityHistory([...rows.slice(0,9),row(20,fail)]);assert.equal(r.cleanStreak,0);checks++;}
 const multiple=[row(0,'DISCONNECTED'),row(1,'AFK'),row(2,'AFK'),...Array.from({length:20},(_,i)=>row(i+3,'FINISHED'))];r=reliabilityHistory(multiple);assert.equal(r.forgivenAFK,2);assert.equal(r.Disconnect,1);assert.equal(r.forgiveness.length,2);assert.equal(r.percent,2200/23);checks+=2;
 assert.deepEqual(reliabilityHistory([...multiple,...multiple]),r);assert.deepEqual(reliabilityHistory([...multiple,row(40,'AFK','single')]),r);assert.equal(reliabilityHistory([]).status,'unrated');checks+=3;
}
for(const kind of ['scout','resurrection','catapult-target','catapult-roll','hero-relocation']){const f=fixture();f.r.host.status='awaiting-decision';f.r.host.pendingRoot={decisions:[{id:'d',kind,status:'pending',actorId:'p0',legalCells:[{x:1,y:1}]}]};assert.ok(requiredInput(f.r));f.ready();f.tick(30000);assert.equal(f.r.seats[0].afkIncidents,1);checks++;}
for(const mode of ['placement','running','complete','awaiting-turn']){const f=fixture();f.r.host.status=mode;assert.equal(requiredInput(f.r),null);checks++;}
{
 const f=fixture();f.tick(300000);assert.equal(f.r.seats[0].afkIncidents,undefined); // playback not acknowledged
 f.ready();f.tick(330000);f.r.seats[0].absence={};f.tick(340000);assert.ok(!f.r.afk);assert.equal(f.r.seats[0].afkIncidents,1);checks+=2;
}
{
 const f=fixture();f.ready();f.tick(30000);f.vote(1,'wait');f.vote(2,'wait');f.r.seats[3].controller='ai';f.tick(31000);assert.equal(f.r.afk.deadline,150000);assert.throws(()=>f.vote(1,'kick'),/stale/);checks+=2;
}
for(const excluded of ['local','ai','eliminated','disconnected','zero-budget']){const f=fixture();if(excluded==='local')f.r.local=true;if(excluded==='ai')f.r.seats[0].controller='ai';if(excluded==='eliminated')f.r.host.state.ring.order.shift();if(excluded==='disconnected')f.r.seats[0].absence={};if(excluded==='zero-budget')f.r.host.state.seats[0].ordinaryShots=0;assert.equal(requiredInput(f.r),null);checks++;}
{const f=fixture();f.r.afkPresentationUntil=4000;assert.equal(f.ready(),false);f.tick(4000);assert.equal(f.ready(),true);f.tick(33000);assert.equal(f.r.seats[0].afkIncidents,undefined);f.tick(34000);assert.equal(f.r.seats[0].afkIncidents,1);checks++;}
{const f=fixture(2);f.r.seats[1].controller='ai';f.ready();f.tick(30000);assert.equal(f.taken.length,0);assert.equal(f.r.afk.votes[1],'wait');assert.equal(f.r.afk.deadline,150000);f.tick(60000);assert.equal(f.taken.length,0);f.tick(150000);assert.equal(f.taken.length,1);checks++;}
// Mixed rooms: AI WAIT must not dilute human KICK or substitute for human silence.
for(const humans of [1,2]){
 const f=fixture(4);for(let i=humans+1;i<4;i++)f.r.seats[i].controller='ai';f.ready();f.tick(30000);
 assert.equal(f.r.afk.threshold,1);assert.equal(f.r.afk.deadline,60000);
 for(let i=humans+1;i<4;i++){assert.equal(f.r.afk.votes[i],'wait');assert.throws(()=>f.vote(i,'kick'),/stale/);}
 f.vote(1,'kick');assert.equal(f.taken.length,1);checks++;
 const g=fixture(4);for(let i=humans+1;i<4;i++)g.r.seats[i].controller='ai';g.ready();g.tick(30000);
 for(let i=1;i<=humans;i++)g.vote(i,'wait');assert.equal(g.r.afk.deadline,150000);checks++;
}
{const f=fixture();f.ready();f.tick(30000);f.vote(1,'kick');f.vote(2,'wait');f.r.seats[1].controller='ai';f.r.seats[3].controller='ai';f.tick(31000);assert.equal(f.r.afk.votes[1],'wait');assert.equal(f.r.afk.deadline,150000);assert.equal(f.taken.length,0);checks++;}
{const f=fixture(2);f.r.seats[1].controller='ai';f.r.host.state.ring.order=['p0'];f.ready();f.tick(30000);assert.equal(f.r.afk.deadline,60000);assert.equal(f.r.afk.votes[1],undefined);checks++;}
console.log(JSON.stringify({passed:true,checks}));
