// Original persistent action presentation, bound only to public pending decisions.
export function mountActionInstructions(){
const timers=new Set();const setTimeout=(fn,ms)=>{const id=globalThis.setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;};
function stSalesBlastIconMarkup(type){
try{
const selector=`.unit-strip-item[data-unit="${type}"] .unit-strip-icon`;const src=document.querySelector(`#playerUnitStrip ${selector}`)||document.querySelector(`#enemyUnitStrip ${selector}`);if(!src)return '';
const icon=src.cloneNode(true);icon.removeAttribute('id');icon.classList.add('st-sales-icon');icon.classList.remove('core-dead','hero-dead-status','hit','enemy-hidden');return icon.outerHTML;
}catch(e){return '';}
}
function stPositionSalesBlast(el,host){
if(!el||!host)return;const layer=host.closest?.('.st-board-wrap')||host;const hr=host.getBoundingClientRect();const titlePx=Math.max(27,Math.min(46,hr.width*.14));const linePx=Math.max(12,Math.min(18,hr.width*.055));el.style.setProperty('--st-sales-title-size',`${titlePx.toFixed(1)}px`);el.style.setProperty('--st-sales-line-size',`${linePx.toFixed(1)}px`);if(el.parentElement!==layer)layer.appendChild(el);el._stTargetHost=host;if(layer!==host){const lr=layer.getBoundingClientRect();el.classList.add('st-sales-portal');el.style.left=`${hr.left-lr.left}px`;el.style.top=`${hr.top-lr.top}px`;el.style.width=`${hr.width}px`;el.style.height=`${hr.height}px`;el.style.right='auto';el.style.bottom='auto';}else{el.classList.remove('st-sales-portal');el.style.left='0';el.style.top='0';el.style.width='100%';el.style.height='100%';el.style.right='0';el.style.bottom='0';}
}
function stEnsureSalesBlast(id,host,kind){
if(!host)return null;let el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.setAttribute('aria-hidden','true');}el.className=`st-sales-blast ${kind}`;stPositionSalesBlast(el,host);return el;
}
function stRestartSalesBlast(el){
if(!el)return;if(el._stTargetHost)stPositionSalesBlast(el,el._stTargetHost);el.classList.remove('show','out');void el.offsetWidth;el.classList.add('show');
}
function stHideSalesBlast(el,immediate=false){
if(!el)return;if(immediate){el.classList.remove('show','out');el.style.visibility='hidden';el.style.opacity='0';return;}el.classList.remove('show');void el.offsetWidth;el.classList.add('out');
}
function stBlastMarkup(title,lines=[],artType=null){
const icon=artType?stSalesBlastIconMarkup(artType):'';return `<div class="st-sales-title">${title}</div>${lines.map(line=>`<div class="st-sales-line">${line}</div>`).join('')}${icon}`;
}
function showPersistentActionInstruction(kind){
let hostSide='player',id='stActionBlast',cls='hero-action',title='',lines=[],artType=null;if(kind==='catapult'){id='stCatapultActionBlast';cls='catapult';title='<span>CATAPULT</span><span>SHOT!</span>';lines=['SHOOTS UP TO 5 CELLS!','STOPS ON CASTLE WALLS','CHOOSE A TARGET'];artType='catapult';}
else if(kind==='hero-any'){hostSide='enemy';id='stHeroActionBlast';title='MOVE YOUR HERO!';lines=['MOVE TO ANY LOCATION'];artType='hero';}
else if(kind==='hero-adjacent'){hostSide='enemy';id='stHeroActionBlast';title='MOVE YOUR HERO!';lines=['MOVE TO AN ADJACENT CELL'];artType='hero';}
else if(kind==='resurrect'){hostSide='enemy';id='stResurrectionActionBlast';cls='resurrection-action';title='RESURRECTION!';lines=['CHOOSE A UNIT'];artType='cleric';}
else if(kind==='scout'){hostSide='player';id='stScoutActionBlast';cls='scout';title='SCOUTING PHASE!';artType='elf';}
else return;const host=document.getElementById(hostSide==='player'?'stPlayerGridHost':'stEnemyGridHost');if(!host)return;const el=stEnsureSalesBlast(id,host,cls);if(!el)return;el.style.visibility='';el.style.opacity='';el.innerHTML=stBlastMarkup(title,lines,artType);stRestartSalesBlast(el);
}
function clearPersistentActionInstruction(immediate=false){
const old=document.getElementById('stActionInstruction');if(old){old.hidden=true;old.innerHTML='';}
for(const id of ['stCatapultActionBlast','stHeroActionBlast','stResurrectionActionBlast','stScoutActionBlast']){const el=document.getElementById(id);if(!el)continue;if(immediate)stHideSalesBlast(el,true);else{stHideSalesBlast(el,false);setTimeout(()=>{if(el.classList.contains('out'))stHideSalesBlast(el,true);},380);}}
}

return Object.freeze({show:showPersistentActionInstruction,clear:clearPersistentActionInstruction,unmount:()=>{for(const timer of timers)globalThis.clearTimeout(timer);timers.clear();for(const id of ['stCatapultActionBlast','stHeroActionBlast','stResurrectionActionBlast','stScoutActionBlast'])document.getElementById(id)?.remove();}});
}
