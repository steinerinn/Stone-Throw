# Final MATCH_SCORE_V1 acceptance — 2026-09-24

Score visibility is physically confirmed. This supplements the earlier code-foundation checkpoint below; no formula-version bump. Commit/push only; no merge or deployment.

## Final additions

- `server/score-tactics.mjs` consumes canonical facts only. A previously unknown occupied Scout result earns 20; empty choices, phase entry and duplicate discoveries earn zero. Genuine Plague impact cells earn five, attributed to Plague owner rather than the triggering shooter. Explicit canonical ability sources earn ten per destroyed enemy unit, not per occupied cell. Hero queue deaths use the same last-authoritative-impact attribution as Registry kills. Resurrection starts a new unit life; repeated death records do not add kills.
- All three components obey the authoritative PLAYER departure cutoff. Direct shots cannot earn ability-kill points; indirect/Plague hits cannot incur the existing direct-special penalty. Missing evidence remains an explicit issue, with no invented score.
- `match-score.mjs` adds the three rational components to MATCH_SCORE_V1 without changing prior components. `score-store.mjs` replaces old totals during backfill and clears stale totals/version together when evidence is ambiguous, retaining the decomposition/issues. Career and Result cohorts exclude those ambiguous rows.
- Existing Score visibility wiring reads persisted own-seat scores after finalization across Single Player/Online Duel/3P/4P. Result reopening does not recompute Score. Comparison cohorts read revised stored totals with their existing finalization-time boundary.
- No combat, RNG, placement, Battlefield, AFK policy, Profile visuals or schema changes in this final increment.

## Revised historical backfill

67 finalized matches / 86 registered PLAYER participations. 68 scoreable; 18 ambiguous: 11 dense-placement evidence gaps and seven departure-cutoff gaps. No additional tactical evidence gaps in the retained history. Scoreable totals, including departure outcomes: mean 757.6681, median 756.2575, range 0–1174.9655.

| New component | Mean points among 68 scoreable participations | Positive participations | Maximum |
| --- | ---: | ---: | ---: |
| Successful Scouting | 15.2941 | 37 | 60 |
| Plague Spread | 24.1912 | 35 | 125 |
| Special Ability Kills | 56.9118 | 66 | 120 |

Private backup was created before transactional apply; backup and live integrity checks passed. Dry/apply digest `d1f3698507f8613b80dc63a27ded7086883fe63965106f27a3be9153ca58f11a`. Repeated apply produced identical score rows. All unrelated tables, non-Score participation fields and faction rows were unchanged. Full dry/apply reports and backup paths are outside Git.

## Verification

The tactical suite has 41 deterministic checks, including +20 successful Scout, +65 for 13 Plague cells, +20 for two ability kills, duplicates, ownership, cutoff, Hero deaths, ambiguity, replacement of stale V1 totals, rollback and idempotence. The existing 79 Score checks and 15 real-host Score/Replay integration checks pass. Six real HTTP/browser Result-score paths and persistent reopening pass.

All 30 final suites PASS. Final regression run also covers Replay/disclosure/browser; Registry/service/browser/multiplayer/rematch; classification; Result/authority/browser/live/physical cleanup; statistics/chain/seat/reliability/parity; local Group authority; Story causal progression; journal-disabled snapshots; deployment/restart; and Online reliability. Older tests were adapted to the accepted startup gate, seat-button controls, same-document entry, real host shape for replay capture, the accepted default-avatar migration, and OS-temp report output. No assertions were removed to hide runtime failures. Legacy reference imports use the existing archived fixtures through an external test loader.

The final manifest digest is reported with the acceptance commit, not embedded in the file it hashes. The original AFK candidate remains preserved separately; its pending changes are excluded.

## Files in this final acceptance commit

- `CURRENT-STATE.md`
- `HANDOFF.md`
- `playtest/MATCH-SCORE-REPLAY-REPORT.md`
- `playtest/build-manifest.json`
- `playtest/client-v13/presentation.js`
- `playtest/client-v13/result-screen.js`
- `playtest/server/main.mjs`
- `playtest/server/match-score.mjs`
- `playtest/server/score-store.mjs`
- `playtest/server/score-tactics.mjs`
- `playtest/server/statistics-store.mjs`
- `playtest/styles-result-screen.css`
- `playtest/tools/registry-browser-check.mjs`
- `playtest/tools/registry-multiplayer-check.mjs`
- `playtest/tools/result-score-cohort-check.mjs`
- `playtest/tools/result-score-paths-check.mjs`
- `playtest/tools/result-screen-live-check.mjs`
- `playtest/tools/result-screen-regression-check.mjs`
- `playtest/tools/score-tactics-check.mjs`
- `playtest/tools/statistics-check.mjs`

---

# Match Score / recent battles candidate

Branch: `match-score-profile-foundation`

Base: accepted `b02d08b7cbde51f76cdbb5a924df0c7c116c08d4` (clean before branch creation).

ACCEPTED AS A CODE FOUNDATION CHECKPOINT on 2026-09-24; authorized for commit/push only. NO MERGE / NO DEPLOY. Match Score and PLAYER vs AI remain on the physical watchlist until normal Profile/Result presentation exists. Replay production UX remains unexposed.

Final acceptance verification repeated the focused score/replay, disclosure, real-host integration, Online reliability, departure/rejoin, local authority/RNG, browser replay, durable deployment restart and local Result suites. Both historical backfills were rerun twice on a temporary consistent Registry copy with equal resulting rows and integrity_check=ok; the live Registry was opened read-only.

## Stage 1 — Match Score V1 and PLAYER vs AI

The user's latest surrender correction overrides the contradictory completion sentence in the pasted specification. Voluntary surrender/early exit is a reliability failure and receives performance-only Score. The original `Quit` reason remains preserved in historical participation records; the score/recent-battle read models label it `Disconnect/Abandon`, and Online reliability counts Quit, Disconnect and Kick as failures. Grace/rejoin remains unpenalized. Existing Online-only reliability scope and diagnostic-only deployment AFK policy remain unchanged.

`MATCH_SCORE_V1` reuses `stat_participants.match_score` and `score_formula_version`, adding `score_components` for the exact score/decomposition. No parallel player-score table was introduced. Components use reduced rational numbers serialized as decimal-string numerator/denominator pairs. The numeric score is a display/read convenience; career totals are rebuilt by exact rational addition, without repeated floating-point accumulation.

- Completion: 500 only for Full participation without a departure cutoff.
- Placement: Duel 200/0; 3P 250/100/0; 4P 300/150/75/0. New captures retain canonical Result Screen dense placements. Historical ranks require sufficient retained elimination evidence.
- Efficiency: min(100, 250 * ordinary hits / ordinary shots); zero shots gives zero.
- Biggest Chain: reconstructed processed cells, uncapped, stopping at the participant's authoritative cutoff.
- Fewer Shots: 100 for a completed rank-one PLAYER strictly below every other completed PLAYER, with at least one comparator.
- Special penalty: -10 per ordinary direct special contact; canonical special taxonomy, dormant/activated Hero distinction, no indirect/Plague charge or duplicate contact charge.
- Awards: canonical Result Screen calculations across all seats, including AI; each award's 10-point pool is divided exactly among its recipients. Incomplete PLAYERs receive none.
- Early departure: no completion, placement, fewer-shots or awards; no later takeover performance. Missing historical departure cutoffs remain ambiguous rather than being invented.

Career read model exposes exact/lifetime total, scored-match count, highest score and completed thousandPlusCount. PLAYER vs AI uses one `stat_factions` row per match with integer twelfths. Starting factions remain frozen; Story/pure PLAYER/unfinished matches are excluded, and draws/cross-faction ties yield zero.

Historical results:

- 62 finalized matches, 81 registered PLAYER participations inspected.
- 63 participation scores applied; 18 left unscored: 11 lack dense-placement evidence and 7 lack departure cutoffs.
- 42 faction contributions applied; 19 mixed matches lack sufficient result evidence. One other match is outside the mixed-match scope.
- PLAYER: 236 twelfths = 19 2/3 points. AI: 241 twelfths = 20 1/12 points.
- Dry run reviewed before writes; backup integrity verified; backfill transactional and rerun equality verified.
- All 13 original Registry tables compared against the pre-score backup, excluding only the intended score columns: no unrelated changes. All 4,843 ordinary unit-contact facts audited had unit taxonomy. Registry integrity_check = ok.

Score backup:
`C:\Users\Notandi\AppData\Local\ChainSiege\Registry\backups\registry-before-match-score-1790216199281.sqlite`

Detailed private dry run/apply audit (outside Git):
`C:\Users\Notandi\AppData\Local\Temp\match-score-v1-approved-dryrun.json`
and its `.applied.json` companion.

## Stage 2 — Recent battles / replay foundation

One `stat_replays` payload per MatchID. Profiles query their five most recent finalized non-Story registered PLAYER participations, ordered by end time, start time and MatchID. Surrender/permanent-departure metadata is retained. Guest and AI have no profile history. A replay is retained while any registered participant's latest-five set references it. Pruning occurs within finalization/backfill transactions; orphan public checkpoint facts are also released. Existing authoritative accounting facts are unchanged.

Envelope version: `CHAIN_SIEGE_PUBLIC_REPLAY_V1`.

Envelope fields: version, MatchID, rules version, build, mode/format, size, start/end times, public participant identities/status, coverage and timeline. No account IDs, unit IDs, private placements, decisions/candidates, RNG, credentials, policy data or server paths are serialized into it.

Replay compilation uses an explicit allowlist of public contact/shot, special announcement, Catapult contact, Plague, Hero/resurrection announcement, elimination and result events. New captures additionally store public board/round/turn deltas in `stat_facts` under the `public-replay` kind. Unit art uses the accepted board-disclosure adapter with private Scout knowledge removed. Castle geometry uses the existing predicate; no disclosure rule was changed. The completed-board reveal appears only at the final checkpoint.

The viewer uses stored state only, with seek checkpoints every 32 timeline entries. Seeking never invokes authority, AI policy or RNG. Previous/next, beginning/end, slider, event counter, round/turn, cell highlights and special announcements are implemented. It reuses the accepted read-only `paintOverview` renderer and existing unit art. Production menus, Profile, Results, HOF and battlefields have no replay link; browser tests mount it through a bounded intercepted test page. No portable-file upload/download or autoplay was added.

Backend calls on `statisticsStore`:

- `profileSummary(playerId)` — Score, reliability, existing career data and faction totals.
- `recentBattles(playerId)` — latest five, public participants, participation/result/placement, score/decomposition, duration and replay availability.
- `replay(playerId, matchId)` — only a match within that Profile's latest five.
- `factionContributions()` — per-match faction audit.

Historical coverage: 0 full, 60 partial, 2 without usable event history. Historical partial replays contain contacts/announcements but lack the new public-art checkpoints and reliable round labels; missing presentation history is not invented. New-capture integration tests cover full public-event history. Art updates occur at captured public checkpoint boundaries, so they may follow a batch of contacts rather than reproduce every original animation frame. This is an event replay, not a frame-perfect video or combat resimulation.

Historical retention after backfill: 14 shared payloads, 981,660 UTF-8 bytes total; average 70,119 bytes, maximum 86,553 bytes. These are measured historical partial envelopes; new public checkpoints add data, so they are not a production size guarantee. At that observed average, five distinct payloads are approximately 350 KB before SQLite overhead. Sharing reduces duplication between Profiles. Accounting facts retain their existing separate storage lifecycle.

Replay backup:
`C:\Users\Notandi\AppData\Local\ChainSiege\Registry\backups\registry-before-replays-1790216687117.sqlite`

Historical coverage/apply audit (outside Git):
`C:\Users\Notandi\AppData\Local\Temp\replay-foundation-dryrun.json`
and its `.applied.json` companion.

Desktop/phone screenshots (test fixture, not a real private match):
`C:\Users\Notandi\AppData\Local\Temp\cs-replay-browser-rIX0RM\replay-1280.png`
`C:\Users\Notandi\AppData\Local\Temp\cs-replay-browser-rIX0RM\replay-390.png`

## Verification

New checks: Match Score 79; replay storage/seeking/privacy 34; real-host score/replay integration 15; disclosure geometry/privacy 18; desktop/phone browser controls 12. Total: 158 focused assertions/groups.

Regression checks: classification 15; local Group authority/RNG 10; Story causal progression 5; Monk targeting/RNG 14; statistics departure/rejoin 8; Online reliability 11; deployment 21; deployment durable restart 7; local Group completion/Result 8; Result calculations 9; Result browser 21. Total: 129 counted assertions/groups, plus passing Game Log history and Registry rematch suites. Browser checks use the existing local browser harness; initial invocations without that environment variable failed to locate Playwright and were rerun successfully with the harness.

No canonical gameplay files or accepted Battlefield/Deployment/Result UI files were edited. `checkpoint.journal` remains disabled in the normal playtest launcher, with durable-restart verification passing. Test databases, screenshots, audits and backups remain outside Git. Nothing was staged.

Profile visual design, production replay navigation, portable replay files, autoplay and more elaborate animations remain deferred. Historical ambiguities remain explicit. Existing Catapult and other physical watchlist items were not changed.

## Exact files changed

Runtime:
1. `server/registry.mjs`
2. `server/statistics-capture.mjs`
3. `server/statistics-store.mjs`
4. `server/match-score.mjs`
5. `server/score-store.mjs`
6. `server/replay.mjs`
7. `server/replay-store.mjs`
8. `client-v13/replay-state.js`
9. `client-v13/replay-viewer.js`

Tests/tools:
10. `tools/online-reliability-check.mjs`
11. `tools/match-score-check.mjs`
12. `tools/score-backfill.mjs`
13. `tools/replay-check.mjs`
14. `tools/replay-disclosure-check.mjs`
15. `tools/replay-browser-check.mjs`
16. `tools/replay-backfill.mjs`
17. `tools/score-replay-integration-check.mjs`

Documentation/integrity:
18. `MATCH-SCORE-REPLAY-REPORT.md`
19. `build-manifest.json`

All paths above are relative to `playtest/`. The manifest includes the candidate files and is verified separately after this report is written.
