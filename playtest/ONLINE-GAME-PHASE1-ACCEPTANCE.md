# ACCEPTED — Online Game / Single Player Phase 1

2026-09-23. Branch online-game-ui-phase1, directly based on accepted Result checkpoint 6d37741720b94518da2d7a66d154fc7b8a77ec3a.
User accepted all intended Online/Single Player setup, Quick Start, classification/backfill tooling, Story Scout/Cleric corrections, entry navigation/PLAYER wording and Monk targeting. Commit and push only; no merge/deployment.

## Final verification

188 checks/groups PASS plus accepted-base Online host/RNG/placement parity and final-Human surrender/closure script:
- Online service 8; entry desktop/phone 14; private joins desktop/phone 14.
- Local Group authority/RNG 10; mode separation 3; session/restart/recovery 21.
- Single Player desktop/phone 24 normal + 24 Quick Start; Result completion/reopen/rematch 8.
- Match classification/backfill fixtures 15; real disconnect/rejoin/statistics reliability 8.
- Story browser/account restart/retry 11; Scout 8 + real renderer 1; Cleric causal progression 5.
- Monk targeting 14, including Duel/3P/4P, exactly once, direct-source override, accepted deflect exception and unchanged RNG draw comparisons.
- TypeScript compile and generated changed-output byte equality PASS.
- Final manifest and staged/committed Git-blob hashes are verified separately; final digest is recorded in CURRENT-STATE.md/HANDOFF.md.

The existing Story browser suite logged nonfatal 404 resource messages and one resource-buffer console error during parallel browser execution; its assertions passed with no page errors. No autoplay/music/audio changes in this acceptance pass.

## Non-blocking watchlist (accepted, not failures)

- Story direct-hit Scout deferred scouting: physical verification pending.
- Pending Necromancer Plague does not grant Cleric: physical verification pending.
- Executed Plague grants Cleric: physical verification pending.
- Monk direct proximity returns to actual shooter: physical verification pending; fresh synchronized rooms already behaved correctly, original divergence not established.
- Monk-vs-Monk deflect default-target exception: physical verification pending.
- Historical Archer -> Catapult missing choice.
- Historical Castle false reveal via Plague.
- Unexpected multiplayer kick/seat loss and missing pre-event Game Log segment.

## Packaging and privacy

Intended source, generated canonical outputs, focused checks, stylesheet and project reports only. Result art/controller/styles remain unchanged; accepted behavior is covered by result/rematch tests. No .gitattributes change; byte-preserving playtest protection retained. Runtime modifications match the accepted task scopes; no unrelated runtime changes added in acceptance.

PLAYTEST and PLAYTEST-LAN use tools/playtest.mjs with playtestSnapshotOnly:true. Journal writing/replay remains disabled. Session tests confirm no journal. Normal snapshots remain enabled.
Real private Registry database and its previous maintenance backup remain external to Git. No new private-data maintenance is performed for acceptance. Test databases, generated account records, logs, browser evidence, screenshots, archives/backups and OS temporary artifacts are excluded. Fixture account names/password strings inside test source are test code, not persisted accounts or credentials from the private Registry.

## Exact intended commit paths

- `CURRENT-STATE.md`
- `HANDOFF.md`
- `playtest/MONK-RETALIATION-REPORT.md`
- `playtest/ONLINE-GAME-PHASE1-ACCEPTANCE.md`
- `playtest/ONLINE-GAME-UI-CLEAN-REBUILD.md`
- `playtest/QUICK-START-CLASSIFICATION.md`
- `playtest/SINGLE-PLAYER-GROUP-ARCHITECTURE.md`
- `playtest/SINGLE-PLAYER-LOCAL-GROUP.md`
- `playtest/STORY-CAUSAL-UI-REPORT.md`
- `playtest/build-manifest.json`
- `playtest/canonical/compiled/client-contract/public.d.ts`
- `playtest/canonical/compiled/combat/units/monk.js`
- `playtest/canonical/compiled/local-host/authority.js`
- `playtest/canonical/compiled/local-host/plague-presentation.d.ts`
- `playtest/canonical/compiled/local-host/plague-presentation.js`
- `playtest/canonical/shared/client-contract/public.ts`
- `playtest/canonical/shared/combat/units/monk.ts`
- `playtest/canonical/shared/local-host/authority.ts`
- `playtest/canonical/shared/local-host/plague-presentation.ts`
- `playtest/client-v13/bootstrap-production.js`
- `playtest/client-v13/game-log.js`
- `playtest/client-v13/group-lan.js`
- `playtest/client-v13/lan.js`
- `playtest/client-v13/local-group.js`
- `playtest/client-v13/online-entry.js`
- `playtest/client-v13/single-entry.js`
- `playtest/client-v13/story-browser.js`
- `playtest/server/main.mjs`
- `playtest/server/match-classification.mjs`
- `playtest/server/multiplayer.mjs`
- `playtest/server/online-entry.mjs`
- `playtest/server/ring-pvp.mjs`
- `playtest/server/statistics-capture.mjs`
- `playtest/server/story-progress.mjs`
- `playtest/styles-online-entry.css`
- `playtest/tools/backfill-match-classification.mjs`
- `playtest/tools/local-group-authority-check.mjs`
- `playtest/tools/local-group-browser-check.mjs`
- `playtest/tools/local-group-modes-check.mjs`
- `playtest/tools/local-group-result-check.mjs`
- `playtest/tools/local-group-session-check.mjs`
- `playtest/tools/local-recovery-contract.json`
- `playtest/tools/match-classification-check.mjs`
- `playtest/tools/monk-retaliation-check.mjs`
- `playtest/tools/online-entry-browser-check.mjs`
- `playtest/tools/online-entry-check.mjs`
- `playtest/tools/private-entry-browser-check.mjs`
- `playtest/tools/statistics-reliability-check.mjs`
- `playtest/tools/story-causal-check.mjs`
- `playtest/tools/story-scout-check.mjs`
