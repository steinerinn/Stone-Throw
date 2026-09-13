// Imported only by the explicit development entry. Never installed by production.
export function installDevelopmentAdapter(session,browserClient){
 if(!session.dev)throw Error('Development capability was not supplied by bootstrap');
 let reveal=false,takeover=false;const marks=new Set();
 function clear(){for(const node of marks)node.remove();marks.clear();}
 async function paint(){clear();if(!reveal)return;const host=await session.dev.inspect(),enemy=host.config.players[1].id;for(const unit of host.state.match.units.filter(u=>u.ownerId===enemy))for(const c of unit.cells){const cell=document.getElementById('enemyGrid')?.children[c.y*host.config.size+c.x];if(!cell)continue;const badge=document.createElement('span');badge.textContent=unit.type;badge.dataset.developmentReveal='true';badge.style.cssText='position:absolute;z-index:20;background:#111;color:#fff;font:9px sans-serif;pointer-events:none';cell.append(badge);marks.add(badge);}}
 async function update(action){const response=await action;await browserClient.remount();await paint();return response;}
 const adapter=Object.freeze({inspect:()=>session.dev.inspect(),checkpoint:()=>session.serializePrivate(),reveal:async()=>{reveal=!reveal;await paint();return reveal;},takeover:async()=>{takeover=!takeover;await update(session.dev.takeover(takeover));return takeover;},shoot:cell=>update(session.dev.shoot(cell)),legacyTools:()=>window.open('StoneThrow-v1.427-stage5-development.html','stone-throw-legacy-development')});
 Object.defineProperty(window,'__stoneThrowDevelopment',{value:adapter,writable:false,configurable:false});
 document.addEventListener('keydown',e=>{if(e.key==='F6'){e.preventDefault();void adapter.reveal();}if(e.key==='F8'){e.preventDefault();adapter.legacyTools();}});
 document.getElementById('playerGrid').addEventListener('click',e=>{if(!takeover)return;const cell=e.target.closest('.cell');if(cell)void adapter.shoot({x:Number(cell.dataset.x),y:Number(cell.dataset.y)});});
 const bar=document.createElement('aside');bar.setAttribute('aria-label','Development tools');bar.style.cssText='position:fixed;bottom:0;left:0;z-index:100000;background:#171717;color:white;padding:4px;font:12px sans-serif';
 for(const [text,action]of [['DEV: Reveal (F6)',adapter.reveal],['Enemy takeover',adapter.takeover],['Legacy Auto Match / Story Auto Resolve (F8)',adapter.legacyTools]]){const b=document.createElement('button');b.textContent=text;b.onclick=action;bar.append(b);}document.body.append(bar);
 // DOM replacement must not silently disable a reveal that the developer enabled.
 const observer=new MutationObserver(()=>{if(reveal&&!document.querySelector('[data-development-reveal]'))void paint();});observer.observe(document.getElementById('enemyGrid'),{childList:true});
 return adapter;
}
