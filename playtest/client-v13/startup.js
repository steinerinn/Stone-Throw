import {startupAccount} from './registry.js';
import {enterMusic} from './music.js';
// One entry gate per document. Internal navigation retains the same audio context.
const gate=document.getElementById('stStartup'),enter=document.getElementById('stStartupEnter');
export function dismissStartup(){document.body.classList.add('st-main-menu-mode');enterMusic();if(gate?.isConnected){gate.close();gate.remove();}const menu=document.getElementById('stMainMenu');if(menu){menu.tabIndex=-1;menu.focus({preventScroll:true});}}
try{sessionStorage.removeItem('chainSiege.returnToMenu');}catch{}
if(gate?.isConnected){
 gate.close();gate.showModal();gate.style.visibility='visible';gate.addEventListener('cancel',e=>e.preventDefault());
 for(const type of ['keydown','keyup'])gate.addEventListener(type,e=>e.stopPropagation());
 startupAccount.then(account=>{if(!gate.isConnected)return;if(account){document.getElementById('stStartupWelcome').textContent='Welcome back, '+account.displayName+'!';document.getElementById('stStartupLine').textContent='Ready for another siege?';}enter.disabled=false;enter.focus();});
 fetch('/welcome-message',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(message=>{if(!gate.isConnected||!message?.text)return;const p=document.createElement('p');p.id='stWelcomeMessage';p.textContent=message.text;p.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-width:640px;margin:16px auto';enter.before(p);}).catch(()=>{});
 enter.addEventListener('click',dismissStartup,{once:true});
}

// Presence is a visible game-tab heartbeat, not a login or an IP-based visitor count.
// The view hint can only clear local dashboard activity; it cannot create active play.
let visitPending=false,lastVisit=0,lastPlaying;
const playing=()=>document.visibilityState==='visible'&&!gate?.isConnected&&!document.body.classList.contains('st-main-menu-mode');
async function recordVisit(){
 const current=playing();
 if(visitPending||current===lastPlaying&&(document.visibilityState!=='visible'||Date.now()-lastVisit<30000))return;
 visitPending=true;lastVisit=Date.now();lastPlaying=current;
 try{await fetch('/api/registry/usage-visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({playing:current})});}catch{}finally{visitPending=false;if(playing()!==lastPlaying)void recordVisit();}
}
startupAccount.finally(recordVisit);
setInterval(recordVisit,60000);
document.addEventListener('visibilitychange',recordVisit);

new MutationObserver(()=>{if(playing()!==lastPlaying)void recordVisit();}).observe(document.body,{attributes:true,attributeFilter:['class']});
