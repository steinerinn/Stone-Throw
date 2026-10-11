import assert from 'node:assert/strict';
import {publicPlaybackAudio} from '../client-v13/public-playback-audio.js';
const contexts=[],nodes=[];let muted=false;
const parameter=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
class Context{
 constructor(){this.currentTime=0;this.destination={};this.closed=false;contexts.push(this);}
 resume(){return Promise.resolve();}close(){this.closed=true;return Promise.resolve();}
 createGain(){const n={gain:parameter(),connect(){},disconnect(){this.disconnected=true;}};nodes.push(n);return n;}
 createOscillator(){const n={frequency:parameter(),connect(){},disconnect(){this.disconnected=true;},start(){},stop(){queueMicrotask(()=>this.onended?.());}};nodes.push(n);return n;}
}
globalThis.window={AudioContext:Context,chainSiegeAudio:{scale:()=>muted?0:1,sfxBus:c=>c.destination}};
try{
 const sound=publicPlaybackAudio();for(let n=0;n<1000;n++)sound.beep(n%2===0);await Promise.resolve();
 assert.equal(contexts.length,1);assert.equal(nodes.length,2000);assert.ok(nodes.every(n=>n.disconnected),'Every completed contact disconnects both audio nodes');
 muted=true;sound.beep(true);assert.equal(nodes.length,2000);muted=false;
 sound.stop();assert.equal(contexts[0].closed,true);sound.activate();assert.equal(contexts.length,2);
 sound.close();assert.equal(contexts[1].closed,true);sound.beep(false);sound.activate();sound.effect('hero-hit');assert.equal(contexts.length,2,'Disposed playback cannot recreate an audio context');
 console.log(JSON.stringify({passed:true,checks:8,contacts:1000,disconnectedNodes:2000,contextsClosed:2,noAudioAfterDispose:true}));
}finally{delete globalThis.window;}
