// Loaded only by the explicit development build and enabled Node process.
export function installNodeDevelopment(session,browserClient){
 let reveal=false,takeover=false;
 const clear=()=>document.querySelectorAll('[data-development-reveal]').forEach(e=>e.remove());
 async function paint(){clear();if(!reveal)return;const h=await session.request('dev/inspect');for(const u of h.state.match.units.filter(u=>u.ownerId===h.config.players[1].id))for(const c of u.cells){const el=document.createElement('span');el.dataset.developmentReveal='true';el.textContent=u.type;el.style.cssText='position:absolute;z-index:20;background:#111;color:white;font:9px sans-serif';document.getElementById('enemyGrid').children[c.y*h.config.size+c.x]?.append(el);}}
 async function apply(route,body){const result=await session.request(route,body);await browserClient.remount();await paint();return result;}
 const dev=Object.freeze({inspect:()=>session.request('dev/inspect'),reveal:async()=>{reveal=!reveal;await paint();},takeover:async()=>{takeover=!takeover;return apply('dev/takeover',{enabled:takeover});},shoot:cell=>apply('dev/shoot',{cell})});Object.defineProperty(window,'__stoneThrowDevelopment',{value:dev,writable:false});
 document.addEventListener('keydown',e=>{if(e.key==='F6'){e.preventDefault();void dev.reveal();}});document.getElementById('playerGrid').addEventListener('click',e=>{if(!takeover)return;const c=e.target.closest('.cell');if(c)void dev.shoot({x:Number(c.dataset.x),y:Number(c.dataset.y)});});
 const bar=document.createElement('aside');bar.style.cssText='position:fixed;bottom:0;left:0;z-index:100000;background:#111;color:white';for(const [label,run]of [['DEV reveal (F6)',dev.reveal],['Enemy takeover',dev.takeover]]){const button=document.createElement('button');button.textContent=label;button.onclick=run;bar.append(button);}document.body.append(bar);
}
