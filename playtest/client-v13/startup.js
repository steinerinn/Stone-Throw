import {startupAccount} from './registry.js';
import {enterMusic} from './music.js';
// One entry gate per document. Internal navigation retains the same audio context.
const gate=document.getElementById('stStartup'),enter=document.getElementById('stStartupEnter');
export function dismissStartup(){document.body.classList.add('st-main-menu-mode');enterMusic();if(gate?.isConnected){gate.close();gate.remove();}document.getElementById('stMenuFull')?.focus({preventScroll:true});}
let returningToMenu=false;try{returningToMenu=sessionStorage.getItem('chainSiege.returnToMenu')==='1';sessionStorage.removeItem('chainSiege.returnToMenu');}catch{}
if(returningToMenu)dismissStartup();
if(gate?.isConnected){
 gate.close();gate.showModal();gate.addEventListener('cancel',e=>e.preventDefault());
 for(const type of ['keydown','keyup'])gate.addEventListener(type,e=>e.stopPropagation());
 startupAccount.then(account=>{if(!gate.isConnected)return;if(account){document.getElementById('stStartupWelcome').textContent='Welcome back, '+account.displayName+'!';document.getElementById('stStartupLine').textContent='Ready for another siege?';}enter.disabled=false;enter.focus();});
 enter.addEventListener('click',dismissStartup,{once:true});
}
