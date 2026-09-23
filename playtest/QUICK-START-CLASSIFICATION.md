> ACCEPTED for commit/push on 2026-09-23. See ONLINE-GAME-PHASE1-ACCEPTANCE.md for final verification and non-blocking watchlist. Earlier development status below is historical. No merge or deployment authorized.

# Quick Start and match classification — UNACCEPTED / UNPROMOTED

2026-09-23; online-game-ui-phase1; accepted base 6d37741720b94518da2d7a66d154fc7b8a77ec3a. No commit/push/merge/deployment.

## Quick Start

Root cause: local-group.js explicitly hid stQuickStart for every local Group update. The existing presentation controller already implements Quick Start as the same canonical random-placement then start commands used manually. The correction exposes that button; no new command, RNG policy, placement generator, validation exception or Online lifecycle is introduced. One-AI behavior is unchanged.

Real browser/service checks at desktop and 390px verify one/two/three AI Quick Start, correct boards, unique identities, Single Player Game Log and finalized classification, no pvp requests/room/seat credentials, resume, and direct same-count Rematch. Three/four-participant Quick Start serialized authoritative hosts (including placements/history/RNG) are compared byte-for-byte with independently started normal Random -> Start sessions using the same seed. Canonical validation therefore still validates every generated unit, cell, overlap, separation, Castle and Hero placement.

Exact Quick Start runtime change: client-v13/local-group.js.

## Architecture and durable classification

Existing registration already freezes participants and h.config in prepareStatistics when host leaves placement. It creates a UUID per epoch. stat_matches stores mode, player_count, rules_version, build, started_at, ended_at, descriptor, event_cursor, command_cursor and finalized. descriptor contains id, epoch, mode, build, timestamps, participants (actor/seat/kind/playerId), reliabilityEvents/newsCursor, configuration, initialPlacements and initialRng. Participant kinds remain their starting kinds across takeover; departures add outcome/reliability/cutoff separately.

The prior labels were sufficient but not normalized across the six requested categories: Single Player used one career label plus player_count, while Online used Duel/3 Players/4 Players. New descriptor.classification explicitly contains mode (single/online), participantCount (2/3/4), format (duel/3p/4p), startingHumans and startingAI. It is computed from the frozen start configuration and participants, not renderer, survivors, current controllers or names. Rematch creates a fresh descriptor/UUID and recomputes classification. Story stays excluded.

Existing SQLite schema, career/HOF mode keys and aggregates are unchanged; this uses the existing descriptor JSON rather than duplicate tables/columns or new career buckets. Existing Match ID uniqueness/finalized guard and transactional registration remain authoritative. No WAR formula or HOF redesign.

Runtime files changed: client-v13/local-group.js; server/statistics-capture.mjs; new server/match-classification.mjs. No schema file changed. statistics-store.mjs remains byte-unchanged from the prior candidate.

## Historical private Registry audit/backfill

Database: C:\Users\Notandi\AppData\Local\ChainSiege\Registry\registry.sqlite.
All 58 records have consistent original mode, frozen configuration player count, player_count, starting participants and timestamps. Deterministic classification is possible for every record. Backfilled 51 finalized + 7 unfinished records:

| Category | Finalized | Unfinished | Total |
|---|---:|---:|---:|
| Single Player Duel | 8 | 4 | 12 |
| Single Player 3P | 0 | 0 | 0 |
| Single Player 4P | 1 | 0 | 1 |
| Online Duel | 2 | 0 | 2 |
| Online 3P | 11 | 1 | 12 |
| Online 4P | 29 | 2 | 31 |

Ambiguous: 0. Removed/reset: 0. Aggregate rebuilds: 0.
Verified consistent SQLite VACUUM INTO backup, including committed WAL data:
C:\Users\Notandi\AppData\Local\ChainSiege\Registry\backups\registry-before-classification-37618fdb-3d51-4c5b-953c-16f385ca8451.sqlite

Backfill runs under BEGIN IMMEDIATE, refuses ambiguous data, changes descriptor only, and verifies hashes of every other table plus all other match columns before commit. Preserved accounts, challenges, limits, sessions, stat_career, stat_event_links, stat_facts, stat_global, stat_migrations, stat_participants, story_progress, story_runs. This covers credentials/profile/avatar/unlocks/Story and all aggregates/raw facts. Re-audit reports zero pending updates; rerunning is idempotent. No private data/backup is copied into Git.

## Verification matrix

Canonical reduced-roster fixtures are finalized through actual place/start/shoot commands; outcomes are not fabricated. Mode/composition fixtures test registration independently of UI. Real Quick Start UI and service tests additionally exercise the complete production local route and finalized database records.

| Cases | Starting format | Expected / result |
|---|---|---|
| A | SP 1H+1AI | single / 2 / duel PASS |
| B,D | SP 1H+2AI, normal/Quick Start | single / 3 / 3p PASS |
| C,E | SP 1H+3AI, normal/Quick Start | single / 4 / 4p PASS |
| F,G | Online 2H; 1H+1AI | online / 2 / duel PASS |
| H,I | Online 2H+1AI; 3H | online / 3 / 3p PASS |
| J–M | Online 1H+3AI; 2H+2AI; 3H+1AI; 4H | online / 4 / 4p PASS |
| N,O | Controller takeover; elimination | frozen category/composition PASS |
| P | Disconnect/wait/rejoin, auto/kick/surrender and restore | classification preserved PASS |
| Q | Rematch, including 2-seat -> 4-seat new configuration | new ID and newly computed category PASS |
| R | Local Group authority reuse | Single Player only PASS |
| S | Repeated capture and Registry reopen; Result/reopen/rematch | no duplicate match/aggregate credit PASS |

Exact test/tool changes:
- tools/local-group-browser-check.mjs: ST_QUICK_START=1 path, full host parity and finalized database classification assertions.
- tools/statistics-reliability-check.mjs: frozen classification assertions around real disconnect/rejoin/takeover/recovery.
- tools/match-classification-check.mjs (new): 15 passing groups covering A–M, takeover/elimination, idempotency, changed-count rematch, historical backfill/repeat safety.
- tools/backfill-match-classification.mjs (new): explicit database audit, verified backup, transactional backfill and unrelated-table preservation checks; --apply required for mutation.

Focused results: Quick Start browser 24 checks; classification 15 groups; real reliability/recovery 8 checks; local session/restart 21 groups; normal result/rematch 8 checks; Online active-seat service 8 groups; local authority/RNG parity 10 groups. Final build digest/count is recorded in CURRENT-STATE.md and HANDOFF.md.

Physical retest: launch the refreshed candidate; select two then three AI; Quick Start; play/finish or Give Up; inspect Single Player logging/statistics; Rematch and confirm count. Candidate remains UNACCEPTED / UNPROMOTED.
