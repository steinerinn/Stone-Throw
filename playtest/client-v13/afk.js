import {clockText} from './rejoin.js';
let session,meta=null,renderedKey=null,at=0,pending=false,acknowledged=null,box=null;
export function observeAfk(connection,m,s){
 session=connection;meta=m;at=Date.now();
 if(!m){renderedKey=null;acknowledged=null;}
 else if(s&&m.afk&&s.revision===Number(m.afk.inputKey.split(':')[1]))renderedKey=m.afk.inputKey;
 paint();
}
function paint(){
 const a=meta?.afk,own=!!a&&a.seat===meta?.self,live=!!a?.episode,eligible=a?.voters?.includes(meta?.self);
 if(!box){box=document.createElement('div');box.id='stAfkDialog';box.className='st-mp-overlay';box.hidden=true;box.innerHTML='<section class="st-mp-dialog st-frame" role="dialog"><h2></h2><p role="timer"></p><div class="st-mp-actions"></div><p role="alert"></p></section>';document.body.append(box);}
 box.hidden=!live||(!own&&!eligible)||meta.closed;
 // The warned player must still be able to act on the board underneath.
 box.style.pointerEvents=own?'none':'';
 box.style.background=own?'transparent':'';
 const section=box.querySelector('section');section.setAttribute('aria-modal',own?'false':'true');
 box.classList.toggle('st-afk-own-warning',own);
 if(own){
  const maps=['playerGrid','enemyGrid'].map(id=>document.getElementById(id)?.getBoundingClientRect()).filter(r=>r?.width&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth);
  const left=maps.length?Math.max(0,Math.min(...maps.map(r=>r.left))):0,right=maps.length?Math.min(innerWidth,Math.max(...maps.map(r=>r.right))):innerWidth;
  const top=maps.length?Math.max(0,Math.min(...maps.map(r=>r.top))):0,bottom=maps.length?Math.min(innerHeight,Math.max(...maps.map(r=>r.bottom))):innerHeight;
  const halfWidth=Math.min(580,innerWidth-32)/2,halfHeight=section.getBoundingClientRect().height/2;
  section.style.left=Math.max(halfWidth+16,Math.min(innerWidth-halfWidth-16,(left+right)/2))+'px';
  section.style.top=Math.max(halfHeight+16,Math.min(innerHeight-halfHeight-16,(top+bottom)/2))+'px';
 }else section.removeAttribute('style');
 if(live){box.querySelector('h2').textContent=own?'AFK WARNING - take your turn':(meta.names[a.seat]||'Player')+' is AFK';box.querySelector('[role=timer]').textContent=clockText(Math.max(0,a.remainingMs-(Date.now()-at)))+' until AI takeover';}
 const actions=box.querySelector('.st-mp-actions'),key=live?a.episode+':'+own+':'+a.vote:'';
 if(actions.dataset.key!==key){actions.dataset.key=key;actions.replaceChildren();box.querySelector('[role=alert]').textContent='';if(live&&!own&&!a.vote)for(const action of ['kick','wait']){const b=document.createElement('button');b.className='st-btn';b.textContent=action.toUpperCase();b.onclick=async()=>{if(pending)return;pending=true;try{const u=await session.request('pvp/afk-vote',{episode:a.episode,action});observeAfk(session,u.lan);}catch{box.querySelector('[role=alert]').textContent='The AFK state changed. Please try again.';}finally{pending=false;}};actions.append(b);}else if(a?.vote)actions.textContent=a.vote.toUpperCase()+' selected';}
 const view=window.__stoneThrowViewState?.();
 if(own&&!a.ready&&renderedKey===a.inputKey&&acknowledged!==a.inputKey&&!pending&&view&&!view.inputLocked&&!document.querySelector('.st-mp-newsflash')){
  const key=a.inputKey;acknowledged=key;
  void session.request('pvp/input-ready',{key}).then(u=>{if(!u.lan?.afk?.ready)acknowledged=null;if(meta?.afk?.inputKey===key)observeAfk(session,u.lan);}).catch(()=>{if(acknowledged===key)acknowledged=null;});
 }
}
const timer=setInterval(paint,200);
window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
