// Observer-safe identity/readiness only; never placement contents or credentials.
let overlay,remaining=0,synced=0;
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
 if(overlay.hidden)return;overlay.replaceChildren();const title=document.createElement('h3');title.textContent='DEPLOYMENT';overlay.append(title);remaining=meta.deployment?.deadline==null?null:Math.max(0,meta.deployment.deadline-meta.deployment.serverNow);synced=performance.now();const timer=document.createElement('p');timer.className='cs-deployment-clock';overlay.append(timer);clock();
 const rows=document.createElement('div');rows.className='cs-deployment-seats';overlay.append(rows);
 for(let i=0;i<meta.names.length;i++){
  if(meta.controllers[i]==='empty')continue;
  const p=meta.participants?.[i],ai=meta.controllers[i]==='ai',waiting=!ai&&!meta.names[i],row=document.createElement('div');row.className='cs-deployment-seat';row.dataset.ready=String(!!meta.ready[i]);
  if(!waiting&&p?.avatar){const avatar=document.createElement('img');avatar.className='cs-deployment-avatar';avatar.src='/'+p.avatar;avatar.alt='';row.append(avatar);}else{const placeholder=document.createElement('div');placeholder.className='cs-deployment-placeholder';placeholder.setAttribute('aria-label','Waiting for player');placeholder.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="33" r="19"/><path d="M15 92v-8a35 35 0 0 1 70 0v8z"/></svg>';row.append(placeholder);}
  const identity=document.createElement('div');identity.className='cs-deployment-name';
  if(!ai&&!waiting&&/^[A-Z]{2}$/.test(p?.country||'')){const flag=document.createElement('img');flag.className='cs-deployment-flag';flag.src='/assets/ui/flags/'+p.country.toLowerCase()+'.svg';flag.alt=p.country;identity.append(flag);}
  const name=document.createElement('span');name.textContent=waiting?'Waiting for PLAYER':(meta.names[i]||'PLAYER')+(ai?' (AI)':'');identity.append(name);row.append(identity);
  const ready=document.createElement('strong');ready.className='cs-deployment-ready';ready.textContent=meta.ready[i]?'READY':'NOT READY';row.append(ready);rows.append(row);
 }
 positionPanel();
}
