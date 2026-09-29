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
 enter.addEventListener('click',dismissStartup,{once:true});
}
