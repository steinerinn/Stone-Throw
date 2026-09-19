from pathlib import Path
import re,json,hashlib,sys
root=Path(__file__).resolve().parents[2]
doc=Path('C:/Users/Notandi/Downloads/STONE_THROW_STORY_NARRATION_AUDIO_CODEX_HANDOFF.md').read_text(encoding='utf-8')
scenes='border castle catapult phase2_equal phase2_dwarf phase2_elf phase2_goblin phase2_sync phase3_necro phase3_cleric phase4_monk phase4_complete phase5_dragon phase5_demon phase5_wizard phase5_complete hero_intro phase6_final story_complete'.split()
chapters=list(re.finditer(r'^### (\d+)\. (.+)\n\n([\s\S]*?)(?=\n### |\n## INTEGRATION)',doc,re.M))
assert len(chapters)==19
waves=re.findall(r'`(assets/story/audio/[^`]+\.wav)`',doc);assert len(waves)==19
data={}
for scene,m,wav in zip(scenes,chapters,waves):
 b=(root/wav).read_bytes();assert b[:4]==b'RIFF' and b[8:12]==b'WAVE'
 data[scene]={'chapter':int(m[1]),'title':m[2],'paragraphs':m[3].strip().split('\n\n'),'wav':wav,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)}
(root/'assets/story/audio/narration-manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
helper=root/'client/story-presentation.js'
helper.write_bytes(helper.read_bytes().split(b'\n// Approved Story narration:')[0]+('\n// Approved Story narration: presentation only; no authoritative state or RNG.\nconst STONE_THROW_STORY_NARRATION=(()=>{\nconst chapters='+json.dumps(data,ensure_ascii=False,indent=2)+';\n'+(root/'tools/story-narration/audio-manager.txt').read_text(encoding='utf-8')+'\n})();\n').encode())
baseline=root/('tools/story-narration/story-production-before.txt' if '--production' in sys.argv else 'tools/story-narration/story-before.txt')
s=baseline.read_text(encoding='utf-8')
s=s.replace("let {cleanStoryHistoryHtml", "const narration=STONE_THROW_STORY_NARRATION;\nlet {cleanStoryHistoryHtml",1)
# Consolidate prose at its callers, keeping every note, owner, state assignment and continuation.
for func in ['showStoryBattle2Transition','showStoryBattle3Transition','showDwarfTransition','showElfTransition','showGoblinTransition','showNecromancerTransition','showClericTransition','showPhase4ClericInterruption','showMonkTransition','showDragonTransition','showDemonTransition','showWizardTransition','showHeroTransition']:
 a=s.index('function '+func+'(');b=s.find('\nfunction ',a+1)
 part=s[a:b]
 # Remove narrative-only local variables (never notes/owner/continuation variables).
 part=re.sub(r'const n=window\.__stoneThrowStoryBattle1Narrative\?\.\(storyPhasePlayerWon\);','',part)
 if func=='showStoryBattle3Transition':
  start=part.index('let p=[];');end=part.index('openStoryTransition',start);part=part[:start]+part[end:]
 else:
  part=re.sub(r'const (?:p|paragraphs)=[\s\S]*?;(?=openStoryTransition|const note=)','',part)
 start=part.index('title:',part.index('openStoryTransition'))
 end=part.index('note',start)
 part=part[:start]+part[end:]
 s=s[:a]+part+s[b:]
s=s.replace('function openStoryTransition(o){','function openStoryTransition(o){\nconst chapter=narration.chapters[o.artScene];o={...o,title:chapter.title,paragraphs:chapter.paragraphs};narration.play(o.artScene);')
s=s.replace("function closeStoryTransition(){","function closeStoryTransition(){narration.stop();")
s=s.replace("function closeDialog(){","function closeDialog(){narration.stop();")
s=s.replace("if(storyUnitRevealed){", "if(storyUnitRevealed){narration.stop();")
s=s.replace("function menuMode(on){if(on){", "function menuMode(on){if(on){narration.stop();")
s=s.replace("STORY_NARRATION_ART.phase5_dragon=", "STORY_NARRATION_ART.phase4_complete=STORY_NARRATION_ART.phase4_open;STORY_NARRATION_ART.phase5_dragon=",1)
# Replace only each generic dialog's body expression. Preserve its actions and state updates.
dialogBodies={
 'showStoryPrologue':"storyVignette('border')+narration.html('border')",
 'showPhase2Opening':"storyVignette('phase2_equal')+narration.html('phase2_equal')",
 'showPhase2Sync':"storyVignette('phase2_sync')+narration.html('phase2_sync')",
 'showPhase3Complete':"storyVignette('phase4_open')+'<p>Both armies return to equal footing: three Infantry, two Cavalry, two Archers, a Castle, Catapult, Dwarves, Elves, Goblins and two Necromancers'+((window.__stoneThrowStoryClericUnlocked?.('player')&&window.__stoneThrowStoryClericUnlocked?.('enemy'))?', plus a Cleric on each side':'')+'. The battlefield remains 11×11.</p>'",
 'showPhase4Complete':"storyVignette('phase4_complete')+narration.html('phase4_complete')+clericText+'<p>The armies march out again with three Infantry, two Cavalry, two Archers, a Castle, Catapult, Dwarves, Elves, Goblins, two Necromancers and a Monk'+((window.__stoneThrowStoryClericUnlocked?.('player')&&window.__stoneThrowStoryClericUnlocked?.('enemy'))?', plus a Cleric on each side':'')+'. The battlefield expands to 12×12.</p>'",
 'showPhase5Complete':"storyVignette('phase5_complete')+narration.html('phase5_complete')+clericText+'<p>Four Infantry march beside two Cavalry, two Castles, two Catapults, two Necromancers and one of nearly every other force drawn into the conflict. The battlefield grows to 14×14.</p>'",
 'showFinalBattleTransition':"storyVignette('phase6_final')+narration.html('phase6_final')+'<p>Five Infantry. Three Cavalry. Three Archers. Two Castles. Two Catapults. Two Necromancers. A Monk, Dwarves, Goblins, Elves, Cleric, Dragon, Demon, Wizard — and a Hero.</p><p>The battlefield expands one last time to <b>15×15</b>.</p><p><b>This battle is different.</b> Defeat does not advance the story. To finish the campaign, you must win.</p>'",
 'showStoryComplete':"`<img class=\"st-story-vignette st-story-vignette-ending\" data-story-scene=\"story_complete\" src=\"${STORY_NARRATION_ART.story_complete}\" alt=\"The war-torn kingdom after the final victory\">`+narration.html('story_complete')"
}
for func,body in dialogBodies.items():
 a=s.index('function '+func+'(');start=s.index('showDialog(',a);comma=s.index(',',start);end=s.index('[{label:',comma)
 s=s[:comma+1]+body+','+s[end:]
s=s.replace("showDialog('The Silent Order',storyVignette('phase4_open')", "showDialog('Prepare for Battle',storyVignette('phase4_open')")
s=s.replace('function showDialog(title,body,actions){', '''function showDialog(title,body,actions){
const scene=/data-story-scene="([^"]+)"/.exec(body)?.[1];const chapter=narration.chapters[scene];if(chapter)title=chapter.title;narration.play(scene);''')
s=re.sub(r"const STORY_PROLOGUE_HTML='[\s\S]*?';let storyLiveResumeAvailable", "const STORY_PROLOGUE_HTML=narration.html('border');let storyLiveResumeAvailable",s,count=1)
s=s.replace("title:STORY_HISTORY_LABELS[scene]||title||'Story'", "title:narration.chapters[scene]?.title||STORY_HISTORY_LABELS[scene]||title||'Story'")
s=s.replace("title:'IT BEGINS',html:STORY_PROLOGUE_HTML", "title:narration.chapters.border.title,html:STORY_PROLOGUE_HTML")
# Late first Plague is an additional presentation only interruption, not a new battle.
# Existing Battle 9 and pre-Monk interruption retain their original extra-battle routing.
s=s.replace('window.__stoneThrowContinueStory=(info)=>{', '''window.__stoneThrowContinueStory=(info)=>{
const targets=window.__stoneThrowStoryPlagueTargets?.()||[];
const late=storyPhase4MonkBattle!==null&&Number(info?.battle)>=storyPhase4MonkBattle&&(storyFinalBattle===null||Number(info?.battle)<storyFinalBattle);
const fresh=targets.filter(side=>(side==='player'||side==='enemy')&&!window.__stoneThrowStoryClericUnlocked?.(side));
if(late&&fresh.length&&!readStoryHistory().some(x=>x.scene==='phase3_cleric')){
 const who=fresh.map(side=>side==='player'?'your army':'the enemy army').join(' and ');
 showDialog(narration.chapters.phase3_cleric.title,storyVignette('phase3_cleric')+narration.html('phase3_cleric')+'<p>The Plague forces a Cleric to join '+who+' in the next battle; each first appearance replaces one Infantry.</p>',[{label:'CONTINUE',primary:true,action:()=>{closeDialog();continueStoryResult(info);}}]);return;
}
continueStoryResult(info);};
function continueStoryResult(info){''')
# Function declaration replaces old arrow terminator.
s=s.replace("info?.battle||0);};storyAftermathNext", "info?.battle||0);}storyAftermathNext")
old=baseline.read_text(encoding='utf-8')
changed=[]
for f in root.glob('*.html'):
 text=f.read_text(encoding='utf-8')
 if old in text:
  assert text.count(old)==1
  f.write_bytes(text.replace(old,s).replace('\n','\r\n').encode());changed.append(f.name)
assert len(changed)>=2,changed
(root/'source/legacy/story.js').write_bytes(s.replace('\n','\r\n').encode())
print(json.dumps({'htmlUpdated':changed,'chapters':len(data)},indent=2))
