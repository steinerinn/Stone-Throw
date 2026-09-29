// Follow public presentation targets only on narrow Online battlefields.
let followEnabled=true;try{followEnabled=localStorage.getItem('chainSiege.follow')!=='off';}catch{}
export function mountFollowControl(){
 const button=document.createElement('button');button.id='stFollowAction';button.type='button';button.className='st-btn';button.textContent='FOLLOW';
 const paint=()=>{button.setAttribute('aria-pressed',String(followEnabled));button.title=followEnabled?'Follow battlefield actions':'Scroll battlefields manually';};paint();
 button.onclick=()=>{followEnabled=!followEnabled;try{localStorage.setItem('chainSiege.follow',followEnabled?'on':'off');}catch{}paint();};
 document.getElementById('stHeaderLeave')?.after(button);if(!button.isConnected)document.getElementById('stLocalLeave')?.after(button);
 return ()=>button.remove();
}
let followHeldUntil=0;
export function holdPhoneFollow(ms){followHeldUntil=performance.now()+ms;}
export function followPhoneBattlefield(host){
 if(performance.now()<followHeldUntil)return;
 if(!followEnabled)return;
 if(!host||!matchMedia('(max-width:650px)').matches||!document.body.classList.contains('st-shell-active')||document.body.classList.contains('st-main-menu-mode'))return;
 const r=host.getBoundingClientRect();if(!r.width||!r.height)return;
 const top=Math.max(12,(innerHeight-r.height)/2);
 if(Math.abs(r.top-top)>24)window.scrollTo({top:Math.max(0,scrollY+r.top-top),behavior:'instant'});
}
// Original persistent action presentation, bound only to public pending decisions.
export function mountActionInstructions(onShow=()=>{}){
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
else if(kind==='scout'||kind==='scout-area'){hostSide='player';id='stScoutActionBlast';cls='scout';title=kind==='scout-area'?'AREA SCOUT!':'SCOUTING PHASE!';lines=kind==='scout-area'?['CHOOSE ONE CENTER CELL','SCANS A 3x3 AREA']:[];artType='elf';}
else if(kind==='being-scouted'){hostSide='player';id='stBeingScoutedBlast';cls='scout';title='YOU’RE BEING SCOUTED!';artType='elf';}
else return;
// On phone Online play, keep decision callouts on the visible enemy battlefield.
if(kind!=='being-scouted'&&matchMedia('(max-width:650px)').matches&&document.body.classList.contains('st-shell-active'))hostSide=['hero-any','hero-adjacent','resurrect'].includes(kind)?'player':'enemy';
const host=document.getElementById(hostSide==='player'?'stPlayerGridHost':'stEnemyGridHost');if(!host)return;followPhoneBattlefield(host);const el=stEnsureSalesBlast(id,host,cls);if(!el)return;el.style.visibility='';el.style.opacity='';el.innerHTML=stBlastMarkup(title,lines,artType);stRestartSalesBlast(el);onShow(kind);const expiry=el._expiry=(el._expiry||0)+1;setTimeout(()=>{if(el._expiry!==expiry)return;stHideSalesBlast(el,false);setTimeout(()=>{if(el._expiry===expiry)stHideSalesBlast(el,true);},380);},1600);
}
function clearPersistentActionInstruction(immediate=false){
const old=document.getElementById('stActionInstruction');if(old){old.hidden=true;old.innerHTML='';}
for(const id of ['stCatapultActionBlast','stHeroActionBlast','stResurrectionActionBlast','stScoutActionBlast','stBeingScoutedBlast']){const el=document.getElementById(id);if(!el)continue;if(immediate)stHideSalesBlast(el,true);else{stHideSalesBlast(el,false);setTimeout(()=>{if(el.classList.contains('out'))stHideSalesBlast(el,true);},380);}}
}

return Object.freeze({show:showPersistentActionInstruction,clear:clearPersistentActionInstruction,unmount:()=>{for(const timer of timers)globalThis.clearTimeout(timer);timers.clear();for(const id of ['stCatapultActionBlast','stHeroActionBlast','stResurrectionActionBlast','stScoutActionBlast','stBeingScoutedBlast'])document.getElementById(id)?.remove();}});
}
