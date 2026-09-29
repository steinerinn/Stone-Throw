const names=['Lucky Shooter','The Blind One','Eagle Eye','Most Fierce','Chain Master','Purple Death'];
const descriptions=['Longest hit streak in a battle.','Longest miss streak in a battle.','Highest accuracy, with at least 5 shots and 1 hit.','Most units destroyed in a battle.','Largest chain in a battle.','Most Plague cells in a battle.'];
const tiers=[[500,'platinum'],[300,'gold'],[150,'silver'],[50,'bronze']];
export function medalArt(node,index){
 const x=[273,769,1264][index%3],y=index<3?270:734,size=432;
 node.classList.add('cs-simple-medal');node.style.backgroundPosition=`${(x-size/2)/(1536-size)*100}% ${(y-size/2)/(1024-size)*100}%`;
 return node;
}
export function avatarBadges(host,rewards={}){
 host.classList.add('cs-badged-avatar');
 for(const [i,name]of names.entries()){const count=Number(rewards[name]||0),tier=tiers.find(([at])=>count>=at);if(!tier)continue;
 const badge=document.createElement('span'),angle=(-90+i*60)*Math.PI/180;
 badge.className='cs-medal cs-avatar-badge';badge.dataset.tier=tier[1];badge.style.left=(50+45*Math.cos(angle))+'%';badge.style.top=(50+45*Math.sin(angle))+'%';medalArt(badge,i);
 const next=[...tiers].reverse().find(([at])=>count<at),tierName=tier[1][0].toUpperCase()+tier[1].slice(1);
 const info=`${name} - ${tierName}\n${descriptions[i]}\n${next?`${count} / ${next[0]} awards | ${next[0]-count} more to ${next[1][0].toUpperCase()+next[1].slice(1)}`:`${count} awards | Highest tier reached (500+)`}`;
 badge.setAttribute('aria-label',info);badge.setAttribute('role','button');badge.tabIndex=0;
 const detail=document.createElement('div');detail.className='cs-badge-detail';detail.setAttribute('popover','auto');detail.textContent=info;host.append(badge,detail);
 const show=()=>{if(!detail.isConnected)return;if(!detail.matches(':popover-open'))detail.showPopover();const r=badge.getBoundingClientRect();detail.style.left=Math.max(8,Math.min(innerWidth-detail.offsetWidth-8,r.left+r.width/2-detail.offsetWidth/2))+'px';detail.style.top=Math.max(8,Math.min(innerHeight-detail.offsetHeight-8,r.bottom+8))+'px';};
 const hide=()=>{if(detail.matches(':popover-open'))detail.hidePopover();};
 badge.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')show();});badge.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')hide();});badge.addEventListener('focus',show);badge.addEventListener('blur',hide);badge.addEventListener('click',e=>{e.stopPropagation();show();});badge.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();show();}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();hide();}});

 }
 return host;
}
