# Pacing pass phase 1

UNACCEPTED / UNPROMOTED. No commit, push, merge or deployment.
Branch: `pacing-chaos-scout-phase1`.
Exact accepted base: `5ae0d21dfe0efda1534a2c81c8008b26986f3228`.
Working checkout: `C:/Users/Notandi/Documents/Codex/score-v1-acceptance`.

## Goblin
New pacing matches use min(available, 15, max(5, ceil(available * 0.066))) bombs per activation. This extends the old 0.044 scaling by 1.5: 225 unshot cells yield 15 bombs, 150 yield 10, and 75 or fewer yield 5 (bounded by remaining legal targets). There is no count RNG draw. The existing Fisher-Yates target shuffle selects unique legal unshot cells. Existing damage, nested reactions and special-kill attribution remain in place. Old-version hosts retain their accepted count algorithm and RNG consumption.

## Two Elves
The roster contains two Elves. Per-owner authoritative non-Plague hit order chooses their benefits: first hit gives five precision choices, second hit gives one area scan. Placement order does not assign abilities. The Scout hit counter persists through turn changes and serialization. Plague does not grant or consume a scouting benefit. The legacy random-placement policy places both Elves on legal cells.

Precision retains five separate answers and the accepted immediate/deferred timing. Area grants one decision, selecting any in-bounds center and scanning its clipped 3x3 neighborhood (9/6/4 cells for interior/edge/corner). It updates the existing observer-scoped Scout knowledge, without impacts, damage, shots or unit reactions. On-turn triggered benefits can resolve in the same causal sequence; off-turn/direct benefits remain queued for the owner's legal Scout step. Precision and area benefits do not overwrite each other.

The area action emits one authoritative `scouted` event with reason `area-scout`. MATCH_SCORE_V1 counts it as one successful discovery at most: +20 if at least one previously unknown occupied cell is discovered, otherwise zero. Multiple discoveries and duplicate/replayed facts cannot multiply the bonus.

## Chaos trigger and order
New Group matches track the transition from a living Demon to none during a root. Evaluation waits until that entire root, including nested reactions and interactive decisions, completes and eliminations have been committed. No-Demon initial rosters and non-final Demon deaths do not trigger. Completed games and boundaries with at most two survivors are suppressed without a shuffle draw. The used/triggered state persists and is fresh on rematch.

For three or four surviving seats, rotate the old ring to anchor the current surviving actor, enumerate permutations of the other active seats, remove the unchanged cyclic order, and select an alternative with one canonical RNG draw. Three seats therefore reverse direction; four have five alternate cyclic orders. An eliminated actor first gets its legitimate successor through the existing elimination boundary. No extra shot, budget reset, board mutation or actor theft is introduced by the shuffle.

A public boolean on the settled Group overview drives a short `CHAOS MANIFESTATION!` newsflash and a restrained CSS shake on all visible grids. The shake uses translation rather than layout changes and respects reduced-motion preferences. Desktop and phone checks confirm identical map bounds afterward.

## Story and information
Both Elves arrive at the existing chapter-6 Elf unlock for the side receiving that reinforcement; the existing chapter-7 synchronization carries both. Later rosters and full games contain both. Unit information, the compact fact line and Elf tutorial text explain five precise choices versus one area scan. The area decision says `CHOOSE ONE CENTER CELL / SCANS A 3x3 AREA`. Goblin information now says 5-15 bombs. No Story numbering, chapters, artwork or narration/audio files were changed.

## Compatibility and data
New matches use `stone-throw-pacing-v1`; retained `stone-throw-v1.427` hosts and replay configurations remain supported. Canonical JSON schemas accept persisted Elf subtype metadata; combat serialization validates optional area-benefit, decision and Chaos fields. New-format private replay and serialized restore are covered. Old records are not relabelled or migrated.

There is no Registry SQL schema change, historical backfill, real Registry write, or private-data migration. Existing MATCH_SCORE_V1 formulas are unchanged except the expressly requested one-success-per-area-action accounting. Existing replay, Result, classification and statistics checks pass. The normal launcher still sets `playtestSnapshotOnly: true`; checkpoint.journal remains disabled.

## Verification
- TypeScript compile: PASS.
- 71 focused canonical/Story checks: Goblin min/max/intermediate/exhaustion/unique targets/RNG; both Elf identities/random placements/restore; 5 precise answers plus one area answer; clipping; no combat effects; private knowledge; successful/unsuccessful/repeated area scoring; all requested Demon death sources; settled boundary; survivor suppression; actor elimination; alternate ring; restore and replay.
- 10 Group transport checks: Single Player 3P/4P and Online 3P/4P, exact local/online host and RNG equality, public Chaos flag, public area choice, restored order and fresh rematch state.
- 6 browser checks at 1440px and 390px: newsflash, all visible maps shake, unchanged final geometry, no duplicate flash on subsequent updates, clear area choice instructions, no page errors.
- Existing authority/RNG, Score, Replay/disclosure/browser, Result and all six score-result paths, Registry/classification/statistics, Story Scout/causal/account/storage/browser, Monk pair/retaliation, Catapult (including Group workers), deployment/restart/reliability and long scroll regression suites: PASS.

44 distinct suites passed in the combined verification runs. Logs remain outside Git in `C:/Users/Notandi/Documents/Codex/pacing-v1-verification`. Four older fixture expectations were updated without weakening their behavioral assertions: Result authority comparison uses the same revised rules on both sides; seeded Goblin playback expects seven contacts for its new count draw; Story account browser enters through the current startup gate; Story Plague progression requires executed impact evidence rather than a pending target flag.

## Physical playtest
Confirm pacing/feel of 5-15 Goblin bombs; distinguish and trigger both placed Elves; try area centers at edges/corners; watch the last-Demon flash in live 3P/4P Single Player and Online, including spectator mode; confirm remaining current-turn shots follow the new ring. Browser tests verify controlled public fixtures; they are not a substitute for a full networked physical playtest of animation feel.

## Exact runtime files changed
- `playtest/canonical/compiled/client-contract/public.d.ts`
- `playtest/canonical/compiled/combat/contracts.d.ts`
- `playtest/canonical/compiled/combat/decisions.js`
- `playtest/canonical/compiled/combat/impact.js`
- `playtest/canonical/compiled/combat/resolver.js`
- `playtest/canonical/compiled/combat/serialization.js`
- `playtest/canonical/compiled/combat/units/benefits.d.ts`
- `playtest/canonical/compiled/combat/units/benefits.js`
- `playtest/canonical/compiled/combat/units/goblin.d.ts`
- `playtest/canonical/compiled/combat/units/goblin.js`
- `playtest/canonical/compiled/host/auto-match.js`
- `playtest/canonical/compiled/host/chaos.d.ts`
- `playtest/canonical/compiled/host/chaos.js`
- `playtest/canonical/compiled/host/contracts.d.ts`
- `playtest/canonical/compiled/host/initialization.js`
- `playtest/canonical/compiled/host/lifecycle.js`
- `playtest/canonical/compiled/host/replay.d.ts`
- `playtest/canonical/compiled/host/replay.js`
- `playtest/canonical/compiled/host/ring.js`
- `playtest/canonical/compiled/invariants.js`
- `playtest/canonical/compiled/local-host/authority.js`
- `playtest/canonical/compiled/local-host/normal-step.js`
- `playtest/canonical/compiled/model.d.ts`
- `playtest/canonical/compiled/policy/placement-legacy.js`
- `playtest/canonical/compiled/schema.js`
- `playtest/canonical/shared/client-contract/public.ts`
- `playtest/canonical/shared/combat/contracts.ts`
- `playtest/canonical/shared/combat/decisions.ts`
- `playtest/canonical/shared/combat/impact.ts`
- `playtest/canonical/shared/combat/resolver.ts`
- `playtest/canonical/shared/combat/serialization.ts`
- `playtest/canonical/shared/combat/units/benefits.ts`
- `playtest/canonical/shared/combat/units/goblin.ts`
- `playtest/canonical/shared/host/auto-match.ts`
- `playtest/canonical/shared/host/chaos.ts`
- `playtest/canonical/shared/host/contracts.ts`
- `playtest/canonical/shared/host/initialization.ts`
- `playtest/canonical/shared/host/lifecycle.ts`
- `playtest/canonical/shared/host/replay.ts`
- `playtest/canonical/shared/host/ring.ts`
- `playtest/canonical/shared/invariants.ts`
- `playtest/canonical/shared/local-host/authority.ts`
- `playtest/canonical/shared/local-host/normal-step.ts`
- `playtest/canonical/shared/model.ts`
- `playtest/canonical/shared/policy/placement-legacy.ts`
- `playtest/canonical/shared/schema.ts`
- `playtest/client-v13/action-instructions.js`
- `playtest/client-v13/chaos-presentation.js`
- `playtest/client-v13/presentation.js`
- `playtest/client-v13/story-policy.js`
- `playtest/client-v13/shell.js`
- `playtest/server/main.mjs`
- `playtest/server/projection.mjs`
- `playtest/server/pvp.mjs`
- `playtest/server/ring-pvp.mjs`
- `playtest/server/score-tactics.mjs`
- `playtest/styles-22.css`

## Tests changed/added
- `playtest/tools/pacing-browser-check.mjs`
- `playtest/tools/pacing-check.mjs`
- `playtest/tools/pacing-group-check.mjs`
- `playtest/tools/result-physical-bugs-check.mjs`
- `playtest/tools/result-screen-authority-check.mjs`
- `playtest/tools/story-account-check.mjs`

## Other candidate files
- `CURRENT-STATE.md`
- `HANDOFF.md`
- `playtest/PACING-PHASE1-REPORT.md`
- `playtest/build-manifest.json`

Assassin, Profile, AFK policy, Event-panel polish and unrelated Battlefield changes are excluded. The separate original checkout's pending work was not modified.

## Chaos animation target correction
Physical log 7E9C9E changes the observer target from Rackler (seat 3) to Matti (seat 1) in round 18. Cached per-seat combat playback retained mounted DOM grids after the primary enemy grid changed identity. Invalidate and unmount those caches at settled target changes. No authority, RNG, target selection or layout changes. Runtime file: client-v13/online-overview.js. The browser regression reproduced the stale Archer endpoint before the fix and verifies the correct secondary-board endpoint afterwards at desktop 1440px and mobile 390px. Eight browser checks, existing overview/privacy/real-elimination checks and ten local/Online group parity checks pass.

## Area Scout preview follow-up
Second Scout area choice displays temporary circles on the hovered 3x3 footprint, clipped to board edges. No hidden knowledge or gameplay changes. Pointer exit and precision choice remove the preview. Desktop/narrow browser checks PASS (10 groups including existing pacing checks).

## Leave Match, Online Quick Start, route and Plague readability follow-up
- Online Quick Start hidden and proposal click disabled; local Quick Start unchanged.
- Shared Leave Match confirmation with OK/Cancel covers battlefield Leave and result actions. Confirmed departure finalizes active local participation before clearing its resume slot, or invokes existing Online surrender/handoff without disconnect grace. Completed matches leave without surrender reclassification. Main Menu through Options remains resumable. Successful leave reloads the same application URL into Main Menu to discard stale playback/polling controllers.
- Three-map curved route anchor uses the near-map position for both active and spectator views, including local Group. No map dimensions or spacing changed.
- Plague popup uses public identity where available, Unidentified core unit for withheld identity, or Plague hit otherwise. Assassin added to popup names. Group Event log adds owner-named Plague damage/destruction from canonical events; unit names are limited to public board/owned-unit data, with no private coordinates or handles exported. Duel/Story Plague wording distinguishes Plague from ordinary enemy shots.
- Physical log round 29 contains opponent Plague impact at (3,11), event 708; exported trace does not include cell identity, so exact victim is not inferred.
- Verification: 16 leave lifecycle/browser checks; 3 mode separation checks; 14 narrative checks; 13 desktop/narrow pacing/browser groups including route and Plague text; 21 deployment/rejoin checks; six result/score paths including completed departure; Castle disclosure canonical/browser checks; Assassin 38 canonical and 4 Group parity checks.
- UNACCEPTED / UNPROMOTED. No commit/push/merge/deployment.
