import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
const before=JSON.parse(read('tools/story-narration/manifest-before.json')),audio=JSON.parse(read('assets/story/audio/narration-manifest.json'));
const changed=Object.keys(before.files).filter(n=>sha(fs.readFileSync(path.join(root,n)))!==before.files[n]);
const allowed=new Set(['source/legacy/story.js','client/story-presentation.js','server/main.mjs','styles-21.css',...[5,10,11,12,13].flatMap(n=>['production','development'].map(mode=>`StoneThrow-v1.427-stage${n}-${mode}.html`))]);
for(const name of changed)assert.ok(allowed.has(name),'Unexpected change '+name);
// Removing only the replaced Story closure reproduces every previous HTML byte/hash.
for(const name of changed.filter(n=>n.endsWith('.html'))){const text=read(name),match=[...text.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('const mainMenu=document.getElementById'));const old=read('tools/story-narration/'+(name.includes('stage13-')?'story-production-before.txt':'story-before.txt'));assert.equal(sha(text.replace(match[1],old)),before.files[name],name+' unchanged outside Story closure');}
const walk=(dir='')=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>{const n=dir?dir+'/'+e.name:e.name;return e.isDirectory()?walk(n):[n];});
const added=walk().filter(n=>n!=='build-manifest.json'&&!before.files[n]);
const table=Object.entries(audio).map(([scene,c])=>`| ${c.chapter} | ${c.title} | ${scene} | ${c.wav} |`).join('\n');
const report=`# Story narration integration — unaccepted candidate

Completed in the existing Group Battle candidate. No promotion, push or deployment. Physical Story testing remains required.

## Routing audit and changes

- Consolidated Castle, Catapult, Dwarf, Elf, Goblin, Necromancer, Cleric, Monk, Dragon, Demon, Wizard and Hero narration into canonical chapter titles/prose. Win/loss ownership, reinforcements, map notes and continuation callbacks remain dynamic and unchanged.
- Chapter 10 covers the existing Battle 9 and pre-Monk Cleric interruption routes. Later first-Plague routes now insert Chapter 10 before resuming the exact original result callback; no extra battle or authoritative state change is introduced. The pre-Monk interruption still holds the original Monk outcome across its existing intervening battle.
- The functional pre-Monk equal-army setup remains as **Prepare for Battle**, with roster/map information and no WAV. Chapter 11 runs at actual Monk entry only.
- The post-Monk chapter has its own logical key, phase4_complete, reusing its existing artwork. It no longer collides with the pre-Monk setup/history key.
- Chapters 16 and 18 precede the existing 14×14 and 15×15 configurations. Chapter 19 remains guarded by final victory; defeat/draw do not finish Story.
- New history entries record canonical titles/text; art, lore discoveries and dynamic notes are preserved. Existing historical entries are not destructively rewritten. Start Story Over for a complete newly narrated run.
- Placement briefing, tutorials, unit detail cards, setup, menu confirmations and Story Log are functional screens, not additional narrated chapters.
- No Demon unit/type/art/info rename. The approved prose's Cultists references are used verbatim.

## Audio and presentation

One on-demand HTML audio element; no startup preload of the 19 files. Opening a canonical screen plays its WAV once. Unit reveal (SEE WHAT'S NEW / SEE WHAT CHANGED) keeps the current narration playing. Next deployment, close, chapter replacement, Main Menu and page exit stop and release the previous audio. No gameplay callback awaits audio. Missing files/blocked playback log the chapter/path and leave progression usable.

Narration has one shared persistent ON/OFF preference (stoneThrow.storyNarration.enabled.v1), available on Story cards and in Settings. It defaults ON. OFF stops/releases the current audio; ON applies to subsequent chapters without restarting the current one. Existing sound mute remains respected, and SFX/music preferences are not changed.

The static server explicitly allowlists the 19 files and serves audio/wav with Content-Length (required for reliable finite native WAV duration). Longer approved text required only overflow scrolling inside existing Story cards; no restyling/artwork changes.

## All 19 canonical mappings

| Chapter | Title | Logical event | WAV file |
|---|---|---|---|
${table}

The supplied WAV bytes are unchanged. Exact SHA-256 and byte sizes for each are in assets/story/audio/narration-manifest.json. Canonical prose was extracted verbatim from the approved handoff and compared paragraph-for-paragraph in tests.

## Verification

- tools/story-narration/check.mjs: PASS, 63 focused route checks. Both outcomes after Battles 1–8; exact dynamic note/owner and continuation comparison against pre-edit production Story; both Plague sides at Battle 9, pre-Monk and every later first-Cleric continuation; Monk setup silence; chapters 16/18; final defeat/draw/win.
- PASS: all 19 paths unique, files/RIFF headers/hash/HTTP bytes/MIME; all 19 decoded by Edge's native browser audio; actual Chapter 1 playback advances time; demand loading; stop on advance/close; missing-file diagnostic and actual deployment into the 5×5 Story battle.
- PASS: 390×844 phone controls for long Cleric and ending screens; desktop route checks; existing sound switch.
- Existing group-mode-preservation.mjs PASS: repeated Single Player/Story switching, exact private state/RNG, independent multiplayer slot and server restart recovery.
- All canonical/host/gameplay, AI, Story policy/tutorial, networking/recovery and non-Story client files remain byte-identical. Server changes are restricted to static WAV serving. Every HTML shell is byte-identical outside its Story closure (verified by reversing that replacement against the pre-edit hashes).
- Protected accepted core-multiplayer-stabilization checkpoint verification PASS: 444 files, manifest 9d7466230c195b9f04e70326cc7248614f288d640e73f7d9124e3cc81dc4e0b2.
- Full evidence: tools/story-narration/results.json. No claim of physical speaker/phone autoplay testing or a full campaign played manually.

## Files changed

Existing payload files:
${changed.map(n=>'- '+n).join('\n')}
- build-manifest.json (new unaccepted revision and verified payload hashes)

Added to the manifest (the 19 WAVs were supplied by the user, not edited):
${[...new Set([...added,'STORY-NARRATION.md'])].sort().map(n=>'- '+n).join('\n')}

The source Story closure now includes the already-existing production async deployment/menu lifecycle; those callbacks in the production and development HTML were not changed. Older candidate HTML copies retain their own existing lifecycle and receive only the narration changes.

## Exact manual Story tests

1. Double-click PLAYTEST.cmd in this candidate; choose Story Mode / Start Story Over. Confirm AN OLD RIVALRY text, matching voice and existing art. Back out during speech: it must stop. Reopen, then deploy: no narration should leak into placement/battle.
2. Play through Battles 1–8. Confirm chapters 02–09 in order and no Victory/Defeat narrative titles. Use a second run with opposite outcomes, especially Battle 8: both show A DARKER BARGAIN, while the loser receives 2 Necromancers and the winner +2 Infantry as before.
3. Cause the first Plague on your kingdom, then in a separate run on the enemy kingdom. Each must introduce LIGHT AGAINST THE PLAGUE once with the correct Cleric/Infantry note. Continue through its unit information and check the expected next battle.
4. In another run avoid first Plague at Battle 9. Confirm the equal-army setup is silent. If Plague first occurs in the pre-Monk battle, confirm Cleric first, the existing intervening battle, then THE SILENT ORDER with the original saved Monk ownership. Otherwise Monk narration occurs once immediately at its actual unlock.
5. Delay first Plague until a later phase: confirm Chapter 10 appears, Continue returns to the scheduled phase narration, and no battle is skipped/added or reward ownership changed.
6. Continue through Dragon, Demon, Wizard, 14×14 setup and Hero. Confirm chapters 13–17 and corresponding voices; Demon unit info/name still says Demon. Check long paragraphs and Continue buttons on both desktop and phone.
7. Confirm THE FINAL BATTLE before the 15×15 battle. Lose/give up: no ending narration or completion. Retry and win: THE LAST STONE FALLS plays, Story completes, and Return to Main Menu stops any remaining voice.
8. Check Story Log titles/prose and unit lore; neither should autoplay narration. Check the existing sound setting if used. On the physical browser, listen for cut-off/overlapping voices and confirm autoplay after result transitions. A browser autoplay restriction must leave text/buttons functional and print a diagnostic.

Remain unaccepted pending these physical tests. No other requested performance or Group issue was reopened.
`;
fs.writeFileSync(path.join(root,'STORY-NARRATION.md'),report);
const files=Object.fromEntries(walk().filter(n=>n!=='build-manifest.json').sort().map(n=>[n,sha(fs.readFileSync(path.join(root,n)))]));
const next={...before,revision:'story-narration-audio-v1',status:'unaccepted-story-narration-integration',files};fs.writeFileSync(path.join(root,'build-manifest.json'),JSON.stringify(next,null,2)+'\n');console.log(JSON.stringify({changed,files:Object.keys(files).length,manifestSha256:sha(fs.readFileSync(path.join(root,'build-manifest.json')))},null,2));
