
(function(){
const ST_UNIT_INFO_ART = Object.freeze({
inf:'assets/unit-info/inf.png',
cav:'assets/unit-info/cav.png',
archer:'assets/unit-info/archer.png',
castle:'assets/unit-info/castle.png',
monk:'assets/unit-info/monk.png',
hero:'assets/unit-info/hero.png',
catapult:'assets/unit-info/catapult.png',
dwarf:'assets/unit-info/dwarf.png',
elf:'assets/unit-info/elf.png',
goblin:'assets/unit-info/goblin.png',
cleric:'assets/unit-info/cleric.png',
necro:'assets/unit-info/necro.png',
wizard:'assets/unit-info/wizard.png',
demon:'assets/unit-info/demon.png',
dragon:'assets/unit-info/dragon.png'
});const ST_UNIT_INFO_NAMES = Object.freeze({
inf:'Infantry', cav:'Cavalry', archer:'Archer', castle:'Castle', monk:'Monk',
hero:'Hero', catapult:'Catapult', dwarf:'Dwarves', elf:'Elves', goblin:'Goblins',
cleric:'Cleric', necro:'Necromancer', wizard:'Wizard', demon:'Demon', dragon:'Dragon'
});window.__stoneThrowCombatCallout=function(cell,opts){
if(window.__stoneThrowAutoMatchMode || !cell || !opts) return;const box=document.createElement('div');box.className='combat-float';const kind=opts.kind||'unit';if(kind==='target'){
const icon=document.createElement('span'); icon.className='combat-target-icon'; box.appendChild(icon);}else if(kind==='rock'){
const icon=document.createElement('span'); icon.className='combat-rock-icon'; box.appendChild(icon);}else if(kind==='scout'){
const icon=document.createElement('span'); icon.className='combat-scout-icon'; box.appendChild(icon);}else if(kind==='plague'){
const icon=document.createElement('span'); icon.className='combat-plague-icon'; box.appendChild(icon);}else if(kind==='monk-close'){
const icon=document.createElement('span'); icon.className='combat-monk-close-icon'; icon.textContent='?'; box.appendChild(icon);}else if(kind==='resurrection'){
const icon=document.createElement('span'); icon.className='combat-resurrection-icon'; box.appendChild(icon);}else{
let source=opts.source;if(source==='catapult-shot') source='catapult';if(source==='monk-deflect') source='monk';const stripIcon=document.querySelector(`#playerUnitStrip .unit-strip-item[data-unit="${source}"] .unit-strip-icon`);if(stripIcon){
const icon=stripIcon.cloneNode(true);icon.classList.add('combat-unit-icon');icon.removeAttribute('id');box.appendChild(icon);}else{
const art=ST_UNIT_INFO_ART[source];if(art){ const img=document.createElement('img'); img.src=art; img.alt=''; box.appendChild(img); }
}
}
const label=document.createElement('span'); label.textContent=opts.text||''; box.appendChild(label);document.body.appendChild(box);const cellRect=cell.getBoundingClientRect();const host=cell.closest('.st-grid-host');const hostRect=host?host.getBoundingClientRect():cellRect;const w=box.offsetWidth;const margin=6;const minCenter=hostRect.left+margin+w/2;const maxCenter=hostRect.right-margin-w/2;let center=cellRect.left+cellRect.width/2;if(minCenter<=maxCenter) center=Math.max(minCenter,Math.min(maxCenter,center));else center=(hostRect.left+hostRect.right)/2;let top=cellRect.top+2;top=Math.max(hostRect.top+margin,Math.min(hostRect.bottom-margin-box.offsetHeight,top));box.style.left=center+'px';box.style.top=top+'px';setTimeout(()=>box.remove(),1600);};function renderBattleStats(stats){
if(!stats) return;const set=(id,v)=>{const el=document.getElementById(id);if(el) el.textContent=v;};const duel=(a,b,youId,enemyId)=>{
const total=(Number(a)||0)+(Number(b)||0), yp=total?100*(Number(a)||0)/total:50;const y=document.getElementById(youId),e=document.getElementById(enemyId);if(y)y.style.width=yp.toFixed(1)+'%'; if(e)e.style.width=(100-yp).toFixed(1)+'%';};set('stStatShotsYou',stats.playerShots||0); set('stStatShotsEnemy',stats.enemyShots||0);set('stStatUnitsYou',stats.playerUnitsDestroyed||0); set('stStatUnitsEnemy',stats.enemyUnitsDestroyed||0);set('stStatCoreYou',stats.playerCoreDestroyed||0); set('stStatCoreEnemy',stats.enemyCoreDestroyed||0);set('stStatCellsYou',stats.playerCells||0); set('stStatCellsEnemy',stats.enemyCells||0);set('stStatBiggestYou',stats.playerBiggestAttack||0); set('stStatBiggestEnemy',stats.enemyBiggestAttack||0);duel(stats.playerShots,stats.enemyShots,'stBarShotsYou','stBarShotsEnemy');duel(stats.playerUnitsDestroyed,stats.enemyUnitsDestroyed,'stBarUnitsYou','stBarUnitsEnemy');duel(stats.playerCoreDestroyed,stats.enemyCoreDestroyed,'stBarCoreYou','stBarCoreEnemy');duel(stats.playerCells,stats.enemyCells,'stBarCellsYou','stBarCellsEnemy');duel(stats.playerBiggestAttack,stats.enemyBiggestAttack,'stBarBiggestYou','stBarBiggestEnemy');const svg=document.getElementById('stImpactSvg'); if(!svg) return;const rows=stats.strength||[];const W=220,H=142,left=22,right=7,top=8,bottom=18;const maxRound=Math.max(1,...rows.map(r=>r.round||1));const ownRows=[...new Map(rows.map(r=>[r.round,r])).values()];const maxStrength=Math.max(1,...ownRows.map(r=>r.player||0),...rows.filter(r=>r.enemy!==null).map(r=>r.enemy||0));const yMax=Math.max(5,Math.ceil(maxStrength/5)*5);const x=r=>left+((r-1)/Math.max(1,maxRound-1))*(W-left-right);const y=v=>H-bottom-(v/yMax)*(H-top-bottom);const segments=[];let segment=[];for(const r of rows){if(r.enemy===null){if(segment.length)segments.push(segment);segment=[];}else segment.push(r);}if(segment.length)segments.push(segment);const enemySvg=segments.map(seg=>'<polyline class="st-impact-enemy" points="'+seg.map(r=>x(r.round).toFixed(1)+','+y(r.enemy||0).toFixed(1)).join(' ')+'"/>').join('');const enemyDot=last=>last.enemy===null?'':'<circle class="st-impact-dot-enemy" cx="'+x(last.round)+'" cy="'+y(last.enemy||0)+'" r="2.4"/>';const pts=key=>(key==='player'?ownRows:rows).map(r=>`${x(r.round).toFixed(1)},${y(r[key]||0).toFixed(1)}`).join(' ');let html='';for(let i=0;i<=4;i++){
const val=Math.round(yMax*(4-i)/4),gy=top+i*(H-top-bottom)/4;html+=`<line class="st-impact-grid" x1="${left}" y1="${gy.toFixed(1)}" x2="${W-right}" y2="${gy.toFixed(1)}"/><text class="st-impact-label" x="2" y="${(gy+3).toFixed(1)}">${val}</text>`;}
html+=`<line class="st-impact-axis" x1="${left}" y1="${H-bottom}" x2="${W-right}" y2="${H-bottom}"/>`;if(rows.length){
html+=`<polyline class="st-impact-you" points="${pts('player')}"/>${enemySvg}`;const last=rows[rows.length-1];html+=`<circle class="st-impact-dot-you" cx="${x(last.round)}" cy="${y(last.player||0)}" r="2.4"/>${enemyDot(last)}`;html+=`<text class="st-impact-label" x="${left}" y="${H-4}">R1</text><text class="st-impact-label" text-anchor="end" x="${W-right}" y="${H-4}">R${maxRound}</text>`;}
svg.innerHTML=html;}
function initStoneThrowShell(){
document.body.classList.add('st-shell-active');
const stMainLayout=document.querySelector('.st-main');
const stCenterStack=stMainLayout?.querySelector(':scope > .st-left-stack');
const stRightSide=stMainLayout?.querySelector(':scope > .st-side');
const stEventsPanel=stCenterStack?.querySelector('.st-events');
const stStrengthPanel=stRightSide?.querySelector('.st-battle-stats');
if(stMainLayout&&stCenterStack&&stRightSide&&!stMainLayout.querySelector(':scope > .st-side-left')){
  const stLeftSide=document.createElement('aside');
  stLeftSide.className='st-side st-side-left st-frame';
  stMainLayout.insertBefore(stLeftSide,stCenterStack);
  if(stStrengthPanel) stLeftSide.appendChild(stStrengthPanel);
  if(stEventsPanel) stLeftSide.appendChild(stEventsPanel);
  stRightSide.classList.add('st-side-right');
}
const pGrid=document.getElementById('playerGrid');const eGrid=document.getElementById('enemyGrid');const pHost=document.getElementById('stPlayerGridHost');const eHost=document.getElementById('stEnemyGridHost');if(pGrid&&pHost) pHost.appendChild(pGrid);if(eGrid&&eHost) eHost.appendChild(eGrid);function mountLiveUnitStrip(hostId,stripId){
const host=document.getElementById(hostId);const strip=document.getElementById(stripId);if(!host || !strip) return;host.innerHTML='';host.appendChild(strip);}
mountLiveUnitStrip('stPlayerRoster','playerUnitStrip');mountLiveUnitStrip('stEnemyRoster','enemyUnitStrip');const hover=document.getElementById('stHoverCard');if(hover) hover.style.display='none';const unitInfoImage=document.getElementById('stUnitInfoImage');const unitInfoName=document.getElementById('stUnitInfoName');const unitInfoHint=document.getElementById('stUnitInfoHint');const unitInfoDetails=document.getElementById('stUnitInfoDetails');const ST_UNIT_INFO_TEXT=Object.freeze({
inf:{type:'Core unit',victory:'Required for victory.',ability:'None.'},
cav:{type:'Core unit',victory:'Required for victory. Unit size 2×1, rotatable.',ability:'Both cells must be destroyed.'},
archer:{type:'Core unit',victory:'Required for victory.',ability:'When hit, fires 0–9 arrows back at the enemy.',weakness:'Special ability is disabled if killed by Plague.'},
castle:{type:'Core unit',victory:'Required for victory. Total size: 5 linked cells.',ability:'Stops a rolling Catapult shot.'},
monk:{type:'Core unit',victory:'Required for victory.',ability:'Can deflect attacks that land next to him. An opposing Monk can turn the deflections into a Monk duel.',weakness:'Special ability is disabled if killed by Plague.'},
hero:{type:'Special unit',victory:'Almost optional: not required at first, but becomes a required core unit after the first hit.',custom:'hero',weakness:'Plague kills the Hero instantly.'},
catapult:{type:'Special unit',victory:'Not required for victory.',ability:'When hit, grants its owner a rolling Catapult shot that can strike up to 5 cells.',weakness:'Special ability is disabled if killed by Plague. The rolling shot stops if it hits a Castle wall.',rock:true},
dwarf:{type:'Special unit',victory:'Not required for victory.',ability:'When hit, grants its owner 5 extra shots next turn.',weakness:'Special ability is disabled if killed by Plague.'},
elf:{type:'Special unit',victory:'Not required for victory.',ability:'When hit, allows its owner to scout 5 enemy cells.',weakness:'Special ability is disabled if killed by Plague.'},
goblin:{type:'Special unit',victory:'Not required for victory.',ability:'When hit, throws 5–10 bombs onto random enemy cells.',weakness:'Special ability is disabled if killed by Plague.'},
cleric:{type:'Special unit',victory:'Not required for victory.',abilityLines:['Keeps the Plague away while alive.','When destroyed, allows its owner to resurrect one destroyed core unit.']},
necro:{type:'Special unit',victory:'Not required for victory.',ability:'The Necromancers can release Plague after both are shot. If an opposing Cleric is holding it back, hitting that Cleric can release the held Plague.',weakness:'A living opposing Cleric can hold the Plague back.'},
wizard:{type:'Special unit',victory:'Not required for victory.',custom:'wizard',ability:'When hit, sends a huge meteor onto the enemy battlefield.',weakness:'Special ability is disabled if killed by Plague.'},
demon:{type:'Special unit',victory:'Not required for victory.',custom:'demon',ability:'When hit, retaliates across its entire row and column.',weakness:'Immune to the Plague.'},
dragon:{type:'Special unit',victory:'Not required for victory.',custom:'dragon',ability:'When hit, retaliates along both diagonals from its position.',weakness:'Immune to the Plague.'}
});const ST_UNIT_PUNCH=Object.freeze({
inf:{tag:'CORE UNIT — MUST KILL',facts:[]},
archer:{tag:'CORE UNIT — MUST KILL',facts:['SHOOTS 0–9 ARROWS WHEN HIT']},
cav:{tag:'CORE UNIT — MUST KILL',facts:['2 CELLS!']},
castle:{tag:'CORE UNIT — MUST KILL',facts:['5 CELLS!','STOPS CATAPULT SHOTS']},
monk:{tag:'CORE UNIT — MUST KILL',facts:['CAN DEFLECT ATTACKS','DISLIKES OTHER MONKS']},
catapult:{tag:'SPECIAL UNIT — KILL OPTIONAL',facts:['SHOOTS UP TO 5 CELLS!','STOPS ON CASTLE WALLS']},
dwarf:{tag:'SPECIAL UNIT — KILL OPTIONAL',facts:['GIVES OWNER +5 SHOTS']},
elf:{tag:'SPECIAL UNIT — KILL OPTIONAL',facts:['SCOUTS 5 CELLS']},
goblin:{tag:'SPECIAL UNIT — KILL OPTIONAL',facts:['THROWS 5–10 BOMBS ON ENEMY']},
necro:{tag:'SPECIAL UNIT — KILL OPTIONAL',facts:['WILL RELEASE PLAGUE IF...','BOTH NECRO SHOT','OPPOSING CLERIC IS HIT']},
cleric:{tag:'SPECIAL UNIT — KILL OPTIONAL',facts:['KEEPS THE PLAGUE AWAY','RESURRECTS A UNIT']},
dragon:{tag:'SPECIAL UNIT — KILL OPTIONAL',facts:['CAN DESTROY ALL DIAGONAL CELLS','IMMUNE TO THE PLAGUE']},
demon:{tag:'SPECIAL UNIT — KILL OPTIONAL',facts:['CAN DESTROY ENTIRE ROW AND COLUMN','IMMUNE TO THE PLAGUE']},
wizard:{tag:'SPECIAL UNIT — KILL OPTIONAL',facts:['SENDS A HUGE METEOR ON THE ENEMY']},
hero:{tag:'VERY SPECIAL UNIT — KILL ALMOST OPTIONAL',facts:['BECOMES A CORE UNIT IF HIT','1ST HIT — TELEPORTS AWAY','2ND HIT — MOVES ONE CELL','3RD HIT — DIES','PLAGUE KILLS HIM INSTANTLY']}
});

window.__stoneThrowUnitInfoData=function(type){
const info=ST_UNIT_INFO_TEXT[type];const art=ST_UNIT_INFO_ART[type];if(!info||!art) return null;const punch=ST_UNIT_PUNCH[type]||null;return {name:ST_UNIT_INFO_NAMES[type]||'Unit',art,info:{...info},punch:punch?{tag:punch.tag,facts:[...punch.facts]}:null};};const ST_TUTORIAL_COPY=Object.freeze({
inf:{lead:'Infantry is a core unit. Every living core unit must be destroyed to win the battle.',body:['Infantry is the simplest core unit: one cell, no special retaliation, and no escape trick.','Simple does not mean unimportant. If even one Infantry survives, the battle is not over.']},
cav:{lead:'Cavalry is a two-cell core unit. Both linked cells must be destroyed to eliminate it.',body:['The first hit tells you that a larger core unit is there, but one surviving cell keeps the Cavalry alive.','Finish both cells before moving on if you want the core unit gone for good.']},
archer:{lead:'The Archer is a core unit — and hitting one can provoke an immediate volley of 0–9 arrows.',body:['The retaliation is unpredictable: sometimes no arrows fly, and sometimes a large volley starts a chain reaction across the battlefield.','The Archer must still be destroyed because it is a core unit.']},
castle:{lead:'The Castle is a five-cell core unit. All five cells must be destroyed before the fortress falls.',body:['The first enemy Castle hit remains unidentified. The second hit on that same Castle reveals the fortress.','Castle walls stop a rolling Catapult shot, so the shape of the fortress can matter long before all five cells are destroyed.']},
monk:{lead:'The Monk is a core unit that can deflect attacks landing next to him.',body:['A near miss can reveal possible Monk locations and send the attack back toward the enemy.','When opposing Monks discover each other, their deflections can turn into a Monk duel. The Monk is a core unit and must be destroyed to win.']},
catapult:{lead:'The Catapult is a special unit. It is not required for victory — but hitting it gives its owner a dangerous counterattack.',body:['When a Catapult is hit, its owner earns a rolling shot that can strike up to five cells.','The stone keeps moving through unshot cells until the run ends or a Castle wall stops it.']},
dwarf:{lead:'The Dwarves are a special unit. Hitting them gives their owner 5 extra shots.',body:['You do not need to destroy the Dwarves to win. Their retaliation can turn a harmless-looking hit into a very expensive next turn.','If Plague kills the Dwarves, their retaliation does not trigger.']},
elf:{lead:'The Elves are a special unit. Hitting them lets their owner scout 5 enemy cells.',body:['Scouting reveals useful battlefield information without spending normal shots, and the knowledge remains marked on the board.','The Elves are optional to kill, so sometimes leaving them alone is safer.']},
goblin:{lead:'The Goblins are a special unit. Hitting them makes them throw 5–10 bombs onto the enemy battlefield.',body:['The bombs land on random unshot cells and can trigger additional special units.','You do not need to destroy the Goblins to win, and Plague can kill them before their bombing retaliation triggers.']},
necro:{lead:'Necromancers are special units. Their deaths can unleash the Plague.',body:['When both Necromancers are shot, the Plague is ready to break loose. A living opposing Cleric can hold it back.','If that opposing Cleric is then hit, the held Plague can be released. Necromancers themselves are not required for victory.']},
cleric:{lead:'The Cleric is a special unit that keeps the Plague away while alive and can resurrect a fallen core unit when destroyed.',body:['A living Cleric can hold back Plague prepared by enemy Necromancers.','When destroyed, the Cleric can resurrect one destroyed Infantry, Cavalry, Archer or Monk. That unit becomes a living core unit again and must be found again.']},
dragon:{lead:'The Dragon is a special unit. Hitting it unleashes a diagonal attack across the battlefield.',body:['The Dragon can strike along both diagonals from its position and can trigger further reactions.','The Dragon is optional to kill and is immune to the Plague.']},
demon:{lead:'The Demon is a special unit. Hitting it destroys cells across its entire row and column.',body:['Its cross-shaped retaliation can wake up several other units at once and create a large chain reaction.','The Demon is optional to kill and is immune to the Plague.']},
wizard:{lead:'The Wizard is a special unit. Hitting it sends a huge meteor onto the enemy battlefield.',body:['The meteor devastates a large area and can trigger further chain reactions.','The Wizard is not required for victory, but a badly placed Wizard can waste much of its potential attack.']},
hero:{lead:'The Hero is almost optional: he begins as a special unit, but the first hit turns him into a core unit.',body:['First hit: the Hero teleports to any legal location and becomes a core unit. Second hit: he may move only one adjacent cell. Third hit: he dies.','Once activated, the Hero must be destroyed before the battle can be won. Plague kills him instantly.']}
});window.__stoneThrowTutorialData=function(type){const base=window.__stoneThrowUnitInfoData?.(type),copy=ST_TUTORIAL_COPY[type];if(!base||!copy)return null;return {name:base.name,art:base.art,type:base.info.type,punch:base.punch,lead:copy.lead,body:[...copy.body]};};function unitInfoHeroHtml(){
return '<div class="st-hero-info-states">'+
'<div class="st-hero-info-row"><span class="st-hero-state start"></span><div><b>Hero starting location</b><br>When first hit, the Hero teleports to any free, unshot cell.</div></div>'+
'<div class="st-hero-info-row"><span class="st-hero-state active"></span><div><b>Hero activated</b><br>The Hero is now a core unit and grants its owner 1 extra shot per turn.</div></div>'+
'<div class="st-hero-info-row"><span class="st-hero-state hit"></span><div><b>Hero hit again</b><br>The Hero must move to a free adjacent cell. If no such cell is available, the Hero dies.</div></div>'+
'<div class="st-hero-info-row"><span class="st-hero-state dead"></span><div><b>Hero destroyed</b><br>The third hit destroys the Hero.</div></div>'+
'</div>';}
function unitInfoWizardRangeHtml(){
let cells='';for(let y=0;y<5;y++) for(let x=0;x<5;x++){
const corner=(x===0||x===4)&&(y===0||y===4);const center=x===2&&y===2;cells+='<span class="st-wizard-range-cell '+(corner?'off':center?'wizard':'blast')+'"></span>';}
return '<div class="st-wizard-range-wrap"><div class="st-wizard-range-title">Blast range</div><div class="st-wizard-range-grid">'+cells+'</div></div>';}
function unitInfoDragonRangeHtml(){
let cells='';for(let y=0;y<5;y++) for(let x=0;x<5;x++){
const center=x===2&&y===2;const firstDiagonal=Math.abs(x-2)===1&&Math.abs(y-2)===1;cells+='<span class="st-dragon-range-cell '+(center?'dragon':firstDiagonal?'path':'')+'"></span>';}
return '<div class="st-dragon-range-wrap"><div class="st-dragon-range-title">Attack direction</div><div class="st-dragon-range-grid">'+cells+'<span class="st-dragon-arrow nw"></span><span class="st-dragon-arrow ne"></span><span class="st-dragon-arrow sw"></span><span class="st-dragon-arrow se"></span></div></div>';}
function unitInfoDemonRangeHtml(){
let cells='';for(let y=0;y<5;y++) for(let x=0;x<5;x++){
const center=x===2&&y===2;const firstCardinal=(Math.abs(x-2)===1&&y===2)||(Math.abs(y-2)===1&&x===2);cells+='<span class="st-demon-range-cell '+(center?'demon':firstCardinal?'path':'')+'"></span>';}
return '<div class="st-demon-range-wrap"><div class="st-demon-range-title">Attack direction</div><div class="st-demon-range-grid">'+cells+'<span class="st-demon-arrow n"></span><span class="st-demon-arrow e"></span><span class="st-demon-arrow s"></span><span class="st-demon-arrow w"></span></div></div>';}
function showUnitInformation(type){
const art=ST_UNIT_INFO_ART[type];if(!art) return;const name=ST_UNIT_INFO_NAMES[type]||'Unit';if(unitInfoImage){ unitInfoImage.src=art; unitInfoImage.alt=name+' artwork'; }
if(unitInfoName) unitInfoName.textContent=name;const info=ST_UNIT_INFO_TEXT[type];if(unitInfoHint) unitInfoHint.hidden=!!info;if(unitInfoDetails){
if(info){
unitInfoDetails.hidden=false;const typeClass=info.type==='Core unit'?'core':'special';let html='<div class="st-unit-info-type '+typeClass+'">'+info.type+'</div>'+
'<div class="st-unit-info-victory">'+info.victory+'</div>';if(info.custom==='hero'){
html+=unitInfoHeroHtml();}else{
html+='<div class="st-unit-info-label special">Special ability:'+(info.rock?'<span class="st-catapult-rock" aria-hidden="true"></span>':'')+'</div>';if(info.abilityLines){
html+='<div class="st-unit-info-ability">'+info.abilityLines.map(line=>'<div class="st-unit-info-ability-line">'+line+'</div>').join('')+'</div>';}else{
html+='<div class="st-unit-info-ability">'+(info.ability||'None.')+'</div>';}
if(info.custom==='wizard') html+=unitInfoWizardRangeHtml();if(info.custom==='dragon') html+=unitInfoDragonRangeHtml();if(info.custom==='demon') html+=unitInfoDemonRangeHtml();}
if(info.weakness){
html+='<div class="st-unit-info-label weakness">Weakness:</div><div class="st-unit-info-ability">'+info.weakness+'</div>';}
unitInfoDetails.innerHTML=html;}else{
unitInfoDetails.hidden=true;unitInfoDetails.innerHTML='';}
}
}
showUnitInformation('inf');function unitTypeAtKey(side,k){
if(side==='player'){
if(playerArcherKeys.includes(k)) return 'archer';if(k===monkKey) return 'monk';for(const info of playerCastles.values()) if(info.cells&&info.cells.has(k)) return 'castle';if(cellToCav.has(k)) return 'cav';if(k===dwarfKey) return 'dwarf'; if(k===goblinKey) return 'goblin';if(playerCatapultKeys.includes(k)) return 'catapult'; if(k===elfKey) return 'elf';if(k===clericKey) return 'cleric'; if(k===demonKey) return 'demon'; if(k===dragonKey) return 'dragon';if(k===wizardKey) return 'wizard'; if(playerNecroKeys.includes(k)) return 'necro'; if(k===heroKey) return 'hero';if(playerUnits.has(k)) return 'inf';}else{
if(enemyArcherKeys.includes(k)) return 'archer'; if(k===enemyMonkKey) return 'monk';for(const info of enemyCastles.values()) if(info.cells&&info.cells.has(k)) return 'castle';if(enemyCellToCav.has(k)) return 'cav'; if(k===enemyDwarfKey) return 'dwarf'; if(k===enemyGoblinKey) return 'goblin';if(enemyCatapultKeys.includes(k)) return 'catapult'; if(k===enemyElfKey) return 'elf'; if(k===enemyClericKey) return 'cleric';if(k===enemyDemonKey) return 'demon'; if(k===enemyDragonKey) return 'dragon'; if(k===enemyWizardKey) return 'wizard';if(enemyNecroKeys.includes(k)) return 'necro'; if(k===enemyHeroKey) return 'hero'; if(enemyInfKeys.has(k)) return 'inf';}
return null;}


document.addEventListener('mousemove',e=>{
const u=e.target.closest&&e.target.closest('.unit-strip-item');if(u && u.closest('#playerUnitStrip')) showUnitInformation(u.dataset.unit);});function visualPlayerUnitType(cell){
if(!cell) return null;const classes=[
['archer-cell','archer'],
['castle-cell','castle'],
['cav-cell','cav'],
['monk-cell','monk'],
['hero-cell','hero'],
['catapult-cell','catapult'],
['dwarf-cell','dwarf'],
['elf-cell','elf'],
['goblin-cell','goblin'],
['cleric-cell','cleric'],
['necro-cell','necro'],
['wizard-cell','wizard'],
['demon-cell','demon'],
['dragon-cell','dragon'],
['infantry-cell','inf']
];for(const [cls,type] of classes) if(cell.classList.contains(cls)) return type;return null;}
if(playerGrid){
playerGrid.addEventListener('mousemove',e=>{
const cell=e.target.closest&&e.target.closest('.cell');if(!cell || !playerGrid.contains(cell)) return;const x=Number(cell.dataset.x), y=Number(cell.dataset.y);if(!Number.isInteger(x)||!Number.isInteger(y)) return;const type=visualPlayerUnitType(cell);if(type) showUnitInformation(type);});}
const ST_LEGEND_HELP=Object.freeze({
'Missed':'This cell has already been shot. Nothing was hit, and it cannot be shot again.',
'Ruled out':'This cell cannot contain an enemy unit. Shooting here would waste a shot.',
'Hit':'A unit has been hit on this cell.',
'Core unit':'A core unit cell. All core units must be destroyed to win. Note that the Hero becomes a core unit after being hit once.',
'Destroyed core unit':'Cell background becomes red when a core unit is hit.',
'Unidentified core unit':'Keep shooting to reveal its true identity.',
'Possible Monk':'This cell may contain the enemy Monk. Beware — if you miss, he might fight back.',
'Scouted unknown unit':'A scouted cell containing an unidentified unit.',
'Scouting phase':'Select five cells to scout.',
'Resurrected':'A unit resurrected by a Cleric. On the enemy map, this marks a unit that may have been resurrected.',
'Resurrection phase':'Units with a pulsing cross can be resurrected. Click a unit to resurrect it.',
'Plague':'Plague has spread to this cell. It can be released when both Necromancers are destroyed and no living opposing Cleric remains to contain it.'
});const legendTooltip=document.getElementById('stLegendTooltip');document.querySelectorAll('.st-legend-row').forEach(row=>{
const label=row.querySelector('span')?.textContent?.trim();const text=ST_LEGEND_HELP[label]; if(!text||!legendTooltip) return;row.tabIndex=0;const openTip=(e)=>{
legendTooltip.textContent=text; legendTooltip.classList.add('open');const r=row.getBoundingClientRect();const left=Math.min(window.innerWidth-276,Math.max(8,r.left));const top=Math.min(window.innerHeight-80,Math.max(8,r.bottom+6));legendTooltip.style.left=left+'px'; legendTooltip.style.top=top+'px';};const closeTip=()=>legendTooltip.classList.remove('open');row.addEventListener('mouseenter',openTip); row.addEventListener('mouseleave',closeTip);row.addEventListener('focus',openTip); row.addEventListener('blur',closeTip);});const gear=document.getElementById('stGear'), settings=document.getElementById('stSettings');if(gear&&settings) gear.addEventListener('click',(e)=>{
e.stopPropagation();settings.classList.remove('st-menu-settings');settings.classList.toggle('open');});if(settings) settings.addEventListener('click',e=>e.stopPropagation());document.addEventListener('click',()=>{
if(settings){
settings.classList.remove('open');if(!document.body.classList.contains('st-main-menu-mode')) settings.classList.remove('st-menu-settings');}
});const aimAssistBtn=document.getElementById('stAimAssist');function syncAimAssistButton(){
if(!aimAssistBtn) return;let on=true;try{
if(typeof window.__stoneThrowAimAssistState==='function') on=!!window.__stoneThrowAimAssistState();}catch(_){}
aimAssistBtn.textContent=on?'ON':'OFF';aimAssistBtn.classList.toggle('on',on);aimAssistBtn.setAttribute('aria-pressed',on?'true':'false');}
if(aimAssistBtn) aimAssistBtn.addEventListener('click',()=>{
if(typeof window.__stoneThrowToggleAimAssist==='function') window.__stoneThrowToggleAimAssist();syncAimAssistButton();});syncAimAssistButton();const popupsBtn=document.getElementById('stPopups');function syncPopupsButton(){
if(!popupsBtn) return;let on=true;try{
if(typeof window.__stoneThrowPopupsState==='function') on=!!window.__stoneThrowPopupsState();}catch(_){}
popupsBtn.textContent=on?'ON':'OFF';popupsBtn.classList.toggle('on',on);popupsBtn.setAttribute('aria-pressed',on?'true':'false');}
if(popupsBtn) popupsBtn.addEventListener('click',()=>{
if(typeof window.__stoneThrowTogglePopups==='function') window.__stoneThrowTogglePopups();syncPopupsButton();});const tutorialReset=document.getElementById('stTutorialReset');tutorialReset?.addEventListener('click',()=>{window.__stoneThrowResetTutorials?.();const t=tutorialReset.textContent;tutorialReset.textContent='RESET ✓';setTimeout(()=>tutorialReset.textContent=t,900);});if(gear&&settings) gear.addEventListener('click',()=>setTimeout(syncPopupsButton,0));syncPopupsButton();const giveUpOverlay=document.getElementById('stGiveUpOverlay');const giveUpCancel=document.getElementById('stGiveUpCancel');const giveUpConfirm=document.getElementById('stGiveUpConfirm');if(giveUpCancel) giveUpCancel.addEventListener('click',()=>{
if(giveUpOverlay) giveUpOverlay.classList.remove('open');});if(giveUpConfirm) giveUpConfirm.addEventListener('click',()=>{
if(giveUpOverlay) giveUpOverlay.classList.remove('open');if(typeof window.__stoneThrowGiveUp==='function') window.__stoneThrowGiveUp();setTimeout(syncShell,0);});if(giveUpOverlay) giveUpOverlay.addEventListener('click',(e)=>{
if(e.target===giveUpOverlay) giveUpOverlay.classList.remove('open');});const newRandom=document.getElementById('stRandom');if(newRandom) newRandom.addEventListener('click',()=>{
const old=document.getElementById('randomBtn'); if(old) old.click();setTimeout(syncShell,0);});const quickStart=document.getElementById('stQuickStart');if(quickStart) quickStart.addEventListener('click',()=>{
window.__stoneThrowQuickStart().then(()=>syncShell());});const newGiveUp=document.getElementById('stGiveUp');if(newGiveUp) newGiveUp.addEventListener('click',()=>{
const overlay=document.getElementById('stGiveUpOverlay');if(overlay) overlay.classList.add('open');});const storyAutoResolveBtn=document.getElementById('stStoryAutoResolve');if(STONE_THROW_DEV_MODE&&storyAutoResolveBtn)storyAutoResolveBtn.addEventListener('click',()=>{if(typeof window.__stoneThrowStoryAutoResolve==='function')window.__stoneThrowStoryAutoResolve();setTimeout(syncShell,0);});const phaseBtn=document.getElementById('stCenterStart');const storyResultRetry=document.createElement('button');storyResultRetry.id='stCenterRetry';storyResultRetry.textContent='RETRY';storyResultRetry.hidden=true;storyResultRetry.className=phaseBtn?.className||'';phaseBtn?.before(storyResultRetry);storyResultRetry.addEventListener('click',()=>document.getElementById('storyRetryBtn').click());if(phaseBtn) phaseBtn.addEventListener('click',()=>{
const view=getViewState();if(view.phase==='over'){
if(typeof window.__stoneThrowPlayAgain==='function') window.__stoneThrowPlayAgain();}else{
const oldStart=document.getElementById('startBtn');if(oldStart && !oldStart.disabled) oldStart.click();}
setTimeout(syncShell,0);});function getViewState(){
try{
if(typeof window.__stoneThrowViewState==='function') return window.__stoneThrowViewState();}catch(_){}
return {phase:null,shotsLeft:null};}
function shortStatus(){
const v=getViewState();if(v.phase==='place' || v.phase==='ready') return 'PLACE YOUR UNITS';if(v.phase==='enemy') return 'ENEMY TURN';if(v.phase==='over') return 'GAME OVER';if(v.phase==='player-resurrect') return 'CHOOSE A UNIT TO RESURRECT';if(v.phase==='player-catapult') return 'SHOOT THE CATAPULT!';if(v.phase==='player-spy'){
const n=Math.max(0,Number(v.spyRemaining)||0);return n===1 ? 'SCOUT 1 CELL' : `SCOUT ${n} CELLS`;}
if(v.phase) return 'YOUR TURN';const old=document.getElementById('status');const s=(old&&old.textContent||'').toLowerCase();if(s.includes('settu')||s.includes('place')) return 'PLACE YOUR UNITS';if(s.includes('óvin')||s.includes('enemy')) return 'ENEMY TURN';return 'YOUR TURN';}
function updateCommandLayoutFit(){
const shell=document.getElementById('stoneThrowShell');
const battle=shell?.querySelector('.st-battle');
if(!shell||!battle)return;

/* Use viewport capacity, not the width of an already-collapsed shell.
   This prevents a collapse from becoming self-locking. */
const available=Math.max(0,Math.min(1418,window.innerWidth-28));

/* Story knows its natural center width from SIZE. Full Game uses the
   actual battlefield content width. Marker/sidebar contents are
   deliberately excluded from this calculation. */
const storyActive=document.body.classList.contains('story-mode-active');
const centerWidth=storyActive && Number.isFinite(window.__stoneThrowStoryCenterNeeded)
  ? window.__stoneThrowStoryCenterNeeded
  : Math.ceil(Math.max(battle.scrollWidth,battle.getBoundingClientRect().width));

const leftSidebar=185;
const rightSidebar=250;
const gaps=24;
const required=centerWidth+leftSidebar+rightSidebar+gaps;

shell.classList.toggle('st-command-collapsed',available<required);
}
window.__stoneThrowUpdateCommandLayoutFit=updateCommandLayoutFit;
let stLayoutResizeRAF=0;
window.addEventListener('resize',()=>{
cancelAnimationFrame(stLayoutResizeRAF);
stLayoutResizeRAF=requestAnimationFrame(()=>{
if(typeof updateStoryMapGeometry==='function'&&document.body.classList.contains('story-mode-active'))updateStoryMapGeometry();
else updateCommandLayoutFit();
});
});
function syncBattlefieldMarkerLegend(view){
const m=view?.storyMarkers||{scout:true,monk:true,plague:true,resurrection:true};
document.querySelectorAll('.st-marker-scouted,.st-marker-scouting').forEach(el=>el.hidden=!m.scout);
document.querySelectorAll('.st-marker-monk').forEach(el=>el.hidden=!m.monk);
document.querySelectorAll('.st-marker-plague').forEach(el=>el.hidden=!m.plague);
document.querySelectorAll('.st-marker-resurrected,.st-marker-resurrection').forEach(el=>el.hidden=!m.resurrection);
}
function syncShell(){
const st=document.getElementById('stStatus');const shots=document.getElementById('stShots');const round=document.getElementById('stRound');const time=document.getElementById('stTime');const action=document.getElementById('stCenterStart');const random=document.getElementById('stRandom');const quickStart=document.getElementById('stQuickStart');const giveUp=document.getElementById('stGiveUp');const autoResolve=document.getElementById('stStoryAutoResolve');const view=getViewState();renderBattleStats(view.stats);syncBattlefieldMarkerLegend(view);requestAnimationFrame(updateCommandLayoutFit);const ph=view.phase;storyResultRetry.hidden=!(ph==='over'&&view.storyMode&&!document.getElementById('storyRetryBtn').hidden);if(autoResolve){const activeStory=!!view.storyMode&&ph!==null&&ph!=='place'&&ph!=='ready'&&ph!=='over';const devToolsOn=STONE_THROW_DEV_MODE&&document.body.classList.contains('dev-tools-active');autoResolve.hidden=!(activeStory&&devToolsOn);autoResolve.disabled=!!view.storyAutoResolve||(!!view.inputLocked&&ph!=='hero-relocate');autoResolve.textContent=view.storyAutoResolve?'AUTO RESOLVING…':'AUTO RESOLVE';}const left=(view.shotsLeft===null || view.shotsLeft===undefined) ? '—' : view.shotsLeft;if(shots) shots.textContent='Shots left '+left;const rn=view.roundNumber;if(round) round.textContent='Round '+((rn===null || rn===undefined || rn<=0) ? '—' : rn);const elapsed=Math.max(0, Number(view.elapsedMs)||0);if(time){
if(ph==='place' || ph==='ready' || ph===null) time.textContent='Time —';else {
const totalSeconds=Math.floor(elapsed/1000);const minutes=Math.floor(totalSeconds/60);const seconds=totalSeconds%60;time.textContent='Time '+String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0');}
}
const oldStart=document.getElementById('startBtn');const canStart=!!(oldStart && !oldStart.disabled);if(ph==='place' || ph==='ready' || ph===null){
if(st){
st.textContent='PLACE YOUR UNITS';st.style.display=canStart ? 'none' : '';}
if(action){
action.textContent='START GAME';action.hidden=!canStart;action.disabled=!canStart;}
if(random) random.style.display='';if(quickStart) quickStart.style.display='';if(giveUp) giveUp.hidden=true;}else if(ph==='over'){
if(st){
st.textContent='GAME OVER';st.style.display='';}
if(action){
action.textContent=view.storyMode?document.getElementById('playAgainBtn').textContent:'PLAY AGAIN';action.hidden=false;action.disabled=false;}
if(random) random.style.display='none';if(quickStart) quickStart.style.display='none';if(giveUp) giveUp.hidden=true;}else{
if(st){
st.textContent=shortStatus();st.style.display='';}
if(action){
action.textContent='START GAME';action.hidden=true;action.disabled=true;}
if(random) random.style.display='none';if(quickStart) quickStart.style.display='none';if(giveUp) giveUp.hidden=!!view.storyAutoResolve;}
}
const observer=new MutationObserver(syncShell);['status','shotsLeft','startBtn'].forEach(id=>{
const el=document.getElementById(id);if(el) observer.observe(el,{subtree:true,childList:true,characterData:true,attributes:true});});setInterval(syncShell,500);setInterval(()=>{
document.querySelectorAll('.cell.archer-cell').forEach(c=>{
if((c.textContent||'').trim()==='A') c.textContent='';});},250);syncShell();}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initStoneThrowShell);else initStoneThrowShell();})();