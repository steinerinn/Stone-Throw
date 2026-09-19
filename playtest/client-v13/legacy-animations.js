// Legacy visual functions extracted verbatim except cancellation handling and authorized reserved Demon glyph/rotation lookup.
import {logEvent} from './game-log.js';
export function mountLegacyAnimations(size){
 let SIZE=size,disposed=false,battleAsyncEpoch=0;const AUTO_MATCH_MODE=false,DEMON_STEP_MS=200,activeScreenShakes=new Map(),reserved=new Map(),elements=new Set(),animations=new Set();
 let stSalesBlastToken=0;const stSalesBlastTimers=new Map(),phase='play',fastSimulationMode=()=>false;
 const realDocument=globalThis.document,document={querySelector:q=>realDocument.querySelector(q),getElementById:id=>realDocument.getElementById(id),body:{appendChild:e=>{if(!disposed)appendAnchored(e);return e;}},createElement:tag=>{const e=realDocument.createElement(tag);elements.add(e);const remove=e.remove.bind(e);e.remove=()=>{for(const child of e.querySelectorAll("*"))elements.delete(child);elements.delete(e);remove();};const native=e.animate.bind(e);e.animate=(...args)=>{const a=native(...args);animations.add(a);a.finished.catch(()=>{}).finally(()=>animations.delete(a));return a;};return e;}};
 const playerGrid=document.getElementById('playerGrid'),enemyGrid=document.getElementById('enemyGrid');
 // Keep the legacy viewport choreography in a board-anchored coordinate plane.
 // Layout movement transforms the plane, never the animation or gameplay clock.
 let effectSide='enemy';const planes=new Set(),bases=new Map();
 function boardRect(side){const grid=side==='player'?playerGrid:enemyGrid,r=grid.getBoundingClientRect(),host=grid.closest('.st-grid-host'),transform=host?getComputedStyle(host).transform:'none',m=transform==='none'?null:new DOMMatrixReadOnly(transform);return {left:r.left-(m?.m41||0),top:r.top-(m?.m42||0),width:r.width,height:r.height};}
 function basis(side){if(!bases.has(side))bases.set(side,boardRect(side));return bases.get(side);}
 function align(plane){const r=boardRect(plane.side),b=plane.base,sx=r.width/b.width||1,sy=r.height/b.height||1;plane.wrap.style.transform='matrix('+[sx,0,0,sy,r.left-b.left*sx,r.top-b.top*sy].join(',')+')';}
 function syncPlanes(){for(const plane of planes)align(plane);}
 function appendAnchored(e){const wrap=realDocument.createElement('div'),plane={wrap,side:effectSide,base:basis(effectSide)};wrap.dataset.battlefieldEffectPlane=effectSide;wrap.style.cssText='position:fixed;inset:0;pointer-events:none;transform-origin:0 0;';realDocument.body.appendChild(wrap);wrap.appendChild(e);wrap.style.zIndex=getComputedStyle(e).zIndex;planes.add(plane);align(plane);const remove=e.remove.bind(e);e.remove=()=>{remove();planes.delete(plane);wrap.remove();};}
 globalThis.addEventListener('scroll',syncPlanes,{passive:true,capture:true});globalThis.addEventListener('resize',syncPlanes);const layoutObserver=new ResizeObserver(syncPlanes);layoutObserver.observe(playerGrid);layoutObserver.observe(enemyGrid);

 const key=(x,y)=>x+','+y,parseKey=k=>{const [x,y]=k.split(',').map(Number);return {x,y};},inBounds=(x,y)=>x>=0&&y>=0&&x<SIZE&&y<SIZE;
 const battleTokenValid=t=>!disposed&&t===battleAsyncEpoch,sleep=ms=>new Promise(r=>setTimeout(r,disposed?0:ms));
 const DRAGON_FLIGHT_RIGHT='assets/effects/dragon-flight-right.png',DRAGON_FLIGHT_LEFT='assets/effects/dragon-flight-left.png';
function dragonFlightCellCenter(targetSide,k){
const grid=targetSide==='player'?playerGrid:enemyGrid;const {x,y}=parseKey(k);const cell=grid.children[y*SIZE+x];if(!cell) return null;effectSide=targetSide;const r=cell.getBoundingClientRect(),b=basis(targetSide),g=boardRect(targetSide);return {x:b.left+(r.left+r.width/2-g.left)*(b.width/g.width),y:b.top+(r.top+r.height/2-g.top)*(b.height/g.height)};}
function createDragonFlightOverlay(direction,targetSide,startKey){
if(AUTO_MATCH_MODE) return null;const point=dragonFlightCellCenter(targetSide,startKey);if(!point) return null;const wrap=document.createElement('div');wrap.className='dragon-flight-overlay';const img=document.createElement('img');img.alt='';img.draggable=false;img.src=direction==='left' ? DRAGON_FLIGHT_LEFT : DRAGON_FLIGHT_RIGHT;wrap.appendChild(img);wrap.style.left=point.x+'px';wrap.style.top=point.y+'px';document.body.appendChild(wrap);return wrap;}
function startSmoothDragonFlight(wrap,targetSide,path){
if(!wrap || !path.length) return {startedAt:performance.now(),duration:0,done:Promise.resolve()};const start=dragonFlightCellCenter(targetSide,path[0]);const end=dragonFlightCellCenter(targetSide,path[path.length-1]);if(!start || !end) return {startedAt:performance.now(),duration:0,done:Promise.resolve()};const distance=Math.hypot(end.x-start.x,end.y-start.y);const speed=185; // v1.337: slower cinematic flight; breath uses this exact same timeline
const duration=Math.max(340,Math.round((distance/speed)*1000));wrap.style.transition='none';wrap.style.left=start.x+'px';wrap.style.top=start.y+'px';const startedAt=performance.now();const done=new Promise(resolve=>{
requestAnimationFrame(()=>{
requestAnimationFrame(()=>{
wrap.style.transition=`left ${duration}ms linear, top ${duration}ms linear`;wrap.style.left=end.x+'px';wrap.style.top=end.y+'px';setTimeout(resolve,duration);});});});return {startedAt,duration,done};}
async function waitForDragonFlightProgress(flight,index,count){
if(!flight || count<=1) return;const targetElapsed=flight.duration*(index/(count-1));const remaining=targetElapsed-(performance.now()-flight.startedAt);if(remaining>0) await sleep(remaining);}
function spawnDragonBreath(targetSide,k,age=0,holdMs=520){
const p=dragonFlightCellCenter(targetSide,k);if(!p)return;const e=document.createElement('div');e.className='dragon-breath-puff';e.style.left=p.x+'px';e.style.top=p.y+'px';document.body.appendChild(e);const startOpacity=Math.max(.15,1-age*.17);const startScale=Math.max(.66,1.10-age*.07);const life=Math.max(260,holdMs);const an=e.animate([
{offset:0,opacity:startOpacity,transform:`translate(-50%,-50%) scale(${startScale})`},
{offset:.62,opacity:startOpacity*.88,transform:`translate(-50%,-50%) scale(${startScale*1.05})`},
{opacity:0,transform:`translate(-50%,-50%) scale(${startScale*1.16})`}
],{duration:life,easing:'ease-out',fill:'forwards'});an.finished.catch(()=>{}).finally(()=>e.remove());}
function startDragonBreathTimeline(targetSide,path,flight){
const battleToken=battleAsyncEpoch;if(AUTO_MATCH_MODE) return {done:Promise.resolve(),stop(){}};if(!path?.length || !flight) return {done:Promise.resolve()};const points=path.map(k=>dragonFlightCellCenter(targetSide,k)).filter(Boolean);if(!points.length) return {done:Promise.resolve()};const stepMs=path.length>1 ? flight.duration/(path.length-1) : flight.duration;const holdMs=Math.max(220,stepMs*3.7);const spacing=11; // half-cell sampling: visual fire cannot leave a 22px gap
let lastX=null,lastY=null,stopped=false;const done=new Promise(resolve=>{
const start=performance.now();function frame(now){
if(stopped||!battleTokenValid(battleToken)){resolve();return;}
const t=Math.min(1,(now-start)/Math.max(1,flight.duration));const segFloat=t*Math.max(1,points.length-1);const seg=Math.min(points.length-2,Math.floor(segFloat));const local=points.length===1?0:segFloat-seg;const a=points[Math.max(0,seg)],b=points[Math.min(points.length-1,seg+1)];const x=a.x+(b.x-a.x)*local,y=a.y+(b.y-a.y)*local;if(lastX===null){
const e=document.createElement('div');e.className='dragon-breath-puff';e.style.left=x+'px';e.style.top=y+'px';document.body.appendChild(e);const an=e.animate([{opacity:1,transform:'translate(-50%,-50%) scale(1.10)'},{offset:.62,opacity:.88,transform:'translate(-50%,-50%) scale(1.15)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.28)'}],{duration:holdMs,easing:'ease-out',fill:'forwards'});an.finished.catch(()=>{}).finally(()=>e.remove());lastX=x;lastY=y;}else{
const dx=x-lastX,dy=y-lastY,dist=Math.hypot(dx,dy);if(dist>=spacing){
const n=Math.floor(dist/spacing);for(let j=1;j<=n;j++){
const qx=lastX+dx*(j/n),qy=lastY+dy*(j/n);const e=document.createElement('div');e.className='dragon-breath-puff';e.style.left=qx+'px';e.style.top=qy+'px';document.body.appendChild(e);const an=e.animate([{opacity:1,transform:'translate(-50%,-50%) scale(1.10)'},{offset:.62,opacity:.88,transform:'translate(-50%,-50%) scale(1.15)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.28)'}],{duration:holdMs,easing:'ease-out',fill:'forwards'});an.finished.catch(()=>{}).finally(()=>e.remove());}
lastX=x;lastY=y;}
}
if(t<1)requestAnimationFrame(frame);else{setTimeout(resolve,holdMs);return;}
}
requestAnimationFrame(frame);});return {done,stop(){stopped=true}};}
function removeDragonFlightOverlay(wrap){
if(wrap && wrap.isConnected) wrap.remove();}
function archerCellCenter(side,k){ return dragonFlightCellCenter(side,k); }
async function flyArcherArrow(ownerSide,targetSide,originKey,targetKey){
if(AUTO_MATCH_MODE) return;let a=originKey===null?null:archerCellCenter(ownerSide,originKey);const b=archerCellCenter(targetSide,targetKey);if(originKey===null){const r=basis(targetSide);a={x:r.left+r.width+60,y:r.top+r.height/2};}if(!a||!b) return;const arrow=document.createElement('div');arrow.className='archer-arrow-flight';const feather=document.createElement('span');feather.className='archer-arrow-feather';arrow.appendChild(feather);document.body.appendChild(arrow);const dx=b.x-a.x, dy=b.y-a.y;const distance=Math.hypot(dx,dy);const lift=Math.max(105,Math.min(190,distance*.30));const cx=(a.x+b.x)/2;const cy=Math.min(a.y,b.y)-lift;const duration=Math.max(520,Math.min(920,Math.round(distance/520*1000)));const started=performance.now();await new Promise(resolve=>{
function frame(now){
const t=Math.min(1,(now-started)/duration);const u=1-t;const x=u*u*a.x + 2*u*t*cx + t*t*b.x;const y=u*u*a.y + 2*u*t*cy + t*t*b.y;const tx=2*u*(cx-a.x) + 2*t*(b.x-cx);const ty=2*u*(cy-a.y) + 2*t*(b.y-cy);const angle=Math.atan2(ty,tx)*180/Math.PI;arrow.style.left=x+'px';arrow.style.top=y+'px';arrow.style.opacity=t<.06 ? String(t/.06) : '1';arrow.style.transform=`translate(-50%,-50%) rotate(${angle}deg)`;if(t<1) requestAnimationFrame(frame);else resolve();}
requestAnimationFrame(frame);});arrow.remove();}
function goblinCellCenter(targetSide,k){return dragonFlightCellCenter(targetSide,k);}
function launchGoblinBomb(targetSide,startKey,targetKey,index){
if(AUTO_MATCH_MODE) return Promise.resolve(null);const a=goblinCellCenter(targetSide,startKey),b=goblinCellCenter(targetSide,targetKey);if(!a||!b)return Promise.resolve(null);const e=document.createElement('div');e.className='goblin-bomb-flight';e.style.left=a.x+'px';e.style.top=a.y+'px';document.body.appendChild(e);const midX=(a.x+b.x)/2,midY=(a.y+b.y)/2-(58+Math.min(52,Math.hypot(b.x-a.x,b.y-a.y)*.12));const delay=index*48,duration=Math.max(360,610-index*18);return new Promise(resolve=>setTimeout(async()=>{
const an=e.animate([{left:a.x+'px',top:a.y+'px',transform:'translate(-50%,-50%) rotate(0deg)'},
{offset:.5,left:midX+'px',top:midY+'px',transform:'translate(-50%,-50%) rotate(220deg)'},
{left:b.x+'px',top:b.y+'px',transform:'translate(-50%,-50%) rotate(440deg)'}],
{duration,easing:'linear',fill:'forwards'});try{await an.finished}catch(_){}
e.style.left=b.x+'px';e.style.top=b.y+'px';e.style.transform='translate(-50%,-50%) rotate(440deg)';resolve({el:e,key:targetKey});},delay));}
function goblinBombBoom(bomb,targetSide){
if(AUTO_MATCH_MODE) return Promise.resolve();if(!bomb?.el)return Promise.resolve();const p=goblinCellCenter(targetSide,bomb.key),e=document.createElement('div');e.className='goblin-bomb-boom';e.style.left=p.x+'px';e.style.top=p.y+'px';document.body.appendChild(e);bomb.el.remove();return new Promise(async resolve=>{
const an=e.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.25)'},{offset:.12,opacity:1,transform:'translate(-50%,-50%) scale(1.08)'},
{offset:.42,opacity:.88,transform:'translate(-50%,-50%) scale(.95)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.25)'}],
{duration:500,easing:'ease-out',fill:'forwards'});try{await an.finished}catch(_){}e.remove();resolve();});}
function wizardCellCenter(targetSide,k){return dragonFlightCellCenter(targetSide,k);}
function battlefieldShakeHost(targetSide){
return document.getElementById(targetSide==='player'?'stPlayerGridHost':'stEnemyGridHost');}
function screenShake(level='medium',targetSide='enemy',durationOverride=null){
if(AUTO_MATCH_MODE) return;const host=battlefieldShakeHost(targetSide);if(!host || typeof host.animate!=='function') return;const cfg = level==='heavy'
? {d:320,x:8,y:6}
: level==='small'
? {d:105,x:2,y:1}
: level==='dragon'
? {d:78,x:2,y:1.35}
: {d:220,x:4,y:3};let {d,x,y}=cfg;if(level==='dragon' && Number.isFinite(durationOverride) && durationOverride>0){
d=durationOverride;}
try{ activeScreenShakes.get(host)?.cancel(); }catch(_){}
const frames = level==='dragon' ? [
{transform:'translate3d(0,0,0)'},
{transform:`translate3d(${-x}px,${y}px,0)`},
{transform:`translate3d(${x}px,${-y}px,0)`},
{transform:`translate3d(${-x*.55}px,${y*.45}px,0)`},
{transform:`translate3d(${x*.35}px,${-y*.25}px,0)`},
{transform:'translate3d(0,0,0)'}
] : [
{transform:'translate3d(0,0,0)'},
{transform:`translate3d(${-x}px,${y}px,0)`},
{transform:`translate3d(${x}px,${-y}px,0)`},
{transform:`translate3d(${-Math.max(1,Math.round(x*.65))}px,${Math.max(1,Math.round(y*.55))}px,0)`},
{transform:`translate3d(${Math.max(1,Math.round(x*.45))}px,${-Math.max(0,Math.round(y*.35))}px,0)`},
{transform:'translate3d(0,0,0)'}
];const an=host.animate(frames,{duration:d,easing:'linear'});activeScreenShakes.set(host,an);an.finished.catch(()=>{}).finally(()=>{
if(activeScreenShakes.get(host)===an) activeScreenShakes.delete(host);});}
async function wizardMeteorDescent(targetSide,centerKey){
if(AUTO_MATCH_MODE) return;const p=wizardCellCenter(targetSide,centerKey);if(!p)return;const e=document.createElement('div');e.className='wizard-meteor-flight';const sx=p.x-160,sy=p.y-255;e.style.left=sx+'px';e.style.top=sy+'px';document.body.appendChild(e);const an=e.animate([
{left:sx+'px',top:sy+'px',opacity:.12,transform:'translate(-50%,-50%) scale(.48) rotate(-100deg)'},
{offset:.2,opacity:.8,transform:'translate(-50%,-50%) scale(.66) rotate(-25deg)'},
{offset:.72,opacity:1,transform:'translate(-50%,-50%) scale(1.02) rotate(150deg)'},
{left:p.x+'px',top:p.y+'px',opacity:1,transform:'translate(-50%,-50%) scale(1.28) rotate(270deg)'}
],{duration:1250,easing:'cubic-bezier(.38,.04,.80,.94)',fill:'forwards'});try{await an.finished}catch(_){}e.remove();}
function wizardBlastVisual(targetSide,keys,delay,life=1250){
if(AUTO_MATCH_MODE) return Promise.resolve();return new Promise(resolve=>setTimeout(async()=>{
const pts=keys.map(k=>wizardCellCenter(targetSide,k)).filter(Boolean);if(!pts.length){resolve();return;}
const minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y));const e=document.createElement('div');e.className='wizard-blast-layer';e.style.left=(minX+maxX)/2+'px';e.style.top=(minY+maxY)/2+'px';e.style.width=Math.max(62,maxX-minX+68)+'px';e.style.height=Math.max(62,maxY-minY+68)+'px';document.body.appendChild(e);keys.forEach(k=>{const q=parseKey(k),g=targetSide==='player'?playerGrid:enemyGrid,c=g?.children[q.y*SIZE+q.x];if(c)flashCatapultImpact(c);});const an=e.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.2)'},{offset:.1,opacity:1,transform:'translate(-50%,-50%) scale(1.04)'},{offset:.34,opacity:.88,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.2)'}],{duration:life,easing:'ease-out',fill:'forwards'});try{await an.finished}catch(_){}e.remove();resolve();},delay));}
function demonCellCenter(targetSide,k){ return dragonFlightCellCenter(targetSide,k); }
async function demonWhoosh(targetSide,path,runes){
const battleToken=battleAsyncEpoch;if(AUTO_MATCH_MODE) return;if(!path?.length)return;const a=demonCellCenter(targetSide,path[0]),b=demonCellCenter(targetSide,path[path.length-1]);if(!a||!b)return;const e=document.createElement('div');e.className='demon-fire-whoosh';e.style.left=a.x+'px';e.style.top=a.y+'px';document.body.appendChild(e);const ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI,dist=Math.hypot(b.x-a.x,b.y-a.y),d=Math.max(420,Math.round(dist/380*1000));const glyphs=['ᚠ','ᚢ','ᚦ','ᚱ','ᚲ','ᚷ','ᛉ','ᛏ','ᛒ','ᛞ'];const timers=path.map((k,i)=>setTimeout(()=>{if(!battleTokenValid(battleToken)||runes.has(k))return;const p=demonCellCenter(targetSide,k);if(!p)return;const r=document.createElement('div');r.className='demon-rune';r.textContent=reserved.get(k).glyph;r.style.left=p.x+'px';r.style.top=p.y+'px';r.style.rotate=reserved.get(k).rotation+'deg';document.body.appendChild(r);runes.set(k,r)},path.length<=1?0:d*i/(path.length-1)));const an=e.animate([{left:a.x+'px',top:a.y+'px',opacity:.15,transform:`translate(-50%,-50%) rotate(${ang}deg) scale(.72)`},{offset:.1,opacity:1},{offset:.9,opacity:1},{left:b.x+'px',top:b.y+'px',opacity:.15,transform:`translate(-50%,-50%) rotate(${ang+360}deg) scale(1.08)`}],{duration:d,easing:'linear',fill:'forwards'});try{await an.finished}catch(_){}timers.forEach(clearTimeout);e.remove();}
async function demonMegaBlast(targetSide,keys){
if(AUTO_MATCH_MODE) return;const pts=keys.map(k=>demonCellCenter(targetSide,k)).filter(Boolean);if(!pts.length)return;const minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x));const minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y));const e=document.createElement('div');e.className='demon-mega-blast';e.style.left=(minX+maxX)/2+'px';e.style.top=(minY+maxY)/2+'px';e.style.width=Math.max(80,maxX-minX+78)+'px';e.style.height=Math.max(80,maxY-minY+78)+'px';document.body.appendChild(e);const an=e.animate([
{opacity:0,transform:'translate(-50%,-50%) scale(.35)'},
{offset:.12,opacity:1,transform:'translate(-50%,-50%) scale(1.06)'},
{offset:.35,opacity:.9,transform:'translate(-50%,-50%) scale(1)'},
{opacity:0,transform:'translate(-50%,-50%) scale(1.13)'}
],{duration:700,easing:'ease-out',fill:'forwards'});keys.forEach(k=>{const p=parseKey(k),g=targetSide==='player'?playerGrid:enemyGrid,c=g?.children[p.y*SIZE+p.x];if(c)flashCatapultImpact(c);});try{await an.finished}catch(_){} e.remove();}
function catapultFlightCellCenter(targetSide,k){
return dragonFlightCellCenter(targetSide,k);}
function createCatapultRockOverlay(targetSide,k){
if(AUTO_MATCH_MODE) return null;const p=catapultFlightCellCenter(targetSide,k);if(!p) return null;const rock=document.createElement('div');rock.className='catapult-rock-flight';rock.setAttribute('aria-hidden','true');rock.style.left=p.x+'px';rock.style.top=p.y+'px';document.body.appendChild(rock);return rock;}
async function enterCatapultRock(rock,targetSide,k){
if(!rock) return;const p=catapultFlightCellCenter(targetSide,k);if(!p) return;rock.style.left=p.x+'px';rock.style.top=p.y+'px';const anim=rock.animate([
{offset:0,transform:'translate(-50%,-50%) translate(-54px,-86px) rotate(-120deg)'},
{offset:.55,transform:'translate(-50%,-50%) translate(-20px,-30px) rotate(20deg)'},
{offset:1,transform:'translate(-50%,-50%) translate(0,0) rotate(115deg)'}
],{duration:420,easing:'cubic-bezier(.18,.72,.28,1)',fill:'forwards'});try{ await anim.finished; }catch(_){}
rock.style.transform='translate(-50%,-50%) rotate(115deg)';}
async function bounceCatapultRock(rock,targetSide,fromKey,toKey,height=24,duration=260){
if(!rock) return;const a=catapultFlightCellCenter(targetSide,fromKey);const b=catapultFlightCellCenter(targetSide,toKey);if(!a||!b) return;const midX=(a.x+b.x)/2, midY=(a.y+b.y)/2-height;const anim=rock.animate([
{offset:0,left:a.x+'px',top:a.y+'px',transform:'translate(-50%,-50%) rotate(115deg)'},
{offset:.5,left:midX+'px',top:midY+'px',transform:'translate(-50%,-50%) rotate(285deg)',easing:'cubic-bezier(.25,.1,.55,1)'},
{offset:1,left:b.x+'px',top:b.y+'px',transform:'translate(-50%,-50%) rotate(475deg)'}
],{duration,easing:'linear',fill:'forwards'});try{ await anim.finished; }catch(_){}
rock.style.left=b.x+'px';rock.style.top=b.y+'px';rock.style.transform='translate(-50%,-50%) rotate(475deg)';}
async function rollCatapultRock(rock,targetSide,fromKey,toKey){
if(!rock) return;const a=catapultFlightCellCenter(targetSide,fromKey);const b=catapultFlightCellCenter(targetSide,toKey);if(!a||!b) return;const distance=Math.hypot(b.x-a.x,b.y-a.y);const duration=Math.max(95,Math.round(distance/190*1000));const anim=rock.animate([
{left:a.x+'px',top:a.y+'px',transform:'translate(-50%,-50%) rotate(475deg)'},
{left:b.x+'px',top:b.y+'px',transform:'translate(-50%,-50%) rotate(835deg)'}
],{duration,easing:'linear',fill:'forwards'});try{ await anim.finished; }catch(_){}
rock.style.left=b.x+'px';rock.style.top=b.y+'px';rock.style.transform='translate(-50%,-50%) rotate(835deg)';}
function removeCatapultRockOverlay(rock){
if(rock && rock.isConnected) rock.remove();}
function flashCatapultImpact(cell){
if(AUTO_MATCH_MODE) return;if(!cell) return;cell.classList.remove('demon-impact');void cell.offsetWidth;cell.classList.add('demon-impact');setTimeout(()=>cell.classList.remove('demon-impact'),DEMON_STEP_MS);}
function wizardBlastLayersFrom(k){
const {x,y}=parseKey(k);const addLayer=(offsets)=>offsets
.map(([dx,dy])=>[x+dx,y+dy])
.filter(([tx,ty])=>inBounds(tx,ty))
.map(([tx,ty])=>key(tx,ty));if(SIZE<=5){
return [
[key(x,y)],
addLayer([[0,-1],[1,0],[0,1],[-1,0]])
].filter(layer=>layer.length);}
if(SIZE<=10){
return [
[key(x,y)],
addLayer([[0,-1],[1,0],[0,1],[-1,0]]),
addLayer([
[0,-2],[1,-1],[2,0],[1,1],
[0,2],[-1,1],[-2,0],[-1,-1]
])
].filter(layer=>layer.length);}
if(SIZE<=15){
return [
[key(x,y)],
addLayer([
[-1,-1],[0,-1],[1,-1],
[-1,0],         [1,0],
[-1,1],[0,1],[1,1]
]),
addLayer([
[-1,-2],[0,-2],[1,-2],
[-2,-1],              [2,-1],
[-2,0],               [2,0],
[-2,1],               [2,1],
[-1,2],[0,2],[1,2]
])
].filter(layer=>layer.length);}
return [
[key(x,y)],
addLayer([
[-1,-1],[0,-1],[1,-1],
[-1,0],         [1,0],
[-1,1],[0,1],[1,1]
]),
addLayer([
[-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],
[-2,-1],                         [2,-1],
[-2,0],                          [2,0],
[-2,1],                          [2,1],
[-2,2],[-1,2],[0,2],[1,2],[2,2]
]),
addLayer([
[-1,-3],[0,-3],[1,-3],
[-2,-2],              [2,-2],
[-3,-1],              [3,-1],
[-3,0],               [3,0],
[-3,1],               [3,1],
[-2,2],               [2,2],
[-1,3],[0,3],[1,3]
])
].filter(layer=>layer.length);}
function demonPatternFrom(k){
const {x,y}=parseKey(k);const cells=[];for(let cy=0;cy<SIZE;cy++) cells.push(key(x,cy));       // F1 -> F10 first
for(let cx=0;cx<SIZE;cx++){ const kk=key(cx,y); if(kk!==k) cells.push(kk); } // A6 -> J6 next
return cells;}
function dragonFlightPathsFrom(k){
const {x,y}=parseKey(k);const first=[], second=[];let sx=x, sy=y;while(sx>0 && sy>0){ sx--; sy--; }
while(inBounds(sx,sy)){ first.push(key(sx,sy)); sx++; sy++; }
sx=x; sy=y;while(sx<SIZE-1 && sy>0){ sx++; sy--; }
while(inBounds(sx,sy)){
const kk=key(sx,sy);if(kk!==k) second.push(kk); // origin/intersection only once overall
sx--; sy++;}
return [first,second];}
async function flashDemonCell(cell){
if(AUTO_MATCH_MODE) return;cell.classList.remove('demon-impact');void cell.offsetWidth;cell.classList.add('demon-impact');await sleep(DEMON_STEP_MS);cell.classList.remove('demon-impact');}
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
async function showTransientSalesBlast(...args){logEvent('NEWSFLASH QUEUED',{target:args[0],title:args[1]});try{return await showTransientSalesBlastInner(...args);}finally{logEvent('NEWSFLASH END',{target:args[0],title:args[1]});}}
async function showTransientSalesBlastInner(targetSide,title,lines=[],kind='alert',artType=null,holdMs=480,instance=null,timing=null){
if(fastSimulationMode()||phase==='over')return false;const battleToken=battleAsyncEpoch;const host=document.getElementById(targetSide==='player'?'stPlayerGridHost':'stEnemyGridHost');const id=instance||`stTransientSalesBlast-${targetSide}`;const el=stEnsureSalesBlast(id,host,kind);if(!el)return false;const token=++stSalesBlastToken;stSalesBlastTimers.set(id,token);el.style.visibility='';el.style.opacity='';el.innerHTML=stBlastMarkup(title,lines,artType);el.style.animationDuration=timing?timing.enter+'ms':'';stRestartSalesBlast(el);logEvent('NEWSFLASH START',{target:targetSide,title});await sleep((timing?.enter??340)+holdMs);if(!battleTokenValid(battleToken)||stSalesBlastTimers.get(id)!==token){stHideSalesBlast(el,true);return false;}el.style.animationDuration=timing?timing.exit+'ms':'';stHideSalesBlast(el,false);await sleep(timing?.exit??360);if(stSalesBlastTimers.get(id)===token)stHideSalesBlast(el,true);return battleTokenValid(battleToken);
}
function clearTransient(){battleAsyncEpoch++;stSalesBlastTimers.clear();for(const a of animations)a.cancel();for(const a of activeScreenShakes.values())a.cancel();activeScreenShakes.clear();for(const e of [...elements])e.remove();for(const p of planes)p.wrap.remove();planes.clear();bases.clear();for(const grid of [playerGrid,enemyGrid])for(const cell of grid.querySelectorAll(".demon-impact,.catapult-impact"))cell.classList.remove("demon-impact","catapult-impact");}
return {clearTransient,flashDemonCell,showTransientSalesBlast,hideTurn(){stSalesBlastTimers.delete('stYourTurnBlast');stHideSalesBlast(realDocument.getElementById('stYourTurnBlast'),true);},setSize:n=>{SIZE=n;if(!planes.size)bases.clear();},setRunes:r=>{reserved.clear();for(const x of r)reserved.set(key(x.cell.x,x.cell.y),x);},alive:()=>!disposed,dragonFlightCellCenter,createDragonFlightOverlay,startSmoothDragonFlight,waitForDragonFlightProgress,spawnDragonBreath,startDragonBreathTimeline,removeDragonFlightOverlay,archerCellCenter,flyArcherArrow,goblinCellCenter,launchGoblinBomb,goblinBombBoom,wizardCellCenter,battlefieldShakeHost,screenShake,wizardMeteorDescent,wizardBlastVisual,demonCellCenter,demonWhoosh,demonMegaBlast,catapultFlightCellCenter,createCatapultRockOverlay,enterCatapultRock,bounceCatapultRock,rollCatapultRock,removeCatapultRockOverlay,flashCatapultImpact,wizardBlastLayersFrom,demonPatternFrom,dragonFlightPathsFrom,sleep,unmount(){disposed=true;globalThis.removeEventListener('scroll',syncPlanes,true);globalThis.removeEventListener('resize',syncPlanes);layoutObserver.disconnect();for(const p of planes)p.wrap.remove();planes.clear();battleAsyncEpoch++;for(const a of animations)a.cancel();for(const a of activeScreenShakes.values())a.cancel();for(const e of elements)e.remove();}};
}
