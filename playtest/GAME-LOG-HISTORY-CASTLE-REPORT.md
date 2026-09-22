# ACCEPTED — Result Screen and physical bug-fix checkpoint

Physical acceptance confirmed by the user on 2026-09-22. This acceptance supersedes earlier candidate/visual-review status statements below. Historical investigation limitations remain documented. No speculative watchlist fixes were made.

# Game Log history, Castle evidence and final battlefield cleanup

UNACCEPTED / UNPROMOTED. Branch result-screen-ui-phase1. No commit, push, merge or deployment.

## Game Log
The old viewer/export selected only the current match and used current metadata, while storage shared one global row budget. This made earlier matches inaccessible and could mislabel their start time after reload.

The existing recorder now retains 20 match sessions, oldest first eviction excluding the current match. Each session is bounded to 22,000 rows and 8 MiB of serialized row data (up to 160 MiB plus IndexedDB overhead overall). Trimming counts are included in exports. Existing version-1 logs migrate in place. Metadata includes room/match, mode, seat, player count, chronological start and known end. Local Single Player and Story keys are separate. Settings provides OPEN GAME LOG HISTORY; the viewer selects matches, exports selected/all in chronological order and explicitly clears history. Opening the viewer never enables recording or flushes it. Settings ON/OFF remains authoritative. No checkpoint.journal changes.

PUBLIC REACTION logging now includes the existing observer-public cell and correct unitKind field. No credentials, private host state or RNG are added.

## Supplied physical evidence / Castle
2D7821 contains placement only. 3CD5F8 is the played four-player match: 10,058 rows, including 22 Plague reaction records. Its old reaction format omits coordinates/unit details, so it cannot establish the alleged disconnected Castle reveal. It does show a Human Catapult choice at 20:14:54, answer at 20:14:57 and five-frame Catapult animation; this does not resolve a different historical missing-choice incident.

Canonical disclosure requires a known same-Castle neighbour within the eight surrounding cells for each cell to identify, with existing full-destruction and Catapult-contact exceptions. Evidence uses the observer's known cells. Two distant known cells alone do not identify the Castle. A connected pair elsewhere does not identify an isolated hit. Normal completed-match full reveal remains intentional.

Deterministic direct A then distant Plague B remained unidentified in local and Group projections and actual browser rendering. Adding connected Plague C reveals B/C while isolated A remains unknown. Castle false reveal was NOT reproduced; no disclosure, combat, geometry, placement or RNG code was changed. Physical observation remains open.

## Final battlefield red circle
The screenshot matches .demon-fire-whoosh (red ring with star), not the turn dial. Routed animation instances survived the transition to final overview; an orphan effect could remain when primary boards were hidden. At settled completion, routed animation instances are unmounted and primary transient effects are cleared. This occurs after ordered playback, not during live battle. Existing completed-state dial hiding and route clearing remain intact.

Browser regression forces an animation-start failure after the actual Demon element mounts, reproducing a retained ring. Live dial stays visible; final overview removes the ring and effect planes and contains no turn dial or route paths. This proves cleanup, not the precise historical cause of the original animation failure.

## Exact runtime files changed in this follow-up
- client-v13/game-log.js: bounded per-match history, metadata, selection/export/clear, migration.
- client-v13/presentation.js: public reaction diagnostics; settled primary effect cleanup.
- client-v13/combat-playback.js: expose existing transient cleanup.
- client-v13/online-overview.js: dispose routed effects on completed overview.

## Verification
PASS tools/game-log-history-check.mjs: A/B/C retention, selected/all export, Main Menu display-only access, continued current recording, reload, OFF, 20-session FIFO, row/byte bounds, clear/continue and legacy migration.
PASS tools/game-log-single-live-check.mjs: real Single Player deployment, three shots, hits/misses/reactions persisted before viewer opens (185 rows); viewer does not write; Give Up does not retroactively create history; journal absent.
PASS tools/castle-plague-disclosure-check.mjs: six local/Group projection checks plus browser unknown/art checks; projection does not mutate authoritative state or RNG.
PASS tools/final-battlefield-cleanup-check.mjs: real orphan Demon element cleanup; live dial unaffected; final routes/dial/effect planes absent.
Older lifecycle/setting/input-state test readers now open the database without pinning its previous schema version. The old input-state test was attempted but its old shortened-roster fixture did not finish the current normal match; it is not counted as passing. No production workaround was made for that fixture. Live Single Player and focused history checks above passed.

## Physical retest
1. Enable Game Log in Settings before play. Complete A, return to Main Menu, play B and C (Rematch/new room may be included).
2. In Settings open Game Log history, select each match, export selected and EXPORT ALL. Confirm chronological separation and earlier events remain after reload. OFF stops new capture; CLEAR LOG HISTORY is the only manual clear.
3. At final results choose View Battlefield. Confirm no red star/ring or active turn/route indicator; a fresh live battle still has normal turn indications.
4. If Castle disclosure recurs, export the relevant retained match and capture the board immediately before/after reveal. New public cell diagnostics improve reconstruction without private-state exposure.
