import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRingService} from '../server/ring-pvp.mjs';
let checks=0;
const source=fs.readFileSync(new URL('../client-v13/combat-feedback.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export function mountCombatFeedback','function mountCombatFeedback');
function feedback(){let muted=false;const tones=[];class AudioContext{currentTime=0;destination={};createOscillator(){const o={frequency:{},connect(){},start(){tones.push(o.frequency.value)},stop(){}};return o;}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}close(){return Promise.resolve();}}
 const ctx={window:{AudioContext,chainSiegeAudio:{scale:()=>muted?0:1,sfxBus:()=>({})}},document:{getElementById:()=>null,querySelectorAll:()=>[]},setTimeout,clearTimeout,musicPublicUpdate(){},mountBattleLog:()=>({consume(){},begin(){},end(){}})};vm.createContext(ctx);vm.runInContext(source+'\nthis.feedback=mountCombatFeedback();',ctx);return {api:ctx.feedback,tones,mute:v=>muted=v};}
for(const seats of [3,4]){const service=createRingService({inf:2,archer:1},{seed:42,now:()=>100000,workers:true});try{
 const made=await service.lobby('make',{name:'One',seats,controllers:Array(seats).fill('human')},'0'),code=made.update.lan.code,tokens=[made.token];for(let i=1;i<seats;i++)tokens.push((await service.lobby('join',{name:'Player'+i,code},String(i))).token);
 const read=(i,after=0)=>service.route(tokens[i],String(i),'read',{after});const act=async(i,intent)=>{const u=await read(i);const r=await service.route(tokens[i],String(i),'command',{contract:u.snapshot.contract,battle:u.snapshot.battle,revision:u.snapshot.revision,intent});assert.equal(r.accepted,true,r.error);return r;};
 for(let i=0;i<seats;i++){await act(i,{kind:'place',unit:'inf',cells:[{x:14,y:14}]});await act(i,{kind:'place',unit:'inf',cells:[{x:10,y:10}]});await act(i,{kind:'place',unit:'archer',cells:[{x:5,y:5}]});}for(let i=0;i<seats;i++)await act(i,{kind:'start'});
 const room=service.rooms.get(code),actor=Number(room.host.activePlayerId.slice(5)),before=await Promise.all(tokens.map((_,i)=>read(i)));await act(actor,{kind:'shoot',cell:{x:5,y:5}});
 let secondary=false;
 for(let i=0;i<seats;i++){const u=await read(i,before[i].snapshot.eventPosition),frames=u.presentation||[];const journal=room.host.state.match.knowledge[room.host.config.players[i].id].events.slice(before[i].snapshot.eventPosition).filter(e=>['impact','miss'].includes(e.kind));assert.ok(journal.length);assert.deepEqual(u.soundEvents,journal.map(e=>({position:e.sequence,hit:e.kind==='impact'})));checks++;
 const f=feedback();f.api.consume({...before[i],restored:true});assert.equal(f.tones.length,0);for(const frame of frames)f.api.consume(frame);f.api.consume(u);assert.equal(f.tones.length,journal.length,'One sound per disclosed hit/miss, including chain');checks++;
 f.api.consume(u);for(const frame of frames)f.api.consume(frame);assert.equal(f.tones.length,journal.length,'Repeated updates stay silent');checks++;
 const primaryPositions=new Set(u.events.map(e=>e.position));if(u.soundEvents.some(e=>!primaryPositions.has(e.position)))secondary=true;
 const fresh=feedback();fresh.api.consume({...u,restored:true});fresh.api.consume(u);assert.equal(fresh.tones.length,0,'Restored history stays silent');fresh.mute(true);fresh.api.consume({...u,soundEvents:[{position:u.snapshot.eventPosition+1,hit:true}]});assert.equal(fresh.tones.length,0,'SFX mute applies');fresh.mute(false);fresh.api.consume({...u,soundEvents:[{position:u.snapshot.eventPosition+2,hit:false}]});assert.deepEqual(fresh.tones,[440]);checks+=3;f.api.unmount();fresh.api.unmount();
 }assert.ok(secondary,'Lower-map attacks contribute sound');checks++;
 }finally{await service.close();}}
// Existing two-board fallback is unchanged.
const f=feedback(),snapshot={battle:'duel',phase:'action',active:'self',size:15,owned:[],opponent:[],demonRunes:[],eventPosition:2};f.api.consume({snapshot,events:[{position:1,kind:'impact',cell:{x:0,y:0},side:'self'},{position:2,kind:'miss'}]});assert.deepEqual(f.tones,[880,440]);f.api.unmount();checks++;
console.log(JSON.stringify({passed:true,checks,formats:[3,4],realChain:true,secondarySounds:true,repeatedAndRestoredSilent:true,mute:true}));
