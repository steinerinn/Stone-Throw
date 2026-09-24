# ACCEPTED — Battlefield / Deployment Phase

2026-09-24. Branch: `battlefield-deployment-phase1`. Accepted parent: `b25d1da884f6084015996d49435077b2c29cffbb` (Online / Single Player checkpoint).

The user has physically accepted the current candidate. Battlefield UI is complete and frozen for this phase. This acceptance supersedes all earlier UNACCEPTED / UNPROMOTED labels in the historical notes below. Commit and push authorized; no merge or deployment.

Accepted scope: supplied battlefield route/medallion assets; equal-size aligned battlefield maps and animation-safe geometry; live/spectator/final cleanup; floating central deployment window covering stats/map banners without moving maps; portraits/identity/flags/readiness; stable Random layout; Ready/Unready and 120-second timer starting after required PLAYER seats join; canonical missing-unit timeout placement and durable rejoin; finalized Online reliability and minimum gates; diagnostic-only deployment AFK; removal of room banner; Leave navigation and newest-first visible Events. The explicitly authorized source-independent non-Plague Catapult benefit correction is included; its physical reaction case remains WATCHLIST. No Score implementation or unrelated combat/RNG redesign.

Final verification: 35 focused suites completed successfully, comprising 574 explicitly counted cases/groups and seven additional pass/fail suites. TypeScript 5.9.3 compilation PASS; all 160 generated canonical files match byte-for-byte. Exact accepted-parent combat/RNG comparison: 47 cases PASS. Build manifest: 1008/1008 PASS (digest reported after final metadata refresh; manifest cannot contain its own digest).

Non-blocking follow-up only:
- Event panel polish: backlog.
- Catapult reaction physical case: WATCHLIST, not a failed acceptance gate.
- Match Score / PLAYER vs AI: separate next phase; dry-run outputs excluded from Git.
- Profile work: separate next phase.
- Historical isolated Castle/Plague disclosure and multiplayer seat-loss reports remain documented watchlist evidence, with no speculative new fixes.

No private Registry/database/backup, screenshots, browser captures, generated accounts, logs, Score analysis, archives or OS-temp artifacts belong to this checkpoint. Normal playtest launcher keeps checkpoint.journal disabled; durable tests confirm no journal. Exact candidate scope and verification are in `playtest/BATTLEFIELD-DEPLOYMENT-REPORT.md`.

---

## Historical development notes (superseded by acceptance above)

# Battlefield / Deployment / Online Reliability — UNACCEPTED / UNPROMOTED

2026-09-23. Branch battlefield-deployment-phase1; directly based on accepted b25d1da884f6084015996d49435077b2c29cffbb.
Supplied route/turn assets copied verbatim and scaled in accepted existing gaps; exact accepted battlefield geometry restored; deployment identities/readiness/countdown; reversible Ready; 120-second deadline begins when all required PLAYER seats join. Timeout fills only missing units through canonical placement. Deadline/placement/RNG survive restart/rejoin.
Reliability uses finalized Online records only: surrender completed, permanent disconnect/abandonment one failure, grace/rejoin unpenalized. New accounts UNRATED and Guests cannot satisfy positive room minimums. Deployment AFK is diagnostic-only; no combat AFK rule.
Verification: 289 checks/groups PASS plus accepted-base authority/RNG parity, TypeScript/compiled-byte parity and original-asset equality. Manifest: 1008/1008 PASS; SHA-256 739ca6878e80bc82f4427cb028fb4b5579ae424a4c45f820a29519f57372ffb2.
Authoritative geometry correction: 52 focused cases PASS, including 10 exact accepted map/DOM geometry comparisons on desktop/phone. Earlier 289-case result above is historical. No gameplay/server/asset changes in this correction.
Latest art-only follow-up: dial overlay 20px higher; pointer 44px; readable 56px broad / 64px curved arrows. 10 browser cases rerun PASS; maps unchanged.
Tiny follow-up: only desktop 4P lower row raised 20px; horizontal digit ink centered with unchanged vertical position. No arrow/gameplay logic change.
Final three-item correction: active desktop 4P wrapper gap measures 0px; measured digit ink centered on both axes; straight directions strictly cardinal. 10 focused browser cases PASS. Medallion position, map dimensions and gameplay unchanged.
Horizontal-gap clarification completed: lower desktop 4P cards move inward 12px each; horizontal gap 0px, sizes and vertical positions unchanged. 10 browser cases PASS.
Equal-map-size follow-up: active desktop lower maps now inherit primary cell size; all four grids measure equally, horizontal gap stays closed. 10 browser cases PASS.
Real-match regression fixed: hidden-card DOM order made nth-child offsets hit wrong cards after the first action. Visible-child selectors keep the horizontal gap 0px through six actions each in full-roster Single Player and Online; 14 live checkpoints plus 10 fixture cases PASS.
Spectator follow-up: curved arrow beside lower map; shared indicator anchor under top maps in every desktop live/spectator state. Lower rows gain 5px breathing room. 10 browser cases PASS.
Unified desktop layouts: equal map sizes in live/spectator/final, common 72px indicator and same 5px lower-row gap for live 3P/4P and spectator.
Indicator center raised into the upper unit-bar bottoms; lower frames/cells follow measured primary dimensions. Full frame and grid size checks added to live and fixture browser suites.
Demon orphan follow-up: failed animation cleanup now occurs immediately, not only at whole-room completion. Browser failure cleanup and four final overview cases PASS; successful combat unchanged.
Indicator/width-cap follow-up: moved the shared dial 2px left with its vertical position unchanged. Removed the desktop secondary frame max-width cap and centered the frame independently of card content width, preserving measured primary dimensions. The physical browser was unavailable, so the exact physical discrepancy remains unconfirmed. Ten desktop/phone overview checks PASS at 1440/390px; fourteen real Single Player/Online checkpoints PASS at 1280px through six actions per mode. All four frames measured 343.015625 square and grids 311.015625 square at 1280px. Runtime change only styles-online-overview.css. No gameplay change.

Visible-column alignment correction: supersedes the earlier zero lower-card-gap objective. Removed the opposing 12px inward offsets. In active desktop 4P, each lower card is positioned from its actual map-frame left edge to the corresponding upper map-frame left edge; frame sizes remain synchronized. No indicator is used as a reference or changed. Both visible frame edges and widths are now asserted, rather than only card gap/width. Real full-roster Single Player and Online: start plus six actions each at 1440px and 1280px, 28 checkpoints PASS. Ten overview desktop/phone checks PASS. Screenshots at both desktop widths reviewed with matching frame columns and equal grid/frame dimensions. Runtime files: client-v13/online-overview.js and styles-online-overview.css. No gameplay changes; UNACCEPTED / UNPROMOTED.

Animation/layout regression correction: reproduced lower-card displacement of about 186px when a board shake replaces the frame centering transform and a scroll geometry update compensates the animated rectangle. Centering now uses the independent CSS translate property; column alignment subtracts transient transform translations before positioning cards. Shake timing/strength and gameplay unchanged. Regression samples six paused shake frames with scroll/layout updates: failed before, PASS after with stationary card and bounded intended shake. Ten overview cases and fourteen real Single Player/Online start/action checkpoints PASS. Runtime files: styles-online-overview.css and client-v13/online-overview.js. Indicator unchanged. UNACCEPTED / UNPROMOTED.

Authoritative Catapult rule correction: every new non-Plague Catapult hit now grants a Catapult benefit. Removed off-turn Archer nextShots++ and ordinary-shots ledger conversion; removed direct-source forced deferral on the owner turn. Owner-turn benefits use catapultNow; off-turn benefits use existing catapultLater plus Catapult ledger entry. Plague excluded. Existing duplicate-hit guard, turn-entry delivery, serialization, targeting/roll/RNG algorithms and visuals unchanged. Expanded archer-catapult-group-check.mjs with 66 deterministic cases (11 sources x own/off turn x 2/3/4 seats), duplicate hit checks, ordinary budget unchanged, pending/private restore and normal turn transitions, exactly one choice and five resolved contacts. Original eight Group cases covered own-turn chains only, leaving the off-turn exception untested; retained and PASS. Browser Archer chain deterministic state/RNG and single presentation PASS; Online Catapult five-frame single-group PASS; ten local Group authority/RNG parity groups PASS; TypeScript build PASS. Runtime changes only canonical/shared/combat/units/benefits.ts and generated canonical/compiled/combat/units/benefits.js. Physical retest: Archer hits Catapult off-turn -> next legal owner turn offers Catapult target choice; ordinary shot budget unchanged. UNACCEPTED / UNPROMOTED; no commit/push/merge/deployment.

Exact runtime/assets/test scope and physical retest list: playtest/BATTLEFIELD-DEPLOYMENT-REPORT.md. Prior accepted watchlist preserved. Private Registry untouched; test DBs/screenshots only in OS temp; checkpoint.journal remains disabled.
NO COMMIT / NO PUSH / NO MERGE / NO DEPLOYMENT. Stop for physical testing.

---

# ACCEPTED — Online / Single Player setup and causal fixes

2026-09-23; branch online-game-ui-phase1. Accepted parent/base: 6d37741720b94518da2d7a66d154fc7b8a77ec3a.
Scope: Online Create/Join/private discovery, 1/2/3-AI Single Player, Quick Start, classification/backfill tooling, Story Scout/Cleric, PLAYER/Main Menu cleanup and Monk retaliation targeting.
Final verification: 188 checks/groups plus accepted-base authority/RNG parity PASS; TypeScript and changed compiled output parity PASS.
Manifest: 994/994 PASS; SHA-256 441812518a61cd20781b7a7bb78882201b36c662e2c8559e0a444b04b662916a.
Exact commit scope and all eight non-blocking WATCHLIST entries: playtest/ONLINE-GAME-PHASE1-ACCEPTANCE.md. These are accepted watchlist items, not failed/unaccepted blockers.
Private Registry/backup and test artifacts excluded. checkpoint.journal remains disabled. Commit/push authorized; no merge or deployment.

---

# Monk direct-shot retaliation — UNACCEPTED / UNPROMOTED

Branch: online-game-ui-phase1. Direct retaliation uses the incoming authoritative attacker; Monk-deflect default targeting remains unchanged. Physical retest required; original physical cached-target divergence not reproduced from a fresh synchronized room.
Runtime scope: canonical Monk proximity source + compiled output only. Report: playtest/MONK-RETALIATION-REPORT.md.
37 focused groups plus accepted-base authority/RNG parity PASS. Manifest: 993/993 PASS; SHA-256 e23b528641aef3e7d85cf85de94bb9051fb5222e2dcb7938810dcf332bae1d24.
No commit, push, merge, deployment. Existing candidate work and watchlist preserved.

---

# Story causal fixes + entry wording — UNACCEPTED / UNPROMOTED

Branch: online-game-ui-phase1. Accepted baseline: 6d37741720b94518da2d7a66d154fc7b8a77ec3a.
Prior Online/local SP/Quick Start/classification work physically passed. Current follow-up adds missing local enemy-Scout footprints, requires executed Plague evidence for Cleric progression, uses MAIN MENU at Online entry, and visible PLAYER / AI / EMPTY terminology without changing internal controllers.
Report: playtest/STORY-CAUSAL-UI-REPORT.md. Prior reports: playtest/QUICK-START-CLASSIFICATION.md and playtest/SINGLE-PLAYER-LOCAL-GROUP.md.
102 focused checks/groups plus accepted-base authority/RNG parity PASS.
Manifest: 991/991 PASS; SHA-256 46182f105264c0b52326987ca39e73b63f04b970637d07601bea23e74fa1c3a6.
Recovery compatibility explicitly retains the previous candidate; host/checkpoint schema and combat/RNG unchanged. Private Registry untouched in this pass. checkpoint.journal remains disabled.
Await physical Story and wording retest. No commit, push, merge, deployment or acceptance. Existing watchlist unchanged.

---

# ACCEPTED — Result Screen / Game Log / physical cleanup

2026-09-22 physical acceptance. Branch result-screen-ui-phase1; parent/base c008851de246968eda21ae37e50484e3e2ffb7f7.
Manifest: 968/968 files; SHA-256 21a0537d824206f0cd1e9140420ad95ddf3458cf52a7484c529ae2f0203293d4.
Final focused checks passed: 9 logic groups, 17 browser checks, authority/RNG parity, real rematch lifecycle, Game Log history and final battlefield cleanup.

WATCHLIST only (not blockers):
- Unexpected multiplayer kick/seat loss: one physical incident, not reproduced.
- Pre-disconnect Game Log evidence was unavailable for that incident.
- Castle false reveal via Plague: observed once physically, not reproduced deterministically.
- Historical Archer -> Catapult missing-choice incident: unproven.

See playtest/RESULT-PHASE-ACCEPTANCE.md for exact included scope/exclusions and verification. This acceptance supersedes earlier candidate status sections below.
Next authorized phase: online-game-ui-phase1, directly from this accepted commit. Audit/proposal only until combined Online Game Create/Join structure is reviewed; no implementation yet. No merge or deployment.

---

# Game Log history / final battlefield cleanup — UNACCEPTED / UNPROMOTED

Branch result-screen-ui-phase1; HEAD unchanged c008851de246968eda21ae37e50484e3e2ffb7f7.
20 bounded match logs with selection/export, public Castle diagnostics, and completed-overview Demon effect cleanup. Castle false reveal not reproduced; disclosure rules unchanged. See playtest/GAME-LOG-HISTORY-CASTLE-REPORT.md for exact tests and limitations.
Manifest: 967 files; SHA-256 ff49b70fcf5ce9a038ab687f0b4388fb1cebc033400f24b98503203069ef8fd6.
No commit/push/merge/deployment. Physical retest pending.

---

# Result desktop fit micro-pass — UNACCEPTED / UNPROMOTED

Branch result-screen-ui-phase1. Smaller first/second/third podiums and tighter vertical spacing; fourth art and all text sizes preserved. Solo and duo/rat layouts fit at 1850x940 without scrolling. 9 logic groups + 17 desktop/phone browser checks PASS.
Manifest: 963 files; SHA-256 327c87fa8b294bbfb4881b4819152f46920f4b62907f591dc977ba97407487cf.
Details: playtest/RESULT-SCREEN-PHASE1-REPORT.md (desktop fit appendix). No commit/push/merge/deployment.

---

# Post-Result-Screen physical bug pass — UNACCEPTED / UNPROMOTED

Branch result-screen-ui-phase1; HEAD unchanged c008851de246968eda21ae37e50484e3e2ffb7f7.
Presentation replay/error settlement, disposal, target/cursor refresh and Goblin duplication corrections. Result art and all canonical bytes preserved. Archer -> Catapult pending-state tests pass locally and in Group workers/recovery; the physical missing-choice observation remains unresolved, NOT claimed fixed.

Manifest: 963 files; SHA-256 84e79d10147ba5e131c0ac0505b5090e451e7c4226a694d1d073ea8c0b32f88c.
Detailed findings, exact files, tests and physical retest: playtest/POST-RESULT-PHYSICAL-BUGS.md.
Minimal follow-up: removed the shootable-map outline only; cursor, target indication and input rules unchanged.
No commit/push/merge/deployment. Await physical retest.

---

# Result Screen supplied-art pass - UNACCEPTED / UNPROMOTED

Branch result-screen-ui-phase1; unchanged HEAD c008851de246968eda21ae37e50484e3e2ffb7f7. Eight supplied assets used directly; source bytes unchanged. Existing result logic, sequencing, identity and actions preserved. 9 logic groups, 21 browser checks, real Rematch and Main Menu/new-room paths PASS.

Manifest: 959/959 PASS; SHA-256 1de35226adca82e5e400dd7e148ee3a15c434888334041fe9bea7a1eb847329a.
Micro alignment: only 1ST/2ND/3RD text offsets adjusted inside wreaths; fourth and all platform/layout/behavior unchanged.

Exact changed files, asset mappings and responsive compromises: playtest/RESULT-SCREEN-PHASE1-REPORT.md. Await physical review; no commit/push/merge/deployment.

---

# Result Screen Visual Pass 2 — UNACCEPTED / UNPROMOTED

Branch `result-screen-ui-phase1`; unchanged HEAD/base `c008851de246968eda21ae37e50484e3e2ffb7f7`. Existing uncommitted first-pass implementation preserved. No commit/push/merge/deployment.

Visual-only material/atmosphere/ceremonial framing upgrade plus explicit public AI second-line `(AI)` identity. Geometry, result sequencing, actions, combat/RNG and statistics unchanged. Existing avatars untouched. 9 logic scenario groups and 20 desktop/narrow browser checks PASS; real-service rematch and Main Menu/new-room paths PASS without duplicate finalization. Broader first-pass evidence reused.

Current manifest: **951/951 files**, SHA-256 `15c8220040fff65dbdf0613921eb354895f354dc177f97437d19ff3acf387d47`. Report/evidence: `playtest/RESULT-SCREEN-PHASE1-REPORT.md` and `playtest/RESULT-SCREEN-PHASE1-EVIDENCE.json`. Visual review pending: richer than first pass, still lacks concept-quality illustrated background/podium/medal materials and small rat art. Do not promote or broaden work without user direction.

---

# Result Screen UI Phase 1 â€” UNACCEPTED / UNPROMOTED

Current development branch: `result-screen-ui-phase1`, unchanged HEAD/base `c008851de246968eda21ae37e50484e3e2ffb7f7`. The accepted Multiplayer UI Phase 1A checkpoint remains protected. No commit/push/merge/deployment.

Group-only final podium, dense/shared placements, final awards from authoritative facts, registered/Guest/NPC avatar identities, stable Cruns/Snurk/Rackler allocation and takeover, outcome-to-results sequencing, battlefield/rematch/menu actions and existing menu music are implemented for the first screenshot gate. User authorized closure/finalization when the last joined Human departs, preserving surrender/cutoff accounting and without a fourth NPC.

Verification: 9 logic scenario groups, 18 browser checks, accepted-base authority/RNG equality, real browser rematch and menu/new-room paths, and 8/8 relevant regression suites PASS. First-pass manifest (historical): 951/951 files, SHA-256 `e7e8beb9efeb73080d7f043742127d2e76a2530495d2c428c1cb2085465ba46f`. Details: `playtest/RESULT-SCREEN-PHASE1-REPORT.md` and evidence JSON. Canonical combat and avatar/audio bytes unchanged. Immediate accepted manifest added to the existing recovery allowlist; engine compatibility digest and journal-disabled behavior unchanged.

Visual review remains pending. The empty fourth platform has correct compression/label state but still needs a dedicated small rat asset. CSS material/platform treatment and simple award seals are more stylized than the supplied illustrated castle concept; artwork needs can be decided in the next visual pass. No avatar artwork generated, cropped or edited.

Retain non-blocking locked-click and dual-Plague natural-observation watchlists. Cumulative performance/Game Log/polling/persistence/fsync investigation stays deferred until after UI completion. Do not begin unrelated implementation.

---

# Previous checkpoint records (historical)

# Multiplayer UI Phase 1A â€” ACCEPTED

Physical acceptance was explicitly received on 2026-09-22. Accepted branch/checkpoint: `multiplayer-ui-phase1` / `multiplayer-ui-phase1a`. This acceptance commit is the new protected project checkpoint. Its parent is `9fd9ec7e9691f17c5a539ecf504660169af23d31` (Avatar/Profile); that parent is historical, not the current accepted checkpoint.

Accepted scope: accumulated Phase 1A battlefield/layout/transitions/final overview and physical fixes; rematch/liveness and stale-callback repair; Catapult single-presentation grouping; Scout target-owner footprint visibility with observer privacy; Archer/shared premature-paint correction; Story active-run/lifetime Story Path and Unit Lore separation; Start Over resets only the active run; independent authoritative same-target Plague identity/lifecycle; pending narration survives Main Menu until deployment; locked Multiplayer input is discarded, never queued.

Physical Story Path / Unit Lore / Goblin visibility, Start Over preserving lifetime unlocks, and Main Menu during narration â†’ Continue returning to narration all PASS.

Non-blocking WATCHLIST (accepted, not unresolved acceptance failures):
- Multiplayer locked-click/delayed-shot behavior: strong automated/browser coverage; continue natural physical observation.
- Dual same-target Plague: authoritative replacement defect fixed and independently verified; continue natural physical observation of rare pacing/presentation cases.

Deferred separate work: cumulative performance / Game Log / polling / persistence / fsync investigation after UI completion. Do not begin it in this acceptance task.

Final verification: 18/18 verification jobs PASS, including TypeScript compilation, the requested focused/browser/service/UI checks and the full existing runner (8/8 suites PASS). Named Story/storage/input/dual-Plague/continuation checks: 63/63. No new regression; no assertions weakened. Runtime/assets remain byte-identical to the physically accepted 941-file manifest `6be6d6d6b62453660ac80d9cfb5c07afe40858a91023945c8ca83ba6bb5ec7cf`; only acceptance/evidence/build/recovery-handoff metadata changed during acceptance. The immediate predecessor is added to the existing compatible local-recovery allowlist; no save is deleted or relabelled and checkpoint.journal remains disabled.

Only intended repository runtime, assets, regression tests, public synthetic fixture and useful project reports/manifests/handoffs are included. Private Registry databases, browser profiles, captures, scratch probes, workspace outputs and machine-local test artifacts are excluded. Earlier reports/status entries below are historical and superseded by this acceptance.

Acceptance commit/push is authorized. No merge or deployment. Next branch: `result-screen-ui-phase1`, created directly from the pushed acceptance commit, with no Result Screen implementation yet.

Final manifest: **941/941 files**, SHA-256 `545f5a55b326e8c44212cd7f1e49dc997cd8c7d5f67ce6f241f1607ffefd6b96`. The full commit identity is the Git commit containing this acceptance record; `multiplayer-ui-phase1` is the accepted reference.

---

# Historical handoff entries

# Latest â€” pre-commit Story / dual-Plague / input fixes (UNACCEPTED)

Branch `multiplayer-ui-phase1`; HEAD/base unchanged: `9fd9ec7e9691f17c5a539ecf504660169af23d31`. Existing Phase 1A and overnight fixes remain. Active Story run is separate from lifetime unlocks, with run-bound completed checkpoints and safe Start Over. Narration returns after Main Menu. Same-board Plagues retain separate IDs/frontiers/steps/attribution. Locked pointer gestures and playback clicks cannot queue shots. No authored pacing change.

Focused checks 63/63 plus real service/browser dual-outbreak timelines; existing Story account checks 11/11; full regression runner 8/8 suites PASS. Current UI/privacy/animation/host-RNG parity, heartbeat and bounded capture checks PASS. Manifest 941/941, SHA-256 `6be6d6d6b62453660ac80d9cfb5c07afe40858a91023945c8ca83ba6bb5ec7cf`. No private Registry migration or test data packaged; journal remains disabled. No staging, commit, push, merge, promotion or deployment. Await physical testing; exact report, change list, limitations and checklist: `playtest/MULTIPLAYER-UI-PRECOMMIT-REPORT.md`; evidence: `playtest/MULTIPLAYER-UI-PRECOMMIT-EVIDENCE.json`. Earlier entries are historical.

---

# Latest â€” Phase 1A overnight lifecycle/projectile/Scout fixes (UNACCEPTED)

Branch multiplayer-ui-phase1; HEAD/base unchanged: 9fd9ec7e9691f17c5a539ecf504660169af23d31. Heartbeat starvation during busy playback and post-playback stale poll overwrite reproduced and repaired. Catapult double cue allocation fixed; Scout own-board activity visible to owner; premature Archer paint removed. Full regression 8/8 suites PASS; 17 matches / 14 rematch transitions PASS; targeted privacy/parity/browser/layout checks PASS. Manifest 932/932; SHA-256 c41b021e5afc40b11a8cb3de4b262dd5431c1917589a6e97425c99035f4f400b. Optional polish deferred. Await physical retest. No commit/push/merge/promote/deploy. Details: playtest/MULTIPLAYER-UI-OVERNIGHT-REPORT.md and evidence JSON. Prior notes are historical.

---

# Latest â€” eliminated-observer frame cleanup (UNACCEPTED)

Removed retired primary frame/title scaffolding only after settled elimination; spectator dial is contained above survivor headers. Runtime changes: client-v13/online-overview.js, styles-online-overview.css. Focused browser transition/disposal/audio checks and portable privacy/final-overview checks PASS. Manifest 929/929 files; SHA-256 6465eac46b0b808b0f94728bed37a3cdac1b280be2478beecaeb3b2bfca8fad6. No gameplay/privacy changes, commit, push, merge or deployment. Await physical retest. Details in playtest/MULTIPLAYER-UI-FIX1-REPORT.md. Prior notes below are historical.

---

# UNACCEPTED â€” Multiplayer UI Phase 1A physical fix pass 1

Branch multiplayer-ui-phase1; HEAD/base unchanged: 9fd9ec7e9691f17c5a539ecf504660169af23d31. Do not commit/push/merge/promote/deploy. Await desktop physical retest.

Supersedes the centered third-board and reduced final-layout design below: third board is bottom-left; final matches restore all original participants exactly once with authorized global unit reveal after playback. Compact full-roster layout, SVG arrowheads, settled 230 ms slides, central dial anchoring. Confirmed secondary Plague attribution bug fixed by exact participant filtering; accepted host/RNG replay remains identical.

Verification: 929/929 files PASS. Manifest SHA-256 a6d49ee18bf27729b0297428bbf3d255432f5f238b2929d3d24bc5c55f3a959d. Existing regression runner 8/8 suites PASS; targeted privacy, authoritative replay, 2/3/4 final reveal, full-roster desktop/phone geometry, five special animations and transition/disposal/SFX checks PASS. 684 protected engine/assets/account/statistics/audio files unchanged.

Report: playtest/MULTIPLAYER-UI-FIX1-REPORT.md. Evidence: playtest/MULTIPLAYER-UI-FIX1-EVIDENCE.json. New portable regression: node playtest/tools/online-final-overview-check.mjs. Run playtest/PLAYTEST-LAN.cmd for physical testing. No new phone design or audio policy. Prior notes are historical.

---

# UNACCEPTED â€” Multiplayer UI Phase 1A

Branch multiplayer-ui-phase1. HEAD/base remains accepted Avatar/Profile commit 9fd9ec7e9691f17c5a539ecf504660169af23d31. Candidate: playtest/. No commit, push, merge or deployment authorized/performed. Stop for physical PC/phone testing. Earlier acceptance entries below are historical.

Implemented Online-only turn dial, public secondary battlefields/unit strips, surviving-ring routes, ordered special playback and settled elimination transitions. No engine, Registry, statistics, artwork or audio-policy changes. Scout remains observer+target scoped.

Verification: 926/926 manifest files PASS. Manifest SHA-256: 712c592758d37db33fee280e76210dc4debc50287752e24dee0f63c8d137a20a. Existing full runner 8/8 suites PASS; Avatar and recovery checks PASS. Targeted layout, animation, elimination, disposal, privacy, local-mode and exact accepted-host/RNG comparison tests PASS. 684 protected engine/assets/Registry/statistics/audio files unchanged.

Report: playtest/MULTIPLAYER-UI-PHASE1A-REPORT.md. Evidence: playtest/MULTIPLAYER-UI-PHASE1A-EVIDENCE.json. Portable privacy regression: node playtest/tools/online-overview-check.mjs. Normal playtest: double-click playtest/PLAYTEST-LAN.cmd. First-pass phone compromise: secondary cards stack vertically. Final art polish and cross-board Catapult are not part of this phase.

---

# ACCEPTED â€” Avatar / Profile Phase 1 + Recovery Cleanup

Git publication BLOCKED: git add cannot create .git/index.lock (Permission denied) despite explicit repository and Git metadata grants. Nothing staged/committed/pushed by this acceptance operation. HEAD remains the accepted parent b7ca2917303e91610c9512c68438e25b72c628e2. The verified 78-file acceptance payload is prepared for manual commit.

Physical acceptance recorded. Branch avatar-profile-phase1; direct accepted Phase 3 parent b7ca2917303e91610c9512c68438e25b72c628e2. Manifest 0a867707abf000bacd3f2d2a3827da624c86e7ce9f45e916feafe055cc3b063b; 919 files. User PASS: registration, Profile, unlimited avatar changes, persistence, Hero unlocks, Guest identity, reserved special AI mappings and stale recovery-warning cleanup. Actionable recovery errors preserved. No regressions observed in HOF/statistics/rematch/audio. Runtime unchanged during acceptance. Git records commit/publication status. No merge, deployment or next-phase work.

Report: playtest/AVATAR-PROFILE-REPORT.md. Evidence: playtest/AVATAR-PROFILE-EVIDENCE.json. Final verification: normal 919-file manifest check. Original 63 avatar PNG bytes preserved. Private Registry/runtime databases, test accounts, browser screenshots/profiles, source archives and workspace harnesses excluded. Earlier candidate headings below are historical and superseded.

Exact checkpoint file inventory (78 changed/new files):

- CURRENT-STATE.md
- HANDOFF.md
- playtest/build-manifest.json
- playtest/client-v13/bootstrap-production.js
- playtest/client-v13/registry.js
- playtest/server/main.mjs
- playtest/server/registry.mjs
- playtest/server/statistics-store.mjs
- playtest/tools/local-recovery-contract.json
- playtest/AVATAR-PROFILE-EVIDENCE.json
- playtest/AVATAR-PROFILE-REPORT.md
- playtest/assets/avatars/basic_female_01.png
- playtest/assets/avatars/basic_female_02.png
- playtest/assets/avatars/basic_female_03.png
- playtest/assets/avatars/basic_female_04.png
- playtest/assets/avatars/basic_female_05.png
- playtest/assets/avatars/basic_male_01.png
- playtest/assets/avatars/basic_male_02.png
- playtest/assets/avatars/basic_male_03.png
- playtest/assets/avatars/basic_male_04.png
- playtest/assets/avatars/basic_male_05.png
- playtest/assets/avatars/catalog.mjs
- playtest/assets/avatars/cruns_a.png
- playtest/assets/avatars/dwarf_female_01.png
- playtest/assets/avatars/dwarf_female_02.png
- playtest/assets/avatars/dwarf_female_03.png
- playtest/assets/avatars/dwarf_female_04.png
- playtest/assets/avatars/dwarf_female_05.png
- playtest/assets/avatars/dwarf_male_01.png
- playtest/assets/avatars/dwarf_male_02.png
- playtest/assets/avatars/dwarf_male_03.png
- playtest/assets/avatars/dwarf_male_04.png
- playtest/assets/avatars/dwarf_male_05.png
- playtest/assets/avatars/elf_female_01.png
- playtest/assets/avatars/elf_female_02.png
- playtest/assets/avatars/elf_female_03.png
- playtest/assets/avatars/elf_female_04.png
- playtest/assets/avatars/elf_female_05.png
- playtest/assets/avatars/elf_male_01.png
- playtest/assets/avatars/elf_male_02.png
- playtest/assets/avatars/elf_male_03.png
- playtest/assets/avatars/elf_male_04.png
- playtest/assets/avatars/elf_male_05.png
- playtest/assets/avatars/goblin_01.png
- playtest/assets/avatars/goblin_02.png
- playtest/assets/avatars/goblin_03.png
- playtest/assets/avatars/goblin_04.png
- playtest/assets/avatars/goblin_05.png
- playtest/assets/avatars/goblin_06.png
- playtest/assets/avatars/goblin_07.png
- playtest/assets/avatars/goblin_08.png
- playtest/assets/avatars/goblin_09.png
- playtest/assets/avatars/goblin_10.png
- playtest/assets/avatars/human_female_01.png
- playtest/assets/avatars/human_female_02.png
- playtest/assets/avatars/human_female_03.png
- playtest/assets/avatars/human_female_04.png
- playtest/assets/avatars/human_female_05.png
- playtest/assets/avatars/human_female_06.png
- playtest/assets/avatars/human_female_07.png
- playtest/assets/avatars/human_female_08.png
- playtest/assets/avatars/human_female_09.png
- playtest/assets/avatars/human_female_10.png
- playtest/assets/avatars/human_male_01.png
- playtest/assets/avatars/human_male_02.png
- playtest/assets/avatars/human_male_03.png
- playtest/assets/avatars/human_male_04.png
- playtest/assets/avatars/human_male_05.png
- playtest/assets/avatars/human_male_06.png
- playtest/assets/avatars/human_male_07.png
- playtest/assets/avatars/human_male_08.png
- playtest/assets/avatars/human_male_09.png
- playtest/assets/avatars/human_male_10.png
- playtest/assets/avatars/rackler_a.png
- playtest/assets/avatars/snurk_a.png
- playtest/client-v13/avatar-picker.js
- playtest/styles-avatars.css
- playtest/tools/avatar-check.mjs

---

# Avatar/Profile Phase 1 â€” recovery notice presentation correction

UNACCEPTED / UNPROMOTED. Stale/default startup recovery notice removed from normal Main Menu; actionable and explicit resume failures retain feedback. Local recovery, saved hosts, Single Player/Story fallback and Online/Rejoin unchanged. Focused recovery regression and Avatar server/desktop/phone checks PASS. Manifest bf151a6844b75dabf03907953b09f3b70b9bb6f3ea8e236177bbb3d4a2f72e6c; 919 files. No commit/push/promotion. See playtest/AVATAR-PROFILE-REPORT.md. Supersedes the earlier candidate digest below.

---

# DEVELOPMENT CANDIDATE â€” Avatar / Profile Phase 1

UNACCEPTED / UNPROMOTED, 2026-09-21. Branch avatar-profile-phase1 remains directly at accepted Phase 3 parent b7ca2917303e91610c9512c68438e25b72c628e2. No Git metadata, commit, push, merge or deployment. Candidate: playtest/. Manifest: 20cdf6574955e21af91c2a6d3bc7e19d16782a6075333b6d1b160eea7e9bdc36; 919 files.

Report: playtest/AVATAR-PROFILE-REPORT.md. Evidence: playtest/AVATAR-PROFILE-EVIDENCE.json. Avatar storage/server suite and desktop/phone browser suite PASS; five inherited HOF/audio/live rematch/statistics suites PASS. 63 supplied PNGs copied byte-identically. No private/test databases included. Physical avatar testing pending.

Uses existing Registry avatar fields, immediate unlimited Profile selection, permanent Story/five-finalized-win unlocks, Guest Goblin identity and reserved Cruns/Snurk/Rackler A mappings. Picker only in Registration/Profile. HOF appearance, original assets, gameplay engine, music, SFX and Narrator unchanged. HOF polish and Multiplayer UI avatar placements deferred. Earlier accepted checkpoints remain protected.

---

# ACCEPTED â€” Registry / Hall of Fame Phase 3 + Audio Options

Publication status: BLOCKED by Git metadata permissions. git add cannot create .git/index.lock (Permission denied), including after explicit repository and .git grants. Nothing staged; no acceptance commit or push performed. Prepared physical acceptance remains valid. HEAD stays c901711908036e0ccc7180a65fd2acdd555d8070.

Physical acceptance: 2026-09-21. Branch: registry-hof-phase3. Direct parent/base: c901711908036e0ccc7180a65fd2acdd555d8070 (accepted post-phase2-batch1). Manifest: fa9f3d35a739e09218a0f33a2d530dca468ed79193f96d7cab1110669e8fde3c; 850 files. Payload: playtest/. Report: playtest/PHASE3-REPORT.md; automated evidence: playtest/PHASE3-EVIDENCE.json. Eight focused suites previously PASS; final acceptance uses the normal manifest verification only.

Physical PASS: HOF, all three mode rankings/details, nationality flags, all four audio controls, Plague as SFX, rematch, statistics. Scout and Monk stable through repeated physical games. Relevant opponent battlefield Plague ambience is intentional and accepted. HOF visual polish is deferred/non-blocking. No gameplay, UI, audio or policy changes during acceptance. No avatar work, merge or deployment. Earlier unaccepted headings below are historical and superseded. Git commit and remote refs identify publication status.

Exact prepared file inventory (271 files; includes this document and HANDOFF):

- CURRENT-STATE.md
- HANDOFF.md
- playtest/StoneThrow-v1.427-stage13-development.html
- playtest/StoneThrow-v1.427-stage13-production.html
- playtest/build-manifest.json
- playtest/client-v13/combat-feedback.js
- playtest/client-v13/music.js
- playtest/client-v13/presentation.js
- playtest/client-v13/registry.js
- playtest/client/story-presentation.js
- playtest/server/main.mjs
- playtest/server/statistics-store.mjs
- playtest/tools/local-recovery-contract.json
- playtest/tools/playtest.mjs
- playtest/PHASE3-EVIDENCE.json
- playtest/PHASE3-REPORT.md
- playtest/assets/ui/flags/ATTRIBUTION.md
- playtest/assets/ui/flags/LICENSE.txt
- playtest/assets/ui/flags/ad.svg
- playtest/assets/ui/flags/ae.svg
- playtest/assets/ui/flags/af.svg
- playtest/assets/ui/flags/ag.svg
- playtest/assets/ui/flags/ai.svg
- playtest/assets/ui/flags/al.svg
- playtest/assets/ui/flags/am.svg
- playtest/assets/ui/flags/ao.svg
- playtest/assets/ui/flags/aq.svg
- playtest/assets/ui/flags/ar.svg
- playtest/assets/ui/flags/as.svg
- playtest/assets/ui/flags/at.svg
- playtest/assets/ui/flags/au.svg
- playtest/assets/ui/flags/aw.svg
- playtest/assets/ui/flags/ax.svg
- playtest/assets/ui/flags/az.svg
- playtest/assets/ui/flags/ba.svg
- playtest/assets/ui/flags/bb.svg
- playtest/assets/ui/flags/bd.svg
- playtest/assets/ui/flags/be.svg
- playtest/assets/ui/flags/bf.svg
- playtest/assets/ui/flags/bg.svg
- playtest/assets/ui/flags/bh.svg
- playtest/assets/ui/flags/bi.svg
- playtest/assets/ui/flags/bj.svg
- playtest/assets/ui/flags/bl.svg
- playtest/assets/ui/flags/bm.svg
- playtest/assets/ui/flags/bn.svg
- playtest/assets/ui/flags/bo.svg
- playtest/assets/ui/flags/bq.svg
- playtest/assets/ui/flags/br.svg
- playtest/assets/ui/flags/bs.svg
- playtest/assets/ui/flags/bt.svg
- playtest/assets/ui/flags/bv.svg
- playtest/assets/ui/flags/bw.svg
- playtest/assets/ui/flags/by.svg
- playtest/assets/ui/flags/bz.svg
- playtest/assets/ui/flags/ca.svg
- playtest/assets/ui/flags/cc.svg
- playtest/assets/ui/flags/cd.svg
- playtest/assets/ui/flags/cf.svg
- playtest/assets/ui/flags/cg.svg
- playtest/assets/ui/flags/ch.svg
- playtest/assets/ui/flags/ci.svg
- playtest/assets/ui/flags/ck.svg
- playtest/assets/ui/flags/cl.svg
- playtest/assets/ui/flags/cm.svg
- playtest/assets/ui/flags/cn.svg
- playtest/assets/ui/flags/co.svg
- playtest/assets/ui/flags/cr.svg
- playtest/assets/ui/flags/cu.svg
- playtest/assets/ui/flags/cv.svg
- playtest/assets/ui/flags/cw.svg
- playtest/assets/ui/flags/cx.svg
- playtest/assets/ui/flags/cy.svg
- playtest/assets/ui/flags/cz.svg
- playtest/assets/ui/flags/de.svg
- playtest/assets/ui/flags/dj.svg
- playtest/assets/ui/flags/dk.svg
- playtest/assets/ui/flags/dm.svg
- playtest/assets/ui/flags/do.svg
- playtest/assets/ui/flags/dz.svg
- playtest/assets/ui/flags/ec.svg
- playtest/assets/ui/flags/ee.svg
- playtest/assets/ui/flags/eg.svg
- playtest/assets/ui/flags/eh.svg
- playtest/assets/ui/flags/er.svg
- playtest/assets/ui/flags/es.svg
- playtest/assets/ui/flags/et.svg
- playtest/assets/ui/flags/fi.svg
- playtest/assets/ui/flags/fj.svg
- playtest/assets/ui/flags/fk.svg
- playtest/assets/ui/flags/fm.svg
- playtest/assets/ui/flags/fo.svg
- playtest/assets/ui/flags/fr.svg
- playtest/assets/ui/flags/ga.svg
- playtest/assets/ui/flags/gb.svg
- playtest/assets/ui/flags/gd.svg
- playtest/assets/ui/flags/ge.svg
- playtest/assets/ui/flags/gf.svg
- playtest/assets/ui/flags/gg.svg
- playtest/assets/ui/flags/gh.svg
- playtest/assets/ui/flags/gi.svg
- playtest/assets/ui/flags/gl.svg
- playtest/assets/ui/flags/gm.svg
- playtest/assets/ui/flags/gn.svg
- playtest/assets/ui/flags/gp.svg
- playtest/assets/ui/flags/gq.svg
- playtest/assets/ui/flags/gr.svg
- playtest/assets/ui/flags/gs.svg
- playtest/assets/ui/flags/gt.svg
- playtest/assets/ui/flags/gu.svg
- playtest/assets/ui/flags/gw.svg
- playtest/assets/ui/flags/gy.svg
- playtest/assets/ui/flags/hk.svg
- playtest/assets/ui/flags/hm.svg
- playtest/assets/ui/flags/hn.svg
- playtest/assets/ui/flags/hr.svg
- playtest/assets/ui/flags/ht.svg
- playtest/assets/ui/flags/hu.svg
- playtest/assets/ui/flags/id.svg
- playtest/assets/ui/flags/ie.svg
- playtest/assets/ui/flags/il.svg
- playtest/assets/ui/flags/im.svg
- playtest/assets/ui/flags/in.svg
- playtest/assets/ui/flags/io.svg
- playtest/assets/ui/flags/iq.svg
- playtest/assets/ui/flags/ir.svg
- playtest/assets/ui/flags/is.svg
- playtest/assets/ui/flags/it.svg
- playtest/assets/ui/flags/je.svg
- playtest/assets/ui/flags/jm.svg
- playtest/assets/ui/flags/jo.svg
- playtest/assets/ui/flags/jp.svg
- playtest/assets/ui/flags/ke.svg
- playtest/assets/ui/flags/kg.svg
- playtest/assets/ui/flags/kh.svg
- playtest/assets/ui/flags/ki.svg
- playtest/assets/ui/flags/km.svg
- playtest/assets/ui/flags/kn.svg
- playtest/assets/ui/flags/kp.svg
- playtest/assets/ui/flags/kr.svg
- playtest/assets/ui/flags/kw.svg
- playtest/assets/ui/flags/ky.svg
- playtest/assets/ui/flags/kz.svg
- playtest/assets/ui/flags/la.svg
- playtest/assets/ui/flags/lb.svg
- playtest/assets/ui/flags/lc.svg
- playtest/assets/ui/flags/li.svg
- playtest/assets/ui/flags/lk.svg
- playtest/assets/ui/flags/lr.svg
- playtest/assets/ui/flags/ls.svg
- playtest/assets/ui/flags/lt.svg
- playtest/assets/ui/flags/lu.svg
- playtest/assets/ui/flags/lv.svg
- playtest/assets/ui/flags/ly.svg
- playtest/assets/ui/flags/ma.svg
- playtest/assets/ui/flags/mc.svg
- playtest/assets/ui/flags/md.svg
- playtest/assets/ui/flags/me.svg
- playtest/assets/ui/flags/mf.svg
- playtest/assets/ui/flags/mg.svg
- playtest/assets/ui/flags/mh.svg
- playtest/assets/ui/flags/mk.svg
- playtest/assets/ui/flags/ml.svg
- playtest/assets/ui/flags/mm.svg
- playtest/assets/ui/flags/mn.svg
- playtest/assets/ui/flags/mo.svg
- playtest/assets/ui/flags/mp.svg
- playtest/assets/ui/flags/mq.svg
- playtest/assets/ui/flags/mr.svg
- playtest/assets/ui/flags/ms.svg
- playtest/assets/ui/flags/mt.svg
- playtest/assets/ui/flags/mu.svg
- playtest/assets/ui/flags/mv.svg
- playtest/assets/ui/flags/mw.svg
- playtest/assets/ui/flags/mx.svg
- playtest/assets/ui/flags/my.svg
- playtest/assets/ui/flags/mz.svg
- playtest/assets/ui/flags/na.svg
- playtest/assets/ui/flags/nc.svg
- playtest/assets/ui/flags/ne.svg
- playtest/assets/ui/flags/nf.svg
- playtest/assets/ui/flags/ng.svg
- playtest/assets/ui/flags/ni.svg
- playtest/assets/ui/flags/nl.svg
- playtest/assets/ui/flags/no.svg
- playtest/assets/ui/flags/np.svg
- playtest/assets/ui/flags/nr.svg
- playtest/assets/ui/flags/nu.svg
- playtest/assets/ui/flags/nz.svg
- playtest/assets/ui/flags/om.svg
- playtest/assets/ui/flags/pa.svg
- playtest/assets/ui/flags/pe.svg
- playtest/assets/ui/flags/pf.svg
- playtest/assets/ui/flags/pg.svg
- playtest/assets/ui/flags/ph.svg
- playtest/assets/ui/flags/pk.svg
- playtest/assets/ui/flags/pl.svg
- playtest/assets/ui/flags/pm.svg
- playtest/assets/ui/flags/pn.svg
- playtest/assets/ui/flags/pr.svg
- playtest/assets/ui/flags/ps.svg
- playtest/assets/ui/flags/pt.svg
- playtest/assets/ui/flags/pw.svg
- playtest/assets/ui/flags/py.svg
- playtest/assets/ui/flags/qa.svg
- playtest/assets/ui/flags/re.svg
- playtest/assets/ui/flags/ro.svg
- playtest/assets/ui/flags/rs.svg
- playtest/assets/ui/flags/ru.svg
- playtest/assets/ui/flags/rw.svg
- playtest/assets/ui/flags/sa.svg
- playtest/assets/ui/flags/sb.svg
- playtest/assets/ui/flags/sc.svg
- playtest/assets/ui/flags/sd.svg
- playtest/assets/ui/flags/se.svg
- playtest/assets/ui/flags/sg.svg
- playtest/assets/ui/flags/sh.svg
- playtest/assets/ui/flags/si.svg
- playtest/assets/ui/flags/sj.svg
- playtest/assets/ui/flags/sk.svg
- playtest/assets/ui/flags/sl.svg
- playtest/assets/ui/flags/sm.svg
- playtest/assets/ui/flags/sn.svg
- playtest/assets/ui/flags/so.svg
- playtest/assets/ui/flags/sr.svg
- playtest/assets/ui/flags/ss.svg
- playtest/assets/ui/flags/st.svg
- playtest/assets/ui/flags/sv.svg
- playtest/assets/ui/flags/sx.svg
- playtest/assets/ui/flags/sy.svg
- playtest/assets/ui/flags/sz.svg
- playtest/assets/ui/flags/tc.svg
- playtest/assets/ui/flags/td.svg
- playtest/assets/ui/flags/tf.svg
- playtest/assets/ui/flags/tg.svg
- playtest/assets/ui/flags/th.svg
- playtest/assets/ui/flags/tj.svg
- playtest/assets/ui/flags/tk.svg
- playtest/assets/ui/flags/tl.svg
- playtest/assets/ui/flags/tm.svg
- playtest/assets/ui/flags/tn.svg
- playtest/assets/ui/flags/to.svg
- playtest/assets/ui/flags/tr.svg
- playtest/assets/ui/flags/tt.svg
- playtest/assets/ui/flags/tv.svg
- playtest/assets/ui/flags/tw.svg
- playtest/assets/ui/flags/tz.svg
- playtest/assets/ui/flags/ua.svg
- playtest/assets/ui/flags/ug.svg
- playtest/assets/ui/flags/um.svg
- playtest/assets/ui/flags/us.svg
- playtest/assets/ui/flags/uy.svg
- playtest/assets/ui/flags/uz.svg
- playtest/assets/ui/flags/va.svg
- playtest/assets/ui/flags/vc.svg
- playtest/assets/ui/flags/ve.svg
- playtest/assets/ui/flags/vg.svg
- playtest/assets/ui/flags/vi.svg
- playtest/assets/ui/flags/vn.svg
- playtest/assets/ui/flags/vu.svg
- playtest/assets/ui/flags/wf.svg
- playtest/assets/ui/flags/ws.svg
- playtest/assets/ui/flags/ye.svg
- playtest/assets/ui/flags/yt.svg
- playtest/assets/ui/flags/za.svg
- playtest/assets/ui/flags/zm.svg
- playtest/assets/ui/flags/zw.svg
- playtest/client-v13/hall-of-fame.js
- playtest/client/audio-options.js
- playtest/server/hall-of-fame.mjs
- playtest/styles-phase3.css

---

# DEVELOPMENT CANDIDATE â€” Registry / Hall of Fame Phase 3 + Audio Options

UNACCEPTED / UNPROMOTED, 2026-09-21. Branch registry-hof-phase3 remains based directly on accepted post-phase2-batch1 commit c901711908036e0ccc7180a65fd2acdd555d8070. No commit, push, merge or deployment performed.

Candidate: playtest/. Manifest: 06fbb6abe0df8560d8a0a86b09b9eabea0249be0bc7cc0e5b9e03e5f31f6924c; 850 files. Detailed report: playtest/PHASE3-REPORT.md. Sanitized verification summary: playtest/PHASE3-EVIDENCE.json. Eight focused suites PASS, including desktop/phone-sized browser, live authoritative finalization/account isolation, rematch, music routing and audio preference checks. Physical listening and HOF testing pending.

HOF uses current Registry Display Name and nationality flags, immutable Player ID, three multiplayer modes and six categories. Public 10-Full qualification remains server-enforced; local playtest/development inspection bypass is server-controlled. Audio Options adds Master/Music/SFX/Narrator toggles and sliders; Plague layers use SFX. Gameplay/engine and original audio/artwork assets remain byte-identical. Recovery predecessor metadata includes the accepted parent without changing engine compatibility.

Scout observer/target privacy and Plague ambience lifetime remain WATCHLIST ONLY, unchanged. No score formula, gameplay polish, account migration or private Registry data included. All older acceptance/status entries below are historical.

---

# ACCEPTED â€” post-phase2-batch1

Git completion blocker (2026-09-21): final verification PASS (593/593), focused rematch/account checks PASS, music 7/7 PASS. Git add fails creating .git/index.lock with Permission denied even after explicit repository and .git write grants. No files staged, no acceptance commit or push performed. Prepared 77-file payload remains physically ACCEPTED; Git publication is pending. HEAD remains 0d2c6b35f9b39692e65f1a2c8be61b927a686055 on post-phase2-batch1. No branch restructuring, merge or deployment.

Physically accepted 2026-09-21. Base: registry-phase2-v1, 0d2c6b35f9b39692e65f1a2c8be61b927a686055. Current manifest: 887e62ec05a5692911b21358d4a743ed423d9d78e4360c7f9553946bd789ee8d; 593 files. Payload: playtest/. Acceptance record: playtest/ACCEPTANCE.md. Exact promotion inventory: promotion/POST-PHASE2-ACCEPTANCE.json.

Multiplayer lifecycle/remount, rematch, statistics/account attribution, registered Online identity, startup splash and continuous music physically PASS. The observed AI 171-cell chain did not enter Human career. Scout observer/target privacy and Plague ambience lifetime remain non-blocking WATCHLIST items, not failed/unaccepted work; no changes made to either during acceptance. Polish deferred. Earlier unaccepted report headings below are historical and superseded for this payload.

Normal manifest and focused rematch/account/music verification required before commit. Runtime/assets preserved exactly from physical acceptance. No private Registry/runtime/test database payload included. No merge, deployment or next development phase authorized.

---

# Latest overnight rematch + statistics audit â€” UNACCEPTED / UNPROMOTED

2026-09-21. Candidate: C:/Users/Notandi/Documents/GitHub/Stone-Throw/playtest. Manifest SHA-256: 0bcea80118069a1e5f1c23f295c415f20ced5313df758df2407e1b20ef63d351; normal verification 592/592 PASS.

Reproduced Group REMATCH SETUP created while busy and cached with APPLY SETUP disabled after request completion. Fixed request-state synchronization without changing authoritative configuration/seat rules. Found and fixed statistics heroReceived bypassing the former Human's takeover event cutoff. No historical backfill. Runtime changes only client-v13/group-lan.js and server/statistics-metrics.mjs. Canonical engine, music/assets, Scout/Plague, Registry storage/query and transport bytes unchanged in this task.

Ten final suite entries PASS: real Group AI and two-Human same-document rematches; genuine SP/Duel/3/4 finalization; Story exclusion; live Rejoin host-state preservation; same-account desktop/phone contexts and account switch; additive/max/awards/global invariants; restart/idempotence; 47 combat/RNG parity cases; reliability/identity and music checks. No duplicate finalization found. Physical separate-device retest still required; live AFK enforcement remains outside implemented scope. Test accounts/databases isolated; real Registry untouched.

Detailed report: playtest/OVERNIGHT-REMATCH-STATISTICS-AUDIT.md. Evidence: playtest/OVERNIGHT-REMATCH-STATISTICS-EVIDENCE.json. Workspace harnesses: outputs/post-phase2-batch2/overnight-*.mjs and overnight-suite-results.json. Stop for physical retest. No commit/push/promotion/deployment. Earlier entries are historical.

---

# Latest Batch 2 Online lifecycle correction â€” UNACCEPTED / UNPROMOTED

Manifest SHA-256: 003d5ff5b82bce2fbcaa9a54475287a7f4f86660d552cedd93b80014a22671aa. Verification: 590/590 PASS.

Reproduced and fixed Victory â†’ Main Menu replaying a saved local loss, and new Group deployment inheriting another room's playback cursors and rendering no grid. Menu return now suspends the local renderer; Online playback caches are scoped to room/seat/match; disposed renderers reject late updates. Group Leave resynchronizes its request-disabled state. Runtime files: client-v13/story-browser.js, client-v13/presentation.js, client-v13/group-lan.js.

Real service/browser checks PASS: desktop and phone-sized Group victory â†’ menu â†’ new three-seat Group; desktop Duel victory â†’ new Group; 225 deployment cells, Random/Ready/start, one Victory only, unchanged finalized records/career aggregates, same document and continuous music instance. Existing identity/Rejoin flows and eight music-routing flows PASS; seven music checks PASS. Scout/Plague and authoritative gameplay files unchanged in this correction.

Report: playtest/ONLINE-REMOUNT-FOLLOWUP.md. Evidence: playtest/ONLINE-REMOUNT-EVIDENCE.json. Stop for physical retest. No commit, push, promotion or deployment. Earlier entries below are historical.

---

# Latest Batch 2 Scout privacy / Plague ambience follow-up â€” UNACCEPTED / UNPROMOTED

Manifest 5ac467849412b6f557cfc2697c45831da4989a549a29243249d0f74f13a7665b; 588/588 verification PASS. Group Scout footprints now use the exact observer/target knowledge pair. A public active-spread boolean gates existing Plague ambience/intensity, instead of historical infected-cell marks. Same tracks, levels and fades; no combat/AI/RNG/state rule changes. Startup/identity/music routing remains intact.

Focused worker-backed four-seat Scout/elimination regression, 1440/390 browser DOM/audio checks, five-step/contained/multiple/visible-board lifecycle checks, existing 22-case Plague continuation suite, 23 Batch 2 checks, seven music-controller checks and TypeScript all PASS. Report: playtest/SCOUT-PLAGUE-FOLLOWUP.md; evidence: playtest/SCOUT-PLAGUE-EVIDENCE.json. Stop for physical retest. No commit/push/promotion/deployment. Prior entries are history.

---

# Latest Batch 2 startup entry / Online audio continuity â€” UNACCEPTED / UNPROMOTED

Current playtest manifest 2ce908695eee35a0a3fbe4aef902c874f083d8b8549c9d9f292848bde81d5a7a, 583/583 verified. Full-screen existing-banner gate uses authoritative Registry /me welcome copy (generic for Guest). Real tap/click/keyboard Enter unlocks Exploration; gate exists once per document. Ordinary Create/Join/Leave/result return mount the server-selected seat in place, preserving audio context; real reload/exceptional recovery gets a new entry gate. No track/mix or gameplay changes.

PASS: 8 desktop/phone real-service routing flows; 4 startup/Create/Join/refresh/Rejoin flows plus 2 local internal-menu returns; 4 registered identity flows plus logout/Guest; 7 controller checks. Ready/Start preserve advancing Eye of the Storm; no duplicate instances. Canonical, server authority/Registry/persistence logic and all assets byte-identical to pre-task candidate. Existing Group third-disconnect takeover remains intact. Journal disabled.

Report: playtest/STARTUP-ENTRY.md. Evidence: playtest/STARTUP-ENTRY-EVIDENCE.json; workspace outputs/post-phase2-batch2/startup-* checks/screenshots. Stop for physical desktop/phone listening test. No commit, push, promotion or deployment. Prior entries below are history.

---

# Latest Batch 2 music routing follow-up â€” UNACCEPTED / UNPROMOTED

Current playtest manifest 9ab9eda7be7f6c819a9e5d136fe0992c718a3e40300ff2280397c1fda4d0b7ef, 579/579 verified. Visible battlefield placement now selects Eye of the Storm in Single Player/Story/Duel/Group, continuous through Start. Main Menu primes Exploration and quietly attempts allowed autoplay after bootstrap; top-level interaction unlock refreshes current scene first. No stale-menu retry on Random/Ready; same tracks/levels and approved identity/Story behavior preserved. Only runtime music.js changed; tests/report/compatible recovery predecessor/manifest updated.

Eight actual browser/service flows PASS: desktop + phone-sized Ã— four modes; Main Menu non-navigation interaction, deployment, Random/Ready/Start, no Exploration retry, same battle time/instance, Sound OFF/ON. Seven controller checks PASS. Canonical, Registry/identity, audio assets, narration and other runtime bytes unchanged. Full report playtest/MUSIC-FIRST-PASS.md; evidence workspace outputs/post-phase2-batch2/routing-results.json.

Stop for physical test. No commit, branch operation, push, promotion or deployment. Prior entries below are history.

---

# Latest Batch 2 fix: Online registered-name binding â€” UNACCEPTED / UNPROMOTED

Candidate: C:/Users/Notandi/Documents/GitHub/Stone-Throw/playtest. Normal verifier: 579/579; manifest SHA d08c3d8afa26d737887cc6b585586cf13ec0964966ce630cb312cd35143001dc. Online resume unknown-seat error opened setup without identity initialization. Unified showSetup now always loads the authoritative Display Name/Guest identity when setup is shown; existing REJOIN and validation paths preserved. Only runtime change: client-v13/lan.js. Music controller/assets, Registry/statistics/server, canonical gameplay and REJOIN code unchanged by hash.

Four focused real browser flows PASS: desktop + phone, Duel + 3-seat Group (2 Humans/1 AI), current renamed Display Name read-only, refresh/re-entry, stale-seat setup, create/Ready/start and same-playerId REJOIN. Logout Guest path PASS. Isolated databases only. Detailed report: playtest/REGISTRY-MULTIPLAYER-IDENTITY.md; evidence: workspace outputs/post-phase2-batch2/name-results.json. Stop for physical Online/music retest. No commit, branch operation, push, promotion or deployment. Earlier entries below are historical.

---

# Latest: two physical music fixes â€” UNACCEPTED / UNPROMOTED

Current Git playtest candidate, manifest c4c3148e2f97bde6211784ac2649ed440ab4f047ae3a90f152412e13c24bf46b, 579/579 verification. Story placement now uses Eye of the Storm continuously into combat. Current music primes before playback (only Exploration on first menu; battle primes during Story); no gain/track/audio-file changes. Controlled 350ms request-delay browser measurements: desktop 418â†’18ms and phone-sized 389â†’16ms first interaction to playing. Original ~1.10s quiet track opening preserved. Story deployment continuity and Sound OFF/ON/no duplicates pass both sizes; 7 controller checks pass. Runtime code changed only client-v13/music.js; accompanying tests, report, recovery predecessor and manifest metadata updated. Canonical/assets/narration/branding hashes unchanged.

See playtest/MUSIC-FIRST-PASS.md and workspace outputs/post-phase2-batch2/music-fix-before.json / music-fix-after.json. Stop for physical listening test using current PLAYTEST-LAN.cmd and printed URL. No commit, push, promotion, deployment or branch operation. Prior entries below are historical.

---

# Latest Batch 2 follow-up: music + battle banner â€” UNACCEPTED / UNPROMOTED

Candidate: C:/Users/Notandi/Documents/GitHub/Stone-Throw/playtest. All eight actual supplied tracks found and integrated; five WAVs encoded to VBR MP3, three MP3s byte-exact. Originals untouched. Shared menu continuity, Story/epilogue ducking, common battle/win/loss, silent draw and public-only Plague ambience; Sound/gesture/recovery handling. Shared battle header uses supplied CHAIN SIEGE image. No combat/AI/narration content changes. Full report: playtest/MUSIC-FIRST-PASS.md. Exact asset provenance: assets/audio/music/manifest.json.

Verification: 579/579 PASS. Manifest SHA-256: 2283f718382b2442a725cbd635f8b8153989e1d85a70185b785922d904a3035d. Canonical engine digest unchanged from prior Batch 2. Seven controller checks, desktop/phone browser checks, real Single/Duel/Group public renderer flows, 8 MP3 range requests, 5 launcher recovery checks and 13 Group narrative checks pass. Old save/host/RNG unchanged; checkpoint.journal disabled. Windows denied 3212 in final launcher test: fallback free port works; always use the printed URL.

Physical listening/layout testing remains: start current PLAYTEST-LAN.cmd, verify menu continuity, foreground narration intelligibility, battle/result transitions, epilogue, low Plague ambience, Sound OFF/ON and phone autoplay/banner. No commit, branch change, push, promotion or deployment. Previous Batch 2 and Batch 1 entries below are history, not the current manifest digest.

---

# Current work: post-phase2-batch2 â€” UNACCEPTED / UNPROMOTED

The user physically passed Batch 1. Its exact 559-file payload is preserved at C:/Users/Notandi/Documents/Codex/2026-09-09/continue-from-the-completed-stone-throw/outputs/post-phase2-batch2/batch1-physical-pass-backup (manifest e42baaac3e4eee3dba768e8118c80e881ada4f147a8bdae6980a52525795a107). Preserve it and all earlier accepted checkpoints.

Current candidate: C:/Users/Notandi/Documents/GitHub/Stone-Throw/playtest. All eight requested Batch 2 items implemented; see playtest/BATCH2-REPORT.md for root causes, exact runtime files and focused tests. Scout-only markers now yield to real board-scoped public attack results; graph unknown samples hold only the prior public value with explicit user authorization; first AI Hero relocation uses approved probabilities and existing gameplay RNG; global UNIT CELLS HIT added with backup-safe additive storage migration; result MAIN MENU, stale-warning cleanup, FOUND-only text and supplied byte-exact banner integrated. Existing Group Event Log/Demon behavior preserved. No audio redesign.

Final manifest: 3746096ebb73923bd41a7ca979d7ded31345fd868cf36422e891c051f6122a64; 566/566 verified. New rules 23; statistics 12; chain 9; combat/RNG 47; statistics browser 6; local resume 8; launcher recovery 5; Group narrative 13; storage migration/restart, Group Scout, Demon and desktop/phone browser checks pass. Journal remains disabled. Private test databases stay outside payload.

Physical acceptance still required. Launch playtest/PLAYTEST-LAN.cmd from this exact Git tree and use its printed address. Check Scout attacks/board switch, Cleric graph rounds, first AI Hero relocation, global counter, result menus, recovery warning, rediscovery text and supplied banner. No remaining item awaits implementation; no promotion, commit, push, branch change or deployment performed. Git branch remains post-phase2-batch1 at 0d2c6b35f9b39692e65f1a2c8be61b927a686055. Stop for user testing.

---

# post-phase2-batch1 physical Group follow-up â€” UNACCEPTED / UNPROMOTED

Demon playback failure reproduced and corrected: visible-board reservation renumbering after elimination conflicted with the renderer's consumed counter. Each Group cue now carries its own existing reserved public rune data. No authority/RNG/recovery-policy change. Physical match B1DBA6 contains all four completed 29-cell Demon patterns; no lost authoritative attack. Port 3212 was serving accepted Phase 2, not the new Group narrative branch; its old observer renderer explains the raw log dump.

PASS: 559/559 manifest files; SHA-256 e42baaac3e4eee3dba768e8118c80e881ada4f147a8bdae6980a52525795a107. Native-browser before/after reproduces the exception and repeated text, then passes without duplicates. Real mixed 2-Human/2-AI worker disconnect/snapshot/restore/REJOIN at a pending Hero decision preserves exact complete host/history/RNG and reserved memory against uninterrupted/baseline. Nested chain, ordinary prose/privacy and active/eliminated observer checks PASS. All canonical files unchanged.

Runtime follow-up: playtest/server/demon-presentation.mjs; playtest/server/group-presentation.mjs; playtest/client-v13/combat-playback.js. Report: playtest/GROUP-EVENT-LOG.md. Evidence/harnesses: workspace outputs/post-phase2-batch1. Private evidence is not packaged. Correct launcher: C:/Users/Notandi/Documents/GitHub/Stone-Throw/playtest/PLAYTEST-LAN.cmd. Close the old launcher console for port 3212, or use the new launcher's printed port on both devices. Running old server/save left untouched. Await physical Group retest. No commit/push/promote/deploy.

---

# post-phase2-batch1 â€” Group Event Log â€” UNACCEPTED / UNPROMOTED

Working branch: post-phase2-batch1. Base: accepted Registry Phase 2 commit 0d2c6b35f9b39692e65f1a2c8be61b927a686055. Named public special routing and causal eliminations implemented for 3/4-player Group battles; ordinary prose and Duel retained. All canonical engine files unchanged.

Verification: 557/557 manifest files; SHA-256 307fa8cba5b5b3c0dafa277ba925c5636e1cc728b9f0f84824367fec8c8fd9bc. Focused 13-case contract regression, real 3/4-player service and worker fixtures, exact authoritative host/RNG parity, and browser rendering including eliminated observers PASS.

Report: playtest/GROUP-EVENT-LOG.md. Run playtest/PLAYTEST-LAN.cmd; verify node playtest/tools/verify.mjs. Await physical LAN playtesting. Do not commit, push, promote or deploy without separate authorization. Previous acceptance metadata remains historical; this working tree is a new unaccepted batch.

---

# Accepted Registry Phase 2 â€” registry-phase2-v1

Physical testing accepted by the user on 2026-09-20. Exact candidate payload copied without gameplay, presentation or architecture changes during promotion.

- Branch: registry-phase2-v1
- Parent: 922258094cd44d3c1c5cd189f7c04fbfcb1ddedc (registry-phase1-v1)
- Payload: playtest/ â€” 554 manifest-listed files plus build-manifest.json
- Manifest SHA-256: a4c2d46d53d0cd8332a56866351569dfedc4ee256728e580827398effb8ca2a7
- Exact source: C:/Users/Notandi/Documents/Codex/2026-09-09/continue-from-the-completed-stone-throw/outputs/registry-phase2/candidate
- Verify: node playtest/tools/verify.mjs
- Run: playtest/PLAYTEST-LAN.cmd

Historical candidate/unaccepted labels inside the byte-preserved payload remain unchanged. This acceptance record supersedes those status labels. Phase 2 includes the Registry statistics foundation and the physically tested follow-ups, including Biggest Chain, Game Log, Monk, Castle image readiness, account Story progression, local resume/fallback and Group nested-Goblin feedback. The fallback leaves old unavailable local saves untouched.

No private Registry databases, WAL/SHM, session credentials, saves or runtime captures were copied. Journal containment remains unchanged. Previous accepted branches, golden prototype, audit, root index, .gitattributes and .gitignore are protected. No merge, push or deployment is authorized by this promotion. This checkpoint is the protected starting point for subsequent separately authorized work.

Verification evidence: promotion/registry-phase2-verification.json.
