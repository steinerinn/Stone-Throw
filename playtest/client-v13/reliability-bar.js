const el=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text)n.textContent=text;Object.assign(n,attrs);return n;};
export function renderReliability(host,r,{vertical=false}={}){
 host.classList.add("cs-reliability");host.classList.toggle("cs-reliability-vertical",vertical);
 host.replaceChildren();host.append(el('span','ONLINE PLAYER RELIABILITY',{className:'cs-reliability-title'}));
 const track=el('span',null,{className:'cs-reliability-track'}),legend=el('span',null,{className:'cs-reliability-legend'});
 const remaining=r.gamesUntilForgiveness;
 const tips={ok:'Completed games',afk:Number.isInteger(remaining)?`Going AFK lowers reliability. You need ${remaining} more completed online ${remaining===1?'game':'games'} in a row to remove one AFK.`:'Going AFK lowers reliability. Complete 10 online games in a row to remove one AFK.',disconnect:'Disconnecting from an online game lowers reliability'};
 const parts=[['ok','✓','OK',r.distribution?.ok??(r.games?r.effectiveFull/r.games:0)],['afk','zZz','AFK',r.distribution?.afk??(r.games?r.outstandingAFK/r.games:0)],['disconnect','⏻','Disconnected',r.distribution?.disconnect??(r.games?r.Disconnect/r.games:0)]];
 track.setAttribute('role','img');track.setAttribute('aria-label',r.games?parts.map(([, ,label,n])=>label+': '+Math.round(n*100)+' percent').join(', '):'Unrated — no rated online games');
 for(const [key,icon,label,count]of parts){if(!count||!r.games)continue;const part=el('span',null,{className:'cs-reliability-segment '+key});part.style[vertical?'height':'width']=(100*count)+'%';part.title=tips[key];track.append(part);const marker=el('span',vertical?icon:icon+' '+label,{className:'cs-reliability-key '+key});marker.title=tips[key];legend.append(marker);}
 for(const mark of [25,50,75]){const tick=el('span',String(mark),{className:'cs-reliability-tick'});tick.style[vertical?'bottom':'left']=mark+'%';track.append(tick);}
 host.append(track,legend,el('span',r.games?r.games+' rated games'+(r.forgivenAFK?' · '+r.forgivenAFK+' AFK forgiven':''):'No rated online games yet',{className:'cs-reliability-note'}));
}
