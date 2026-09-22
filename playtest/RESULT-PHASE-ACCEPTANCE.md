# Result phase — ACCEPTED

Accepted by physical user testing, 2026-09-22. Branch result-screen-ui-phase1; accepted base c008851de246968eda21ae37e50484e3e2ffb7f7 (multiplayer-ui-phase1). No runtime changes during acceptance.

Scope: supplied Result Screen artwork and responsive podium/awards presentation; dense ties/rat and NPC identities; result lifecycle/rematch/statistics safeguards; prior physical presentation fixes; multi-match bounded Game Log and final battlefield transient cleanup. Prior accepted branches remain unchanged.

## WATCHLIST — non-blocking

- Unexpected multiplayer kick/seat loss: one physical incident, not reproduced.
- Pre-disconnect Game Log evidence was unavailable for that incident.
- Castle false reveal via Plague: observed once physically, not reproduced deterministically.
- Historical Archer -> Catapult missing-choice incident: unproven.

## Final focused verification

- Result logic: 9 scenario groups PASS.
- Desktop-fit/phone browser: 17 checks PASS (browser fixture also runs the 9 logic groups).
- Accepted-base authority: host/RNG/placement equality PASS; final Human surrender accounting/closure PASS.
- Real service/browser: Group win -> Results -> View Battlefield -> Results -> Rematch -> Apply Setup -> Random/Ready/start PASS; statistics unchanged and no reload.
- Multi-match Game Log history/export/migration/bounds PASS.
- Final battlefield cleanup browser regression PASS; live dial preserved, completed dial/routes/effect planes absent.
- Full artifact hash verification rerun after metadata update; final count/hash recorded in root CURRENT-STATE.md and HANDOFF.md.

The older input-state fixture limitation and non-reproduced physical reports are retained in their reports; no new broad audit was run.

## Exclusions

Nine generated input-state-log-*/single-live-log-* directories, including test SQLite databases, checkpoints, screenshots and raw test captures, were moved with SHA-256 verification to the external workspace outputs/result-screen-ui-phase1/acceptance-excluded-20260922 directory. They are not part of the commit. No private Registry/runtime files or credentials are included. Existing .gitattributes byte protection is unchanged.

## Exact accepted changed-file scope

- CURRENT-STATE.md
- HANDOFF.md
- playtest/GAME-LOG-HISTORY-CASTLE-REPORT.md
- playtest/POST-RESULT-PHYSICAL-BUGS.md
- playtest/RESULT-PHASE-ACCEPTANCE.md
- playtest/RESULT-SCREEN-PHASE1-EVIDENCE.json
- playtest/RESULT-SCREEN-PHASE1-REPORT.md
- playtest/assets/result-screen/1st place duo.png
- playtest/assets/result-screen/1st place solo.png
- playtest/assets/result-screen/2nd place.png
- playtest/assets/result-screen/3rd place.png
- playtest/assets/result-screen/4th place no player.png
- playtest/assets/result-screen/4th place.png
- playtest/assets/result-screen/Background.png
- playtest/assets/result-screen/fantasy_medal_icon_collection.png
- playtest/build-manifest.json
- playtest/client-v13/combat-playback.js
- playtest/client-v13/game-log.js
- playtest/client-v13/lan.js
- playtest/client-v13/legacy-animations.js
- playtest/client-v13/music.js
- playtest/client-v13/online-overview.js
- playtest/client-v13/presentation.js
- playtest/client-v13/result-screen.js
- playtest/server/main.mjs
- playtest/server/multiplayer.mjs
- playtest/server/pvp.mjs
- playtest/server/registry.mjs
- playtest/server/result-screen.mjs
- playtest/server/ring-pvp.mjs
- playtest/styles-online-overview.css
- playtest/styles-result-screen.css
- playtest/tools/archer-catapult-check.mjs
- playtest/tools/archer-catapult-group-check.mjs
- playtest/tools/castle-plague-disclosure-check.mjs
- playtest/tools/final-battlefield-cleanup-check.mjs
- playtest/tools/game-log-history-check.mjs
- playtest/tools/game-log-input-state-check.mjs
- playtest/tools/game-log-lifecycle-check.mjs
- playtest/tools/game-log-setting-check.mjs
- playtest/tools/game-log-single-live-check.mjs
- playtest/tools/local-recovery-contract.json
- playtest/tools/result-physical-bugs-check.mjs
- playtest/tools/result-screen-authority-check.mjs
- playtest/tools/result-screen-browser-check.mjs
- playtest/tools/result-screen-check.mjs
- playtest/tools/result-screen-live-check.mjs
- playtest/tools/result-screen-regression-check.mjs
