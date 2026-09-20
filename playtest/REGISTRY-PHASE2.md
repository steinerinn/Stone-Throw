# Registry Phase 2 — unaccepted physical-test candidate

Base: accepted `registry-phase1-v1`, commit `922258094cd44d3c1c5cd189f7c04fbfcb1ddedc`, manifest `2e571c1e98ca1d2be95eb9235ebf425a5fb7e9533430e65e91c2761c36b65fdf`. The user verified the published GitHub branch. No Phase 2 promotion, push or deployment is authorized.

## Storage and authority

The existing private Registry directory is retained: `%LOCALAPPDATA%\ChainSiege\Registry` by default (or `ST_REGISTRY_DIR`). Schema version 2 is additive. Before its first application, SQLite `VACUUM INTO` creates a consistent, independently integrity-checked private backup, including committed WAL data, at `backups/registry-before-v2-<UUID>.sqlite`. Migration is transactional. Phase 1 account, session, profile and login-streak rows are preserved. Test databases are separate siblings of this candidate; the user's physical Registry database was not migrated during automated checks.

The playtest launchers continue to use snapshot-only gameplay recovery. **`checkpoint.journal` remains disabled.** SQLite's bounded/checkpointed WAL is the Registry database's transaction mechanism, not the disabled gameplay journal. Account/statistics storage survives replacement of the runnable candidate.

Every started non-Story match has a server-generated permanent UUID beside its private session/room, distinct from the public battle epoch. It survives rejoin/restart and worker transfers; rematch/replacement gets a new ID. Identity is snapshotted at match start using immutable Player ID. Guest identities have no persistent account attachment. Controller transitions have event cutoffs so subsequent AI actions receive no Human credit. Pre-start AI replacements start as AI participants.

The game checkpoint is written before corresponding SQLite facts/aggregates. Recovery can retry capture from that checkpoint. Fact primary keys and a transactional finalized marker prevent replay/restart double-counting. Incomplete matches retain private facts without crediting a finished game. If all Humans have permanently departed, their participation can finalize as losses without waiting for unattended AI play. Temporary disconnect/Leave does not finalize a match.

Facts contain accepted commands and ordered private rule events, unit types, source owner, origin actor/action, chain/work links, affected cells, unit lifecycle/resurrection count, planned attack cells, Scout findings, and stable Plague outbreak identifiers. Explicit elimination-boundary facts preserve simultaneous placements. No private fact stream or active hidden board is returned to the browser. Instrumentation uses no gameplay RNG, clock-driven combat scheduling or presentation events.

Only new authoritative events/commands are appended. Idle reads/polls do not append facts. Aggregation scans one match once at finalization; profile and ranking reads use indexed career aggregates rather than scanning raw history. There is no new per-poll history export or debug journal.

## Accounting definitions

- Modes: Single Player, Duel, 3 Players, 4 Players, plus an All career aggregate. Story is excluded from ordinary match/career/global accounting.
- Outcomes and reliability are independent. Full, Quit, Disconnect, Kick and AFK are mutually exclusive per participant. Give Up/surrender is Loss + Quit. Rejoin then finish remains Full with raw disconnect/rejoin evidence retained. Automatic abandoned-connection takeover is Disconnect; explicit Kick is Kick.
- AFK policy/voting is not implemented. Pure future accounting supports AFK classification, ten-clean-Full-game forgiveness, streak reset on another AFK, effective Full and active AFK penalties, and an auditable forgiveness record without rewriting old summaries or banking credits.
- Ordinary direct shots alone drive shots/hits/misses/accuracy, first-shot-hit, and hit/miss streaks. Special/Plague/Scout events do not enter ordinary accuracy. Accepted no-hit resurrection-search guesses are misses.
- Kill credit belongs to the final damaging effect's owner, independently of the originating chain actor. Resurrections reset kill lifecycle; Cavalry resurrection counts one unit. Core kills include activated Hero destruction as in existing Group accounting.
- Cell Blaster retains resolved non-Plague offensive cell impacts and a game denominator. It is not presented as a lifetime-total ranking. Empty-cell impacts remain distinguishable from unit hits in raw facts. Plague and Scout remain separate.
- Unit metrics retain Castle/Catapult hits, Elf kills, own-board Dragon activation, exact nine-hit Archer volleys, Monk deflections, resurrected units, Hero/Dwarf/Wizard contacts, Wizard attack hits separately, planned Goblin bombs, current Demon kills, core kills, Hero hits received, and Survivor completion. No Demon/Cultist rename is performed.
- Plague has stable per-match outbreak identity, original source owner, target, step, cells and hit/kill facts. Its corrected gameplay is unchanged: Hero contact kills the Hero without stopping spread; source elimination does not cancel it; target elimination clears it; normal five-step/frontier rules remain.
- Scout inspected cells and cells finding a unit are separate; only the latter enter the global Scout counter.
- Six metric awards support ties: Lucky Shooter, The Blind One, Eagle Eye (at least five ordinary shots), Most Fierce, Chain Master, Purple Death. Empty/nonmeaningful categories may have no winner. Only registered players receive persistent award counts; AI receives no awards or career/global Human credit.
- Global counters finalize idempotently: Human/Guest ordinary shots, resolved destructive cells, owned Plague cells, successful Scout unit-find cells.
- Duel/3/4 ranking foundations provide wins, losses, win/loss ratios, Full games and accuracy. The existing internal data query includes accounts from their first finalized game. Qualification is inactive: only the future public Hall of Fame phase will require ten fully completed qualifying games in the relevant mode. There is no bypass setting. No Hall of Fame UI is added.
- `stat_participants` reserves nullable `match_score` and `score_formula_version`, tied to Match ID and Player ID. Both remain NULL. No score formula, score ranking or public score is implemented. Raw facts and numerator/denominator aggregates are retained for the later formula.

## Explicitly approved identity rule

The same authenticated Player ID cannot join a second seat in the same Duel/Group match through another browser, even with a different visible name or spoofed browser identity. The existing seat and rejoin credentials remain valid. Distinct accounts and multiple Guests remain allowed. The check runs inside the authoritative join queue. It uses the existing "You already have a seat in this game" feedback.

## Playtest inspector and physical test plan

1. Double-click **PLAYTEST-LAN.cmd** in this candidate. Keep the server window open. Use the displayed LAN address on the phone. Registry backup/migration is automatic on first account access; no SQLite work is required.
2. Log in with different accounts on PC and phone. **TEST STATISTICS** on Main Menu opens the read-only inspector. Expand a mode or All; REFRESH reloads finalized values. The control/endpoint is absent/denied unless the local playtest launcher explicitly enables it.
3. Complete one Single Player game with a few known hits/misses, or Give Up. Expect one game, correct ordinary shots, and Loss + Quit for Give Up. Special attacks must not inflate ordinary-shot accuracy.
4. Play a Duel. Have one player disconnect, REJOIN, then finish normally: the returning player should have Full and the actual result. In another game test AUTO KICK/KICK or I GIVE UP: inspect Disconnect/Kick/Quit respectively when participation finalizes.
5. Play a short 3-player and 4-player Group game with Human/AI mixes. Finish the match. Each mode must remain separate; AI has no career/global Human credit. Look at kills, biggest chain, Plague, Scout and unit metrics for observed actions. Guest games contribute globals but create no Guest career.
6. Restart the playtest server, log in and REFRESH. Totals must remain unchanged without replay credit. Rematch should add exactly one new game after completion. Story play must not change ordinary career totals.
7. Open another browser signed into the same account and try joining that account's existing room: the second seat should be rejected; the original player must still be able to play/rejoin.
8. Inspect data immediately after the first finalized game. No qualification checkbox or current eligibility flag should appear; the ten-game public Hall of Fame rule remains inactive until that future phase.

No final profile/result/Hall-of-Fame design, Friends, avatars, recovery email, moderation automation, AFK gameplay policy or multiplayer redesign is included. Stop for physical testing; do not promote this candidate.

## Verification

Biggest Chain correction: count every actually processed attack-cell contact within the same authoritative causal root, across nested reactions and boards, including misses and repeat/suspect contacts. Do not count attack announcements, damage/destruction bookkeeping, or planned cells never processed. Credit the root's originating actor and keep the largest root total. The finalized `biggestChain` and live biggest-attack/longest-chain counters share this counting primitive. No gameplay/geometry/RNG changes. Existing finalized stored summaries are historical and are not rewritten; retest in a fresh match. `statistics-chain-check.mjs` covers the supplied direct→Archer(6)→Goblin(9) example, nested Wizard→Demon→Dragon, misses, maximum selection, 2/3/4-seat public totals, serialization and exact non-statistical state/RNG parity.

Single Player viewer access: GAME LOG is a standard gameplay action beside GIVE UP and the gear button (desktop and narrow screens), independent of the central Start/status control. It opens the existing viewer even when recording is OFF; opening/closing never changes Settings or writes rows. Multiplayer and Story retain their existing viewer entry location. Real-browser checks verify visibility, mid-match history, close/reopen with ON unchanged, and viewer access with OFF unchanged.

Single Player live-log follow-up: gameplay appends schedule bounded persistence independently of the viewer. Opening/closing/exporting the viewer does not activate recording or flush/initialize storage. Current-page rows display immediately while older persisted history is read asynchronously. `game-log-single-live-check.mjs` uses actual Start/battlefield/Give Up confirmation clicks, checks persisted ordinary/special reaction rows before the viewer or finalization, holds a storage read to verify immediate display and zero viewer writes, and proves finalization does not recreate prior shot rows. The former viewer dependency is preserved as a failing delayed-read reproduction outside the payload.

Physical-test follow-up: Game Log Settings is the only recording preference. Enabling it initializes capture from the current public snapshot; local games and multiplayer deployment record without opening the viewer. The viewer only displays/exports records. OFF stops recording and private request opt-in; the preference persists. Existing 22,000-row bounds and snapshot-only playtest persistence remain unchanged. `game-log-lifecycle-check.mjs` checks a real local match before opening the log; `game-log-setting-check.mjs` checks automatic Group recording, retention, opt-in, and reload.

New focused suites: `statistics-check.mjs`, `statistics-parity-check.mjs`, `statistics-reliability-check.mjs`, `statistics-seat-check.mjs`, `statistics-browser-check.mjs`. These cover populated migration/backup, idempotent restarts, live finalized Duel/3/4 matches, Single Player, Guest/AI exclusions, metrics/ties/qualification, real Scout and two-cell resurrection, exact engine/RNG parity against Phase 1 across 45 unit/seat cases, disconnect/rejoin/takeover classification, read-only desktop/phone inspector and duplicate-account rejection.

Inherited gates: Registry core/browser/multiplayer/rematch, Plague continuation, snapshot containment/restarts, Story narration/deployment, Group random-placement streaming and Game Log settings. Machine-readable execution results and the exact changed-file inventory are in the sibling `../evidence` directory. `node tools/verify.mjs` verifies every final candidate manifest entry.

## Input-state observer follow-up (unaccepted)

The 100 ms observer logs phase/lock/shot changes only, with a separate one-shot legal-input latency completion. An unlocked non-interactive state retires the pending request; it cannot force repeated INPUT STATE rows. This is generic, not a finished-phase exception. The viewer and Settings recording contract are unchanged. `game-log-input-state-check.mjs` runs real Single Player normal combat finishes with a test-only reduced core roster, viewer open/closed, 6.5 seconds idle after each finish, persisted-row deduplication, genuine state changes and display-only result-viewer reopen checks. No gameplay, statistics, storage bounds or journal changes.

## Monk public deduction follow-up — unaccepted

See MONK-CANDIDATE-CORRECTION.md. Public proximity evidence and public cell observations now drive candidate presentation independently of the combat/AI search list. No-touch and Scout EMPTY deductions update on projection; grid interaction is phase/decision gated for both mouse and touch. Monk combat/RNG and the physically passed Biggest Chain correction are preserved. Await physical retest.
