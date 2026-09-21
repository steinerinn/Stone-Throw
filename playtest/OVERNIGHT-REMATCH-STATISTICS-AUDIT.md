# Overnight rematch fix and statistics sanity audit

Status: UNACCEPTED / UNPROMOTED. 2026-09-21. No commit, push, promotion or deployment. Real private Registry untouched; all databases and accounts used below are isolated test fixtures.

## 1. Rematch — BUG FOUND AND FIXED

The Group rematch request stays busy while it moves the client to the fresh room in the same document. During that request, the new REMATCH SETUP toolbar is constructed with its buttons disabled. On completion, the finally block clears busy and calls sync, but sync previously updated only Leave and battlefield controls. The toolbar cache key intentionally excludes busy, so later polls with unchanged room metadata did not rebuild APPLY SETUP. Changing a seat selector also did not update that button. The result was a valid, authorized rematch room with a permanently latched disabled button.

Before-fix reproduction: real authoritative Group win, click REMATCH, wait for setup and another poll; APPLY SETUP still disabled. Evidence: overnight-rematch-before.json (historical filename: rematch-before.json in the workspace).

The fix synchronizes request-owned toolbar controls whenever busy changes, without rebuilding the draft selects. APPLY SETUP and the other request-owned toolbar buttons disable during a request and re-enable when it settles. Rematch player-count/seat selects also respect busy while retaining joined-Human protection. The authoritative configure validation, host identity, seat membership rules and room reset logic are unchanged. No fake dirty flag, forced enablement bypass, delay or reload was added.

### Exact runtime files changed
- client-v13/group-lan.js — request-state synchronization for the cached Group toolbar/rematch setup.
- server/statistics-metrics.mjs — the separate Hero-received takeover cutoff correction described below.

### Rematch verification
- Real 3-seat Group, one registered Human plus two AI: normal authoritative victory → REMATCH SETUP → eligible seats changed to AI → APPLY SETUP → Random → Ready → running match. Double-click sends exactly one configure request. Same document throughout; Eye of the Storm instance/time continues across placement → start.
- Duel with two independent clients: genuine result → both request rematch → full grids → legal placement/start → genuine second finalization under a new Match ID.
- Group with independent desktop/phone-sized Human clients: finished game → both join rematch → joined Human remains represented and locked against conversion. A direct invalid Human-to-AI configure request is rejected by the server. Legal player-count/configuration change succeeds, rematch placement/start and finalization succeed.
- Old match participant summaries and finalized records are unchanged through setup/rematch; the second match adds exactly one new finalization.
- Existing name/Player ID rematch and duplicate-account-seat rejection checks pass.

Duel uses its existing rematch handshake rather than the Group-only APPLY SETUP panel. No new Duel seat-configuration policy was invented.

## 2. Statistics audit

| Area | Result / evidence |
| --- | --- |
| Personal account identity | PASS. The statistics endpoint derives Player ID from the authenticated account cookie, not seat/browser/display name. Same account logged into separate browser contexts returns identical full career data. Different accounts have independent mode records. Logout returns no personal career; logging into a different account returns that account's data. Client-supplied Player ID/qualification override is rejected. |
| Host versus remote | PASS in independent desktop/phone-sized browser sessions against the same real service/SQLite database, including login from another context. No host-computer special case exists in the query path. Actual separate physical machines were not available to automation. |
| Browser/cache leakage | No leakage found. Inspector fetches authoritative data on open/refresh. Logout/account-switch API checks pass; previous inspector layout/refresh checks pass. No career cache keyed by device or room was found. |
| Modes | PASS. Genuine Single Player, Duel, 3-player and 4-player authoritative finalizations exercised. A genuine registered Story win leaves ordinary career/global data unchanged. |
| All aggregation | PASS. Per-account additive fields sum included modes; bestHitStreak/bestMissStreak/biggestChain use max. Single Player+Duel and multi-account Duel/3/4 mixtures checked. Games equal wins+losses+draws; accuracy, ratios, Cell Blaster numerator/denominator and award sums verified. |
| Attribution | PASS after one cutoff fix below. All existing metric fields have independent expected-value assertions using authoritative-format facts; 47 real resolver/decision cases verify emitted facts and exact combat/RNG parity against the physically accepted Batch 1 backup. No Biggest Chain incident assumed. |
| Awards | PASS. Only eligible actors receive the award; uninvolved recipients receive none. Ties independently award each qualifying actor. AI excluded; Guests have no persistent career. Per-mode award counts sum to the same account's All count. |
| Reliability | PASS for implemented policy. Real disconnect → WAIT → Rejoin/finish = Full, Auto Kick = Disconnect, manual Kick = Kick, surrender = Quit; recorded outcome rules preserved. Recovery retains match identity. Full/Quit/Disconnect/Kick/AFK, forgiveness, cleanStreak, effectiveFull, total and consistency use existing accounting formulas. Live AFK enforcement is NOT IMPLEMENTED and therefore NOT VERIFIED as a live feature; only its future accounting formulas were tested. |
| AI/takeover | BUG FOUND + FIXED: heroReceived alone bypassed Human/Guest event cutoff. Other action metrics already used it. Synthetic before/after cutoff proof and existing real takeover/recovery tests pass. AI participants have no career and global updates skip them. No attack/shot/global attribution leak was found in tested paths. |
| Guests | PASS. Genuine Guest participation has no stat_career row; finalized Guest summary contributes to global counters. No Guest history transferred to account on later login. |
| Globals | PASS. All clients see the same database singleton counters. Independently summed finalized Human+Guest summaries equal all five totals. AI summaries are excluded. Live unfinished matches do not increment totals. |
| One-time finalization | PASS. Private raw live facts are permitted, but aggregates update only at finalization. Match ID primary key/finalized guard and one SQL transaction prevent duplicate writes. Repeated reads, restart, live Rejoin, same-document rematch and menu navigation checks preserve accounting. |
| Score/HOF | Unchanged. No formula, scores or new rankings implemented. Score fields remain uncomputed. Future ten-Full-game eligibility remains inactive. |

### Confirmed AI cutoff defect

The old Hero-received branch incremented result[unitOwner].heroReceived directly. After a registered Human surrendered/was taken over, hits received by the AI-controlled Hero continued to enter that former Human's summary, even though offensive counters already stopped at the event cutoff.

Focused reproduction: one Hero hit before cutoff and one after cutoff yielded heroReceived=2; expected 1. The correction obtains the recipient through the existing human(actor, eventIndex) gate. After fix: former Human receives 1; the active attacking Human still receives both legitimate heroHits/shots. No raw facts, gameplay events, outcome/reliability classification, RNG or past career rows are modified. Historical finalized summaries are not backfilled.

### Existing statistic meanings retained

- shots/hits/misses: ordinary direct contacts only (including accepted no-hit/repeat attempts according to existing definitions); shots=hits+misses. Specials do not inflate ordinary accuracy/streaks. oneHitWonder is first ordinary shot hitting a unit.
- unitsKilled/coreKills: final damaging effect owner, not automatically the causal-root actor; self-destruction excluded and resurrection starts a new kill lifecycle. elvesKilled/demonKills specialize kill type.
- heroHits/heroReceived/dwarfHits/wizardHits/castleCatapultHits: corresponding authoritative impact and receiving/source attribution. wizardAttackHits counts occupied Wizard impacts separately.
- destructiveCells/unitCellsHit: resolved non-Plague impact cells / occupied impact cells. plagueCells is separate.
- scoutInspected/scoutFound: inspected cells / cells finding units. The global SCOUTED CELLS counter intentionally uses scoutFound, per the existing Phase 2 contract, not every empty inspection.
- dragonsActivated/monkDeflections: owned attack-started events. goblinBombs: planned Goblin bomb cells. perfectVolleys: exactly nine Archer contacts, all hits. resurrections counts units, not footprint cells.
- survivor: Full completion with zero credited Hero hits received. Existing definition retained.
- biggestChain: maximum complete processed causal-root cell count credited to its originating actor; nested attack ownership does not split the causal total. Audited normally alongside other max metrics, without treating 138/96 as a defect.
- reliability: one classification per finalized Human participant. effectiveFull=Full+forgiven, total=Full+Quit+Disconnect+Kick+AFK, consistency=effectiveFull/total. Forgiveness and clean-streak rules unchanged.
- Cell Blaster: destructive-cell numerator / finalized-game denominator, not an invented percentage.

### Historical migration caveat

The existing unit_cells global column migration initializes the new field at zero and does not backfill earlier finalized games. Older stored career JSON may also lack the newly introduced unitCellsHit field; later aggregation treats a missing additive field as zero. Missing old historical coverage is not repaired in this task. No data migration/backfill was added.

## 3. Focused automated results

All ten final suite entries PASS (workspace overnight-suite-results.json):
1. Overnight Group rematch browser check: setup enablement, single request, placement/start, same document/audio, prior statistics unchanged.
2. Overnight account/service/browser matrix: 2/3/4 seats, desktop/phone-sized Human clients, Guest, live Rejoin state identity, completed rematches, real Story exclusion, login/logout/account switch, All/global invariants.
3. Metrics/storage test: 12 grouped checks plus exact assertions for every existing metric, additive migration/backup, restart idempotence and genuine Duel/Group finalization.
4. Hero-received cutoff regression: before=2, after=1, attacker credit unchanged.
5. Browser statistics suite: 6 grouped checks, genuine SP/Duel, inspector desktop/phone, restart/repeated reads, production inspector denial; now enters the startup splash normally.
6. Resolver/statistics parity: 47 cases, all unit types, exact combat and RNG parity, pending decision serialization, real Scout and two-cell resurrection.
7. Reliability suite: 8 checks, real disconnect/Rejoin/takeover paths and recovery identity.
8. Seat identity suite: 4 checks, duplicate registered account rejection and independent Guests.
9. Existing rematch name/immutable identity check.
10. Music controller: 7 checks.

No production tables were edited to force outcomes. Compact deterministic rosters and ordinary authoritative commands produce genuine results; pure fact fixtures cover rare metric combinations. Raw test databases remain outside the served candidate. Test harness setup errors encountered (old splash entry and old comparison adapter) were corrected in workspace copies; no assertions or production validation were disabled.

The immediate pre-task manifest comparison confirms exactly the two runtime files above changed. Every canonical engine, music, asset, Scout/Plague, registry storage/query and transport file remains byte-identical for this task. Reports/manifest/recovery-compatibility metadata are updated separately.

## 4. Physical retest

1. Start the normal PLAYTEST-LAN.cmd. Enter through the splash. Finish a Duel normally and request REMATCH on both clients; verify placement, READY and the next battle.
2. Finish a 3-seat Group with your account plus two AI. Click REMATCH, choose AI for eligible empty seats, and confirm APPLY SETUP is enabled. Click once, place/Random, READY, and verify the next match starts without refresh or music interruption.
3. Repeat with two Human clients: both request rematch. The already joined Human remains named and cannot be overwritten with AI. Change only eligible unjoined seats, apply, Ready/start.
4. Open Statistics before/after each rematch: old result remains once; a completed rematch adds one game. Log the same account into the other device and compare modes/All; log into another account and verify its independent career. Both devices should show the same global counters after refreshing Statistics.
5. Check Main Menu after a win and entry into another room still show no false loss and render the grid.

No acceptance inferred. Stop for physical testing.
