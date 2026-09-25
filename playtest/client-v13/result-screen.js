export function scoreLines(score){
 if(!score||!Number.isFinite(score.score))return [];
 const number=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);
 const lines=['MATCH SCORE: '+number(score.score)],c=score.comparison;
 if(c&&c.samples>=5)lines.push(number(Math.abs(c.percent))+'% '+(c.percent<0?'below':'above')+' average for '+c.label);
 return lines;
}
export function participantScoreLines(players=[]){return players.map(p=>p.name+(p.ai?' (AI)':'')+': '+(Number.isFinite(p.matchScore?.score)?new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(p.matchScore.score):'Unavailable'));}
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const labels=['','1ST','2ND','3RD','4TH'];
const artFile=name=>'assets/result-screen/'+name+'.png';
const medalNames=['Lucky Shooter','The Blind One','Eagle Eye','Most Fierce','Chain Master','Purple Death'];
function emblem(name){const n=el('span','cs-medal');const i=medalNames.indexOf(name);n.style.backgroundPosition=`${(i%3)*50}% ${Math.floor(i/3)*100}%`;n.dataset.medal=name;return n;}
export function buildResultScreen(data,{view,rematch,menu}){
 const panel=el('section','cs-results');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Battle results');
 const header=el('header','cs-result-heading');header.append(el('p','cs-result-kicker','CHAIN SIEGE'),el('h1','','BATTLE RESULTS'),el('div','cs-result-rule'));for(const text of scoreLines(data.matchScore))header.append(el('p','cs-match-score',text));panel.append(header);
 const podium=el('div','cs-podium');podium.dataset.count=data.count;
 for(let place=1;place<=data.count;place++){
  const players=data.players.filter(p=>p.placement===place);if(!players.length&&place!==4)continue;
  const station=el('section','cs-place cs-place-'+place);station.dataset.place=place;station.dataset.occupants=players.length;if(players.length>2)station.classList.add('cs-crowded-place');station.style.setProperty('--occupants',Math.max(1,players.length));
  const people=el('div','cs-podium-people');
  for(const p of players){const person=el('div','cs-podium-person');const portrait=el('div','cs-portrait');const image=el('img');image.src=p.avatar;image.alt=p.name;portrait.append(image);person.append(portrait,el('p','cs-podium-name',p.name));const flag=el('div','cs-podium-country');if(p.ai){flag.textContent='(AI)';flag.classList.add('cs-identity-ai');}else if(/^[A-Z]{2}$/.test(p.country||'')){const image=el('img');image.src='assets/ui/flags/'+p.country.toLowerCase()+'.svg';image.alt=p.country;flag.append(image);}person.append(flag);people.append(person);}
  const platform=el('div','cs-platform');const file=place===1?(players.length===1?'1st place solo':'1st place duo'):place===4&&!players.length?'4th place no player':['','','2nd place','3rd place','4th place'][place];
  const art=el('img','cs-platform-art');art.src=artFile(file);art.alt='';art.setAttribute('aria-hidden','true');platform.append(art);station.dataset.platform=file;
  if(players.length)platform.append(el('strong','',labels[place]));else{station.classList.add('cs-empty-fourth');platform.setAttribute('aria-label','Unoccupied wooden platform with rat');}
  station.append(people,platform);if(players.length){const scores=el('div','cs-place-scores');for(const [i,text]of participantScoreLines(players).entries()){const line=el('p','cs-participant-score',text);line.dataset.seat=players[i].seat;scores.append(line);}platform.append(scores);}podium.append(station);
 }
 panel.append(podium);
 if(data.awards.length){const heading=el('h2','cs-award-title','MATCH AWARDS'),awards=el('div','cs-awards');const emblems=['✦','◈','⌖','⚔','⛓','✧'];for(const a of data.awards){const card=el('article','cs-award'),symbol=el('span','cs-award-seal');symbol.append(emblem(a.name));card.dataset.award=a.name;symbol.setAttribute('aria-hidden','true');card.append(symbol,el('h3','',a.name),el('p','cs-award-winner',a.winners.map(i=>data.players.find(p=>p.seat===i)?.name).join(' · ')),el('p','cs-award-value',a.unit==='accuracy'?Math.round(a.value*100)+'% accuracy':a.value+' '+a.unit));awards.append(card);}panel.append(heading,awards);}
 const actions=el('footer','cs-result-actions');for(const [text,fn]of [['VIEW BATTLEFIELD',view],['REMATCH',rematch],['LEAVE MATCH',menu]]){const b=el('button','cs-result-button',text);b.type='button';if(text==='LEAVE MATCH')b.dataset.leaveMatch='1';b.onclick=fn;actions.append(b);}panel.append(actions);return panel;
}
export function mountGroupResult(){
 const css=el('link');css.rel='stylesheet';css.href='/styles-result-screen.css';document.head.append(css);
 let room=null,early=false,final=false,disposed=false,panel=null,timer=null,fade=null,finalData=null;
 const overlay=()=>document.getElementById('resultOverlay');
 function hide(){panel?.remove();panel=null;if(document.body.classList.contains('st-group-results-open'))document.body.classList.remove('st-group-results-open');}
 function reset(){clearTimeout(timer);clearTimeout(fade);hide();room=null;early=false;final=false;finalData=null;overlay()?.classList.remove('cs-result-outro');for(const id of ['playAgainBtn','stLocalResultMenu'])document.getElementById(id).hidden=false;}
 const menuObserver=new MutationObserver(()=>{if(document.body.classList.contains('st-main-menu-mode')){clearTimeout(timer);clearTimeout(fade);hide();overlay()?.classList.remove('cs-result-outro');}});menuObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
 function open(data){if(disposed||document.body.classList.contains('st-main-menu-mode'))return;overlay().style.display='none';overlay().classList.remove('cs-result-outro');hide();panel=buildResultScreen(data,{view:hide,rematch:()=>{hide();document.getElementById('stGroupRematch')?.click();},menu:()=>{hide();window.__stoneThrowLeaveMatch?.({fromResult:true});}});document.body.append(panel);document.body.classList.add('st-group-results-open');panel.querySelector('button')?.focus();}
 const reopen=()=>{if(finalData){clearTimeout(timer);clearTimeout(fade);open(finalData);}};window.addEventListener('cs-open-group-results',reopen);
 const keyboard=e=>{if(!panel)return;if(e.key==='Escape'){e.preventDefault();hide();document.getElementById('stCenterStart')?.focus();}else if(e.key==='Tab'){const buttons=[...panel.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);if(e.shiftKey&&index<=0){e.preventDefault();buttons.at(-1).focus();}else if(!e.shiftKey&&index===buttons.length-1){e.preventDefault();buttons[0].focus();}}};document.addEventListener('keydown',keyboard);
 return {render(s,animating){
  if(!s.online||s.online.originalRing.length<3){if(room)reset();return false;}
  if(s.online.room!==room){reset();room=s.online.room;}
  if(s.phase!=='finished')return false;
  if(animating)return true;
  if(!s.online.complete){if(early)return true;early=true;return false;}
  if(final){if(s.matchScore){finalData=s.groupResult||{...finalData,matchScore:s.matchScore};if(panel)open(finalData);document.getElementById('resultSubtitle').replaceChildren(...scoreLines(s.matchScore).map(text=>el('div','cs-match-score',text)));}return true;}final=true;
  if(!s.groupResult)return true;finalData=s.groupResult;
  if(early){open(finalData);return true;}
  const outcome=s.outcome,art=outcome==='win'?'win':outcome==='draw'?'draw':'lose';
  document.getElementById('resultTitle').textContent=outcome==='win'?'VICTORY':outcome==='draw'?'DRAW':'YOU LOSE';
  document.getElementById('resultArt').src='assets/results/'+art+'.svg';document.getElementById('resultSubtitle').replaceChildren(...scoreLines(s.matchScore).map(text=>el('div','cs-match-score',text)));
  for(const id of ['playAgainBtn','storyRetryBtn','stLocalResultMenu','stLanResultMenu']){const n=document.getElementById(id);if(n)n.hidden=true;}
  document.getElementById('resultCloseBtn').style.display='none';overlay().style.display='flex';
  timer=setTimeout(()=>{overlay().classList.add('cs-result-outro');fade=setTimeout(()=>open(finalData),300);},2400);return true;
 },unmount(){disposed=true;reset();menuObserver.disconnect();document.removeEventListener('keydown',keyboard);window.removeEventListener('cs-open-group-results',reopen);css.remove();}};
}
