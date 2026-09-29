import {avatarBadges} from './avatar-badges.js';
import {renderReliability} from './reliability-bar.js';
const reliabilityCache=new Map();
function seatReliability(id,host){let entry=reliabilityCache.get(id);if(!entry||Date.now()-entry.time>60000){entry={time:Date.now(),promise:fetch('/api/registry/profile-view',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({playerId:id,section:'reliability'})}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(r=>r.reliability)};reliabilityCache.set(id,entry);}entry.promise.then(r=>{if(host.isConnected)renderReliability(host,r,{vertical:true});}).catch(()=>{host.remove();reliabilityCache.delete(id);});}
// Observer-safe identity/readiness only; never placement contents or credentials.
let overlay,remaining=0,synced=0,identityKey;
function positionPanel(){
 if(!overlay||overlay.hidden)return;
 const middle=document.querySelector('.st-main > .st-left-stack'),grid=document.getElementById('playerGrid'),controls=document.querySelector('.st-center-status');
 if(!middle||!grid||!controls)return;
 const m=middle.getBoundingClientRect(),g=grid.getBoundingClientRect(),c=controls.getBoundingClientRect();
 const left=Math.max(14,m.left),width=Math.min(m.width,innerWidth-left-14),top=(innerWidth<=650?document.querySelector('.st-topbar').getBoundingClientRect().bottom:c.bottom)+6,bottom=g.top-8;
 Object.assign(overlay.style,{left:(left+scrollX)+'px',top:(top+scrollY)+'px',width:width+'px',height:Math.max(180,bottom-top)+'px'});
}
window.addEventListener('resize',positionPanel);
function clock(){const node=overlay?.querySelector('.cs-deployment-clock');if(node)node.textContent=remaining===null?'Waiting for all PLAYER seats':new Date(Math.max(0,remaining-(performance.now()-synced))).toISOString().slice(14,19);}
setInterval(clock,250);
export function paintDeployment(meta,snapshot){
 if(!overlay){overlay=document.createElement('section');overlay.id='csDeployment';overlay.setAttribute('aria-label','Deployment readiness');document.body.append(overlay);const observer=new ResizeObserver(positionPanel);for(const el of [document.querySelector('.st-main > .st-left-stack'),document.querySelector('.st-topbar'),document.getElementById('playerGrid')])if(el)observer.observe(el);}
 overlay.hidden=!meta||snapshot?.phase!=='placement'||meta.closed;
 if(overlay.hidden)return;
 remaining=meta.deployment?.deadline==null?null:Math.max(0,meta.deployment.deadline-meta.deployment.serverNow);synced=performance.now();
 // Keep loaded portraits mounted across clock/readiness/turn updates.
 const nextIdentity=JSON.stringify([meta.code,meta.self,meta.hostSeat,meta.names,meta.controllers,meta.participants?.map(p=>p&&[p.playerId,p.avatar,p.country,p.rewards])]);
 if(identityKey===nextIdentity){for(const row of overlay.querySelectorAll('.cs-deployment-seat')){const ready=!!meta.ready[Number(row.dataset.seat)];row.dataset.ready=String(ready);const label=row.querySelector('.cs-deployment-ready');if(label.textContent!==(ready?'READY':'NOT READY'))label.textContent=ready?'READY':'NOT READY';}clock();positionPanel();return;}
 identityKey=nextIdentity;overlay.replaceChildren();const title=document.createElement('h3');title.textContent='DEPLOYMENT';overlay.append(title);remaining=meta.deployment?.deadline==null?null:Math.max(0,meta.deployment.deadline-meta.deployment.serverNow);synced=performance.now();const timer=document.createElement('p');timer.className='cs-deployment-clock';overlay.append(timer);clock();
 // The room banner is hidden; keep the host's invitation code in the visible staging panel.
 if(meta.self===(meta.hostSeat??0)&&meta.code&&!String(meta.code).startsWith('local-')){
  const invite=document.createElement('div');invite.id='csDeploymentInvite';
  const label=document.createElement('span');label.textContent='GAME CODE: ';
  const code=document.createElement('strong');code.id='csDeploymentCode';code.textContent=meta.code;
  const copy=document.createElement('button');copy.type='button';copy.className='st-btn';copy.textContent='COPY';copy.setAttribute('aria-label','Copy game code');
  copy.onclick=async()=>{try{await navigator.clipboard.writeText(meta.code);copy.textContent='COPIED';}catch{const range=document.createRange();range.selectNodeContents(code);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);copy.textContent='SELECTED';}};
  invite.append(label,code,copy);overlay.append(invite);
 }
 const rows=document.createElement('div');rows.className='cs-deployment-seats';overlay.append(rows);
 for(let i=0;i<meta.names.length;i++){
  if(meta.controllers[i]==='empty')continue;
  const p=meta.participants?.[i],ai=meta.controllers[i]==='ai',waiting=!ai&&!meta.names[i],row=document.createElement('div');row.className='cs-deployment-seat';row.dataset.seat=String(i);row.dataset.ready=String(!!meta.ready[i]);
  if(!waiting&&p?.avatar){const avatar=document.createElement('img');avatar.className='cs-deployment-avatar';avatar.src='/'+p.avatar;avatar.alt='';const portrait=document.createElement('div');portrait.className='cs-deployment-avatar';avatar.className='';portrait.append(avatar);avatarBadges(portrait,p.rewards);row.append(portrait);}else{const placeholder=document.createElement('div');placeholder.className='cs-deployment-placeholder';placeholder.setAttribute('aria-label','Waiting for player');placeholder.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="33" r="19"/><path d="M15 92v-8a35 35 0 0 1 70 0v8z"/></svg>';row.append(placeholder);}
  const identity=document.createElement('div');identity.className='cs-deployment-name';if(p?.playerId&&!ai){identity.dataset.profileId=p.playerId;identity.tabIndex=0;identity.setAttribute('role','button');identity.setAttribute('aria-label','View '+meta.names[i]+' player card');const portrait=row.querySelector('img');if(portrait){portrait.dataset.profileId=p.playerId;portrait.tabIndex=0;portrait.setAttribute('role','button');portrait.setAttribute('aria-label','View '+meta.names[i]+' player card');}}
  if(!ai&&!waiting&&/^[A-Z]{2}$/.test(p?.country||'')){const flag=document.createElement('img');flag.className='cs-deployment-flag';flag.src='/assets/ui/flags/'+p.country.toLowerCase()+'.svg';flag.alt=p.country;identity.append(flag);}
  const name=document.createElement('span');name.textContent=waiting?'Waiting for PLAYER':(meta.names[i]||'PLAYER')+(ai?' (AI)':'');identity.append(name);row.append(identity);
  const ready=document.createElement('strong');ready.className='cs-deployment-ready';ready.textContent=meta.ready[i]?'READY':'NOT READY';row.append(ready);rows.append(row);if(p?.playerId&&!ai&&!waiting&&!String(meta.code||'').startsWith('local-')){row.classList.add('cs-has-reliability');const meter=document.createElement('aside');meter.className='cs-seat-reliability';meter.setAttribute('aria-label','Online player reliability');row.append(meter);seatReliability(p.playerId,meter);}
 }
 positionPanel();
}
