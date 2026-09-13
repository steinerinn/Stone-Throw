const STONE_THROW_STORY_PRESENTATION=(()=>{
function cleanStoryHistoryHtml(html){const box=document.createElement('div');box.innerHTML=html||'';box.querySelectorAll('img,button').forEach(n=>n.remove());return box.innerHTML;}
function artUnit(type){return window.__stoneThrowUnitInfoData?.(type)?.art||'';}
function pbGrid(n,classes,art='inf'){
const g=document.createElement('div');g.className='st-pb-grid';g.style.setProperty('--n',n);g.style.setProperty('--art',`url("${artUnit(art)}")`);g.style.setProperty('--cav',`url("${artUnit('cav')}")`);for(let i=0;i<n*n;i++){const c=document.createElement('i');if(classes[i])c.className=classes[i];g.appendChild(c);}return g;}
function lorePunchHtml(data){if(!data?.punch)return '';const kind=data.info?.type==='Core unit'?'core':'special';return '<div class="st-unit-punch '+kind+'"><div class="st-unit-punch-tag">'+data.punch.tag+'</div><div class="st-unit-punch-facts">'+data.punch.facts.map(f=>'<div class="st-unit-punch-fact">'+f+'</div>').join('')+'</div></div>';}
function loreCardHtml(type){const data=window.__stoneThrowUnitInfoData?.(type);if(!data)return '';return '<button class="st-unit-lore-card" type="button" data-unit-lore="'+type+'"><div class="st-unit-info-card"><img class="st-unit-info-art" src="'+data.art+'" alt="'+data.name+' artwork"><div class="st-unit-info-copy"><div class="st-unit-info-name">'+data.name+'</div><div class="st-unit-info-details">'+lorePunchHtml(data)+'</div></div></div></button>';}
return Object.freeze({cleanStoryHistoryHtml,artUnit,pbGrid,lorePunchHtml,loreCardHtml});
})();
