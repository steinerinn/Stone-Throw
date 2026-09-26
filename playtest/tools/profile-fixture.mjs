import {openRegistry} from '../server/registry.mjs';
import {createHost} from '../canonical/compiled/host/initialization.js';
import {acceptCommand} from '../canonical/compiled/host/lifecycle.js';
import {normalTarget} from '../canonical/compiled/host/ring.js';
import {prepareStatistics} from '../server/statistics-capture.mjs';
// Isolated test Registry only; every match is finalized through the existing host/capture path.
export async function profileFixture(directory){
 const registry=openRegistry(directory),users=[];
 for(const username of ['TestRaven','TestMatti','TestCruns']){const options={browser:'a'.repeat(48),ip:'profile-test'},c=await registry.handle('challenge',{},options),n=c.question.match(/\d+/g);const r=await registry.handle('register',{username,password:'Password42',confirmPassword:'Password42',country:'IS',challengeId:c.id,answer:String(+n[0]+ +n[1])},options);users.push(r);}
 let time=1790000000000;
 for(let match=0;match<13;match++){
  const n=match===12?2:4,participants=Array.from({length:n},(_,i)=>({name:i<2?users[i].account.displayName:i===2?'Cruns':'Snurk',controller:i<2?'human':'ai',identity:i<2?{kind:'account',playerId:users[i].account.playerId}:null}));
  let h=createHost({matchId:'profile-fixture-'+match,rulesVersion:'stone-throw-v1.427',size:5,story:false,seed:42,players:participants.map((_,i)=>({id:'p'+i,boardId:'b'+i,roster:{inf:1},decisionMode:'interactive'}))}),serial=0;const holder={};
  function capture(){const d=prepareStatistics(holder,h,1,{mode:match===12?'Single Player':'4 Players',build:'profile-test',now:()=>++time,participants});if(d)registry.statistics.capture(d,h);return d;}
  function command(c){h=acceptCommand(h,{id:'c'+(++serial),...c});capture();}
  for(let i=0;i<n;i++)command({kind:'place',placement:{unitId:'u'+i,ownerId:'p'+i,boardId:'b'+i,type:'inf',cells:[{x:2,y:2}]}});
  command({kind:'start'});
  if(match===0||match===4)participants[0].afkIncidents=2;
  for(let guard=0;h.status!=='complete';guard++){if(guard>30)throw Error('fixture did not finish');if(h.status==='awaiting-turn')command({kind:'advance-turn'});else command({kind:'shoot',actorId:h.activePlayerId,boardId:normalTarget(h.state,h.activePlayerId).boardId,cell:{x:2,y:2}});}
  capture();time+=86400000;
 }
 return {registry,users};
}
