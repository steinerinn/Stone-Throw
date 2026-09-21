# Latest: global visible-deployment music routing — UNACCEPTED / UNPROMOTED

Runtime correction confined to client-v13/music.js. No track, gain, fade, identity, narration, SFX, canonical gameplay or scoring changes.

Root causes and changes:
- Main Menu: controller armed=false prevented any startup playback attempt, even if browser policy would permit it. Unlock listened to three document-level event types but omitted click/pointerup. Now a quiet native-media autoplay attempt runs after bootstrap has selected the actual visible scene; the first top-level click/pointer/key/touch gesture refreshes that scene and unlocks/resumes Web Audio. Preloading is preserved. Blocked attempts are caught without popups. The exact event from the physical phone was not captured; ordinary pointer taps already worked in the earlier automated test. This closes the missing startup/click paths rather than claiming every old tap failed.
- Single Player deployment: selector explicitly mapped placement to menu, with an exception only for Story. Visible placement now maps to battle in every mode.
- Multiplayer deployment silence: create/join reloads the page, resetting armed state; no initial autoplay retry existed. It also classified placement as menu. Restored visible deployment now wants battle immediately and attempts permitted playback; if browser policy requires a gesture, any valid interaction unlocks that wanted battle track.
- Menu blip: Random/Ready was able to wake Exploration because placement still selected menu; Start then changed to battle. The corrected placement mapping stays battle throughout. Refresh also updates sound state without syncing the previous scene first, and unlock refreshes selection before retrying playback. No symptom-hiding delay added.

Visible Main Menu/setup remains Exploration; an open Story exposition retains Rising Moon; actual visible battlefield placement is Eye of the Storm, then the same instance/time into combat. Results/Plague routing and mix are unchanged. Browser restrictions still apply: the app cannot legally guarantee audible playback before a required user gesture.

Focused real browser/service verification: all 8 flows PASS (1440 desktop and 390 phone-sized × Single Player, Story, Duel, Group). A click on the non-navigation Main Menu kicker starts Exploration without entering a mode. Actual menu/setup and Story narration, create/join reloads, deployment, Random/Ready/Start tested. Battle media object unchanged, time increases, battle play-call count unchanged at combat start, Exploration play-call count never increases during those transitions. Sound OFF/ON uses existing instances and the correct battle track; no page errors. Group uses three Human seats for this routing check. Seven controller checks PASS including blocked autoplay retry and placement classification. Evidence: workspace outputs/post-phase2-batch2/routing-check.mjs and routing-results.json.

Runtime: client-v13/music.js. Supporting changes: tools/music-check.mjs, this report, tools/local-recovery-contract.json (preceding compatible manifest d08c3d8afa26d737887cc6b585586cf13ec0964966ce630cb312cd35143001dc), build-manifest.json and root CURRENT-STATE.md/HANDOFF.md. Other runtime files, identity fix, assets, narration, canonical gameplay and Registry/statistics verified byte-unchanged. Final build verification follows documentation update.

Stop for physical retest using current PLAYTEST-LAN.cmd and its printed URL. Check a Main Menu tap without entering a mode, then placement → combat in all modes, especially multiplayer Random/Ready with no menu blip. No commit, push, promotion or deployment; candidate remains unaccepted.

---

# Two physical music fixes — latest UNACCEPTED / UNPROMOTED follow-up

Runtime change is confined to client-v13/music.js. Existing levels, fade durations, tracks, branding, narration and canonical gameplay remain unchanged.

1. Story placement was grouped with ordinary menu/lobby placement. It now selects Eye of the Storm as soon as the visible Story battlefield is in placement, ahead of any stale narration-scene metadata. Uses the existing public Story-mode flag; no new host field. Narration/exposition still selects Rising Moon. The same battle audio element/time continues when placement becomes combat. Baseline automation reproduced the incorrect menu category (Exploration during deployment), not the exact physical Rising Moon variant.
2. Initial media used preload=none and had no fetched/decoded data at the first gesture. Wanted music now primes once with preload=auto without playing; only Exploration loads on initial Main Menu. Story narration also primes its predictable next track, Eye of the Storm. Unrelated music/large ambience remain lazy. Priming never reloads an existing track. Web Audio connection cancels any still-pending native-volume startup ramp so that old timer cannot overwrite the gain-node handoff. Gains/fade constants are unchanged.

Cold Chromium tests, with a controlled 350 ms delay per music request and the same pre-interaction wait:

| Viewport | Before interaction → playing | After interaction → playing |
| --- | ---: | ---: |
| Desktop 1440 | 418 ms | 18 ms |
| Phone-sized 390 | 389 ms | 16 ms |

Before: no pre-interaction music requests; readyState 0. Metadata/data became ready only after the post-gesture request (metadata-to-data about 0.5–2.3 ms). After: Exploration alone requested before interaction; readyState 4 while still paused. This demonstrates deferred fetch/readiness, rather than a long unlock handler, as the measured controllable delay. These are controlled browser measurements, not timing claims for the physical phone/network.

Exploration itself contains about 1.10 seconds below -50 dB at the beginning. That selected audio is preserved, not trimmed. Existing fades also remain unchanged; physical audible onset can be later than the browser playing event.

Focused verification: real Story narration → deployment → combat at both sizes; Eye of the Storm already playing in placement, identical media instance and one play call across battle start, monotonic playback time; Rising Moon stopped. OFF/ON no duplicate instances; no page errors. Controller suite 7 checks PASS with new priming/Story-placement assertions. Preload only one initial asset verified. Canonical tree, all audio files, narration implementation and both branding shells remain byte-identical to the preceding build. Full manifest verification remains required after documentation update.

Supporting files changed: tools/music-check.mjs, tools/local-recovery-contract.json (adds the preceding verified build to unchanged-format local recovery), MUSIC-FIRST-PASS.md, build-manifest.json and root CURRENT-STATE.md/HANDOFF.md. Browser harness and before/after evidence: workspace outputs/post-phase2-batch2/music-fix-*.

Physical retest: launch the current PLAYTEST-LAN.cmd, use its printed URL, listen after the first interaction, then Story narration → DEPLOY → placement → Start. Check Eye of the Storm starts at placement and keeps playing without restarting. Toggle Sound OFF/ON. No commit, push, promotion or deployment.

---

# Batch 2 music and battle branding — UNACCEPTED / UNPROMOTED

All eight selected originals were found in C:/Users/Notandi/OneDrive - Tækniskólinn/_Battlesheep/Music. Originals are unchanged. Exact source/output hashes, byte counts and encoder version are recorded in assets/audio/music/manifest.json.

| Original | Game-ready file under assets/audio/music | Routing |
| --- | --- | --- |
| Exploration.wav | exploration.mp3 | One continuous menu track: Main Menu, Single Player/Online setup, lobby, Settings, lore and other ordinary menu overlays |
| Rising_Moon.mp3 | rising-moon.mp3 | Story narration/exposition; duck while narration plays |
| Eye of the Storm.wav | eye-of-the-storm.mp3 | Shared battle track in Single Player, Story, Duel and Group |
| Aftermath.wav | aftermath.mp3 | story_complete / THE LAST STONE FALLS; narration ducking then release |
| victory.wav | victory.mp3 | Shared public win result |
| defeat.wav | defeat.mp3 | Shared public loss result |
| shut_up_ghost-eerie-ambiance-168470.mp3 | plague-eerie.mp3 | Low layer while public Plague marks remain relevant on the visible battlefields |
| alesiadavina-dark-demonic-atmosphere-gloomy-horror-drone-sfx-541955.mp3 | plague-dark.mp3 | Restrained 4.5-second intensity on new public Plague events |

Five WAVs encoded with FFmpeg/libmp3lame VBR quality 2, keeping source sample rate/channels and no audio filter, normalization or mastering. Existing MP3s copied byte-for-byte. Total originals 174,824,135 bytes; game-ready audio 38,314,045 bytes. Five WAVs alone shrink from 149,378,524 to 12,868,434 bytes. The largest existing MP3 is deliberately not transcoded; lazy playback and HTTP byte-range streaming avoid eagerly downloading it on menu entry.

## Runtime changes

- client-v13/music.js: singleton presentation controller; one media element per track, public scene routing, loops, fades, narration ducking, Sound switch, gesture unlock, refresh/page lifecycle. No host imports, gameplay intents or RNG.
- client-v13/combat-feedback.js: passes already-public painted updates to that controller, including animation-frame Plague events.
- client/story-presentation.js: reports current narration scene and speaking/pause/end/error state in presentation metadata only. Narration play/stop logic, canonical text, timing, preference and all 19 WAVs are unchanged.
- server/main.mjs: explicitly allowlists the music module and eight manifest-listed MP3s; delegates their static delivery.
- server/music-assets.mjs: MP3 content type, streaming, length and validated byte ranges. No API/host/persistence changes.
- StoneThrow-v1.427-stage13-production.html and -development.html: existing shared battle-header image now references supplied assets/ui/chain-siege-banner.png, with correct alt text and intrinsic dimensions. Existing responsive sizing/CSS retained; no redraw or identifier rename.
- tools/local-recovery-contract.json: adds the previous verified Batch 2 manifest as a compatible predecessor; canonical engine digest unchanged. No save deletion or journal restoration.
- Added assets/audio/music/ (eight tracks plus provenance manifest), tools/music-check.mjs, this report; updated build manifest and root handoff/current-state metadata.

## Starting mix (linear gain, not final mastering)

Menu .22; Story .12; battle .16; epilogue .23; victory .24; defeat .22; eerie .055; dark .035. Speaking narration caps Story/epilogue music at .035. Duck 180 ms, release/fade-in 1200 ms, outgoing main-track crossfade 900 ms. Dark layer lasts 4500 ms after latest new public activity. Constants live together in MUSIC in client-v13/music.js. Web Audio gain nodes provide mobile-capable volume ramps; native-volume fallback if unavailable. SFX and narration gain are not changed.

Menu/submenu navigation never seeks or restarts Exploration. Normal battle updates never restart battle music. Music and ambience loop; Victory/Defeat play once. Draw fades music to silence without substituting a result. Group Give Up still hands the seat to AI: an ongoing public battle is not falsely treated as a defeat; existing menu navigation selects menu music.

Media preload is none. Autoplay rejection is caught quietly; pointer/key/touch interaction unlocks/resumes audio and retries the wanted track without making duplicates. Sound OFF immediately mutes/pauses music; ON resumes the same elements. Pagehide stops music; pageshow selects from actual visible state. No extra mixer or settings UI.

Plague input is only public plagueCells and public event source. Historic visible Plague trails are treated as relevant ambience until the battlefield is left or finished; no private outbreak timer/board is inspected. Restored historical events do not replay an intensity pulse. No Necromancer or other new SFX are integrated.

## Focused evidence

- tools/music-check.mjs: 7 checks PASS (blocked autoplay/retry, continuity/no duplicates, mode mapping, ambience pulse expiry, duck/release, win/loss/draw, mute).
- Real Chromium browser at 1440 and phone-sized 390: menus continuous; actual Chapter 1 WAV plus Rising Moon; real deployment/start with battle music; public win/loss/draw projections; epilogue; Plague layers; Sound OFF/ON; reload to Main Menu/Online with only Exploration; no page errors.
- Real server Single Player, Duel and Group placement/start/Give Up flows rendered through the production public renderer: correct music changes. Authoritative host/RNG bytes unchanged across mute/unmute. Group ongoing takeover semantics preserved.
- All eight MP3 range requests PASS (206, audio/mpeg, correct byte lengths). All originals and output hashes verified; canonical tree and 19 narration assets unchanged from prior verified Batch 2.
- Shared banner decoded at 2508x627; desktop header 300x75 and phone header 352x88, exact 4:1 ratio, no overflow. Phone screenshot inspected.
- Normal launcher recovery: 5 checks PASS; exact saved host/RNG/turn and old save preserved; checkpoint.journal absent. Windows denied 3212 during the final run; the launcher correctly selected free ports. Test follows the returned URL across restart.
- Group narrative: all 13 checks PASS. Full build verification: 579/579 files PASS.
- Test scripts/results/screenshots are in workspace outputs/post-phase2-batch2/music-*. Tests use isolated Registry directories, not the user's private Registry.

## Physical listening/layout test

Use the current Git tree's PLAYTEST-LAN.cmd and its printed URL. Navigate Main Menu / Options / Units / Online lobby and check Exploration continues. Start Single Player, then win or Give Up and return to menu. Test Story Chapter 1 through deployment; later use SEE WHAT'S NEW and THE LAST STONE FALLS to hear narration duck/release. Test Duel/Group battle and public results, Plague spread, Sound OFF/ON, refresh/rejoin and phone layout. Listen for narration clarity, relative music/ambience levels, loop seams and transition timing. These require human listening and actual mobile autoplay/device audio behavior; automated browser checks do not establish final loudness quality.

No combat, AI, scoring, Event Log wording, Registry design or narration-content changes. No commit, branch change, push, promotion or deployment. Stop for physical acceptance testing.
