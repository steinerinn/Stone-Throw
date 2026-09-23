// Local Group presentation controller. It never calls /pvp or installs heartbeat/rejoin policies.
export function installLocalGroup(session,client){
 const by=id=>document.getElementById(id);let meta=null,snapshot=null,busy=false;const buttons=[];
 function clear(){meta=null;snapshot=null;document.body.classList.remove('st-local-group-mode');for(const b of buttons)b.remove();buttons.length=0;document.querySelectorAll('[data-local-group-name]').forEach(e=>e.remove());}
 const menu=()=>window.__stoneThrowOpenMainMenu?.();
 async function rematch(){if(busy)return;busy=true;try{const opened=await session.request('single/rematch');await client.enterLocal(opened);document.body.classList.remove('st-main-menu-mode');}finally{busy=false;}}
 function observe(u){if(!u.snapshot?.localGroup){if(meta)clear();return;}if(u.localGroup)meta=u.localGroup;snapshot=u.snapshot;if(!meta)return;document.body.classList.add('st-local-group-mode');by('stQuickStart').hidden=false;
  for(const [id,visible] of [['playerGrid',meta.ownBoardVisible],['playerUnitStrip',meta.ownBoardVisible],['enemyGrid',meta.targetBoardVisible],['enemyUnitStrip',meta.targetBoardVisible]]){const e=by(id);e.hidden=!visible;e.style.setProperty('display',visible?'':'none',visible?'':'important');}
  for(const [id,seat]of [['stPlayerGridHost',0],['stEnemyGridHost',snapshot.online?.target]]){let name=by(id+'LocalName');if(!name){name=document.createElement('p');name.id=id+'LocalName';name.className='st-group-board-name';name.dataset.localGroupName='1';by(id).before(name);}name.textContent=seat===null||seat===undefined?'':meta.names[seat]+(snapshot.online?.current===seat?' — CURRENT PLAYER':'');name.hidden=snapshot.phase==='placement'||!name.textContent;}
  const start=by('stCenterStart');if(snapshot.phase==='placement'){start.textContent='START';start.hidden=false;start.disabled=busy||!Object.entries(snapshot.rosters.self).every(([k,n])=>snapshot.owned.filter(u=>u.kind===k).length===n);}else if(meta.complete){start.textContent='RESULTS';start.hidden=false;start.disabled=false;}
  if(!by('stGroupRematch'))for(const [id,fn]of [['stGroupRematch',rematch],['stGroupLeave',menu]]){const b=document.createElement('button');b.id=id;b.hidden=true;b.onclick=fn;document.body.append(b);buttons.push(b);}
 }
 document.addEventListener('click',e=>{if(!meta)return;if(e.target.closest('#playAgainBtn')){e.preventDefault();e.stopImmediatePropagation();void rematch();}else if(e.target.closest('#stCenterStart')&&meta.complete){e.preventDefault();e.stopImmediatePropagation();window.dispatchEvent(new Event('cs-open-group-results'));}},true);
 return {observe,clear};
}
