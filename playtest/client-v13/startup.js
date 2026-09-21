import {startupAccount} from './registry.js';
import {enterMusic} from './music.js';
// One entry gate per document. Internal navigation retains the same audio context.
const gate=document.getElementById('stStartup'),enter=document.getElementById('stStartupEnter');
if(gate){
 gate.close();gate.showModal();gate.addEventListener('cancel',e=>e.preventDefault());
 for(const type of ['keydown','keyup'])gate.addEventListener(type,e=>e.stopPropagation());
 startupAccount.then(account=>{if(account){document.getElementById('stStartupWelcome').textContent='Welcome back, '+account.displayName+'!';document.getElementById('stStartupLine').textContent='Ready for another siege?';}enter.disabled=false;enter.focus();});
 enter.addEventListener('click',()=>{document.body.classList.add('st-main-menu-mode');enterMusic();gate.close();gate.remove();document.getElementById('stMenuFull')?.focus();},{once:true});
}
