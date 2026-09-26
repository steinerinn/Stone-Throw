# AFK / Disconnect / Reliability — Phase 1

Status: UNACCEPTED / UNPROMOTED. No commit, push, merge, or deployment.

Base: `b2437ad6b47f3e80540cb410057700dd14e0f88a`.
Fresh worktree: `C:\Users\Notandi\Documents\Codex\afk-disconnect-reliability-phase1`.
Old branch renamed to `afk-disconnect-reliability-phase1-preserved`; its checkout and uncommitted files were not copied, cherry-picked, or edited.

## Timer and presentation boundary

The server selects the actor from the pending decision, otherwise the active turn. Only an active human seat with an ordinary shot budget or legal special-decision candidates qualifies. Deployment, eliminated seats, AI, local/Single Player, completion, disconnected seats and unresolved authority do not qualify.

The clock starts after a state-bound presentation-ready acknowledgement from the acting client. The client sends it after rendering the current revision, with input unlocked and no disconnect newsflash visible. The server verifies the actor and opaque state key; it never accepts a client start time. Mouse movement, generic keyboard events, visibility and focus do not reset this clock. Repeated acknowledgements do not reset it. Disconnect/rejoin newsflashes also establish a four-second server presentation exclusion.

At 30,000 ms of continuous required-input inactivity, the server records one incident and opens the warning. The normal deadline is warning time + 30,000 ms. Unanimous WAIT from a nonempty current voter set changes it to warning time + 120,000 ms. The existing 500 ms policy tick enforces deadlines; authenticated requests also reconcile them.

The warned player's popup does not intercept board input. Other eligible humans receive KICK / WAIT in the existing disconnect visual family. A valid shot or special answer cancels the live episode; stale/illegal commands do not. Incident history survives cancellation. Scout, resurrection, Catapult target/roll and Hero relocation use this same policy.

Recovery retains an existing warning's incident and votes, rebinds its key to the restored room, and excludes downtime while waiting for recovered presentation readiness. A genuine disconnect instead closes the AFK episode and uses the existing disconnect lifecycle.

## Voting and handoff

Eligible voters are other active human seats, excluding eliminated and permanently departed seats. Their set is recomputed during enforcement. First incident: `ceil(voters / 2)` KICK votes; second and later: one KICK. Zero voters cannot cause an immediate vote kick, but deadline expiry still causes takeover. Votes are immutable for the episode. Silence and partial WAIT never extend the deadline.

AFK invokes the existing same-seat AI handoff, retaining combat state and RNG. The departure event cursor is recorded before AI processing, so later AI activity is outside the PLAYER's Match Score cutoff. With no human opponent remaining, AFK still hands over that seat; AI processing can pause under the existing no-connected-human policy.

## Final outcome and disconnect mapping

One registered Online participation receives one immutable `reliabilityOutcome` in its finalized descriptor:

1. Two or more incidents: AFK, including later normal completion or departure.
2. Otherwise permanent departure, an unresolved disconnect at finalization, or two technical disconnects: DISCONNECTED.
3. Otherwise FINISHED.

One incident followed by normal completion, and one technical disconnect followed by rejoin/completion, remain FINISHED. A first-incident AFK takeover is DISCONNECTED. Quit, permanent Leave, surrender, grace takeover and manual kick retain their diagnostic reasons but map to DISCONNECTED unless AFK takes precedence. Existing third-technical-disconnect handoff behavior is retained; no third-AFK rule was added.

Completion/Score eligibility remains separate: the existing raw `reliability` and departure cutoff continue serving Score and legacy career accounting. No Score formula or gameplay rules changed.

## Accounting, history and join gate

The authoritative Online read model reuses `reliabilityAccounting`. Every AFK or DISCONNECTED outcome resets the recovery streak. Each completed block of ten consecutive FINISHED matches forgives at most one outstanding AFK card and resets the streak. Disconnect cards never decrease.

`effectiveFull = Full + forgivenAFK`

`total = Full + Disconnect + AFK`

`percent = 100 * effectiveFull / total`; zero total remains UNRATED.

The read model includes Full, Disconnect, raw AFK, forgivenAFK, outstandingAFK, cleanStreak, gamesUntilForgiveness, forgiveness history, effectiveFull, total, consistency and percent. Single Player is excluded; Guests have no durable account history. The existing Profile reliability sentence was corrected to remove the obsolete deployment-AFK wording; no Profile interface was built or redesigned.

No SQL schema migration or historical rewrite is required. New facts/outcomes live in existing descriptor JSON and room checkpoints. Legacy Full maps to FINISHED; Quit/Disconnect/Kick map to DISCONNECTED; explicit historical AFK maps to AFK. Missing historical incident counts are not invented. Deployment timeout diagnostics are never promoted into AFK cards. Unknown legacy classifications are counted separately as `historicalUnknown`.

Forgiveness history is deterministically derived from immutable finalized participations ordered by finalization time and MatchID. Reads deduplicate MatchID; existing finalization transactions remain idempotent. The server-side minimum gate reads the effective percentage. Existing Guest/UNRATED rejection for a positive minimum is retained. Rematch entry now checks the same threshold; rejoin retains its existing same-seat policy.

## Runtime files

- `server/afk-policy.mjs` — shared timer, eligibility, votes, recovery readiness and metadata.
- `server/pvp.mjs`, `server/ring-pvp.mjs` — Duel/Group integration, counters, handoff and worker boundaries.
- `server/room-recovery.mjs` — restore the same warning without creating another incident.
- `server/multiplayer.mjs` — rematch minimum-Reliability enforcement.
- `server/reliability-outcome.mjs` — precedence and finalized Online read model.
- `server/statistics-capture.mjs` — immutable reliability facts/outcome, separate from Score cutoff.
- `server/statistics-metrics.mjs` — reset forgiveness streak for all non-Full classifications.
- `server/statistics-store.mjs` — ordered authoritative reliability history.
- `server/main.mjs` — allowlist the AFK client module.
- `client-v13/afk.js` — shared warning/voting presentation and readiness acknowledgement.
- `client-v13/lan.js`, `client-v13/group-lan.js` — polling/render lifecycle integration.
- `client-v13/registry.js` — correct the existing reliability sentence.

## Verification

- `afk-policy-check.mjs`: 51 checks.
- `afk-lifecycle-check.mjs`: 35 checks, Duel/3P/4P, inline and Group workers; invalid commands, resume, restore, takeover cutoff and outcome.
- `afk-registry-check.mjs`: 36 checks, real temporary SQLite, outcome precedence, forgiveness, Single Player exclusion, finalization idempotence and reopen.
- `afk-browser-check.mjs`: 12 checks, actual 2P/3P/4P browser flow with desktop and narrow contexts; ready acknowledgement, warning, KICK/WAIT, unanimous extension and resume.
- `statistics-reliability-check.mjs`: 10 checks, including first versus second technical disconnect/rejoin and existing departure paths.
- `online-reliability-check.mjs`: 14 checks, legacy mapping, effective forgiveness percentage, minimum gate, Guest/UNRATED policy and rematch rejection.
- Deployment: 21 policy checks; 7 durable-restart checks, including disabled journal.
- Online entry: 8 groups. Registry rematch regression: PASS.
- Match Score: 79 formula checks; 41 tactical checks; all six HTTP/UI result paths and persisted reopening PASS.
- Score/replay persistence: 15 checks, unchanged authority/RNG.
- TypeScript compilation succeeds; no canonical/compiled files changed.

Temporary databases and screenshots were created under the OS temporary directory, outside this checkout. No real private Registry or backups were modified. The playtest launcher still sets `playtestSnapshotOnly:true`; checkpoint journaling remains disabled.

## Physical retest

Retest cross-device Online play, particularly long chains/newsflashes followed by Scout/Rez/Catapult/Hero choices; first and second AFK warnings; changing voter eligibility; WAIT/expiry; unplug/rejoin during a warning; and browser refresh/server restart around a warning. Browser automation covers the ordinary-action flow; the special-choice eligibility checks are deterministic server-policy tests, not physical interaction tests for every unit.

## Rematch composition follow-up

User-reported 2 HUMAN + 2 AI rematches were incorrectly created with four HUMAN seats. Group rematch creation now preserves the original HUMAN/AI composition and original AI identities, using frozen participation records when present and original seat credentials for older rooms. The host joins immediately; other humans must join the rematch themselves. A 2 HUMAN + 2 AI rematch therefore waits for one PLAYER, with both AI seats already ready.

Removed the obsolete inline REMATCH SETUP / APPLY SETUP controls and their CSS visibility exception. No additional configuration step is needed. Runtime files for this follow-up: `server/multiplayer.mjs`, `server/ring-pvp.mjs`, `client-v13/group-lan.js`, `styles-multiplayer.css`.

Verification: `rematch-composition-check.mjs` passes 28 assertions across 2H+1AI, 2H+2AI, interleaved 2H+2AI, and 4H rooms after authoritative completion. Updated `result-screen-live-check.mjs` passes automatic preserved AI setup, no old toolbar, Random/Ready/start, stable statistics and no reload. Updated `result-screen-regression-check.mjs` passes result/rejoin/accounting regressions and same-document Duel/Group rematch with joined-human protection. No commit/push/merge/deployment.


## Resurrection targeting and participant Result scores follow-up

UNACCEPTED / UNPROMOTED. No commit, push, merge or deployment.

- Attack selection now treats every unresolved resurrection suspect as targetable. Physical damage records remain unchanged. Archer, Goblin, Monk, Plague and Catapult share this eligibility; area impacts use the common impact handler. Assassin fallback includes candidates; its guaranteed core strike still selects a real living core cell.
- False candidates are removed from the search, retain their hit marker and emit existing resurrection-rejected feedback ("Not this"). Plague cannot retrigger a dead suspect. Archer now discovers the real resurrected unit like other sources.
- Result scores were missing because only account participants were scored and only the viewing participant's score was attached. All participants now have persisted score components; AI/guest scores do not create account career records. PLAYER formula/cohort and fewer-shots eligibility remain unchanged. AI receives no PLAYER-only fewer-shots bonus.
- Completed Duel displays both participants; Group displays named scores below occupied pedestals. The viewing PLAYER retains the above/below-average comparison when the existing five-sample cohort threshold is met; other participant rows show only scores. Late finalization and reopening use stored scores. Story is excluded. Existing historical rows with no persisted score show Unavailable; no private Registry backfill was performed.

Runtime files for this follow-up: canonical/shared/combat/access.ts, catapult.ts, impact.ts, plague-scheduler.ts, resolver.ts, units/assassin.ts; canonical/shared/host/refresh.ts; their generated compiled outputs; server/main.mjs, match-score.mjs, score-store.mjs; client-v13/presentation.js, result-screen.js; styles-result-screen.css.

Verification: TypeScript compile PASS; resurrection-targets-check 57 checks (11 sources, 2P/3P/4P, selection privacy, restore, real/false feedback); match-score-check 85; score-tactics-check 41; score-replay-integration-check 15; score cohort check PASS; six HTTP/browser Result paths PASS with per-seat stored-score equality and reopening; 390px layout checked. Monk pair 15, pacing 71, pacing Group 10, Assassin 39 and Assassin Group 4 PASS. Screenshots and all test Registry files stayed in OS temporary directories. Physical playtest confirmation remains outstanding.

Completed-match reload correction: /open drops completed local sessions and detaches finalized Online seats before reconnect handling. Saved results/scores remain intact. A pending rejoin prompt also returns to Main Menu if the match finishes. Duel completed departure bypasses stale disconnect episodes. Active matches and in-page Result reopening retain their existing behavior. Six production browser reload paths verify no rejoin/results prompt, repeated reload, cleared resumption, and unchanged persisted participant scores.

UI follow-up: Online Leave uses the shared in-game styled confirmation. Deployment says no Reliability penalty; active battle warns of a penalty (rules unchanged). Result Leave stays immediate. Internal exits skip the opening gate on return to Main Menu; completed-game reload also dismisses the gate. Leave browser coverage: 21 checks including deployment 2P/3P/4P, Cancel/Escape, phone fit and no native dialogs. Chaos notice is centered on the enemy map, nearly full map width, with a large two-line heading; no map displacement or timing change. Desktop/phone pacing browser coverage: 23 checks.

## Restored candidate: AI WAIT completion

Restored from e8328fdc9037074aeb91cfed510223a19068e7e3 on top of fcb89b1. No commit/push. Active AI seats automatically contribute WAIT to unanimity; KICK thresholds count eligible humans only. Human silence still prevents unanimous WAIT. AI cannot submit KICK. Eliminated/departed AI do not vote. The ineffective spectator-strip override remains excluded.

Targeted verification: AFK policy 57, lifecycle 35, Registry 36, Online reliability 14, statistics reliability 10, browser 12 checks PASS. The centered warning is preserved. No new Profile work.
