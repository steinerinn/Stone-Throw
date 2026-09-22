# Multiplayer UI Phase 1A — pre-commit investigation and fixes

ACCEPTED by physical user testing on 2026-09-22. See ACCEPTANCE.md for final verification, commit authorization and non-blocking watchlist. The investigation and pre-acceptance working-tree observations below remain historical evidence.

## Branch and preserved work

Branch: `multiplayer-ui-phase1`. HEAD and accepted base remain `9fd9ec7e9691f17c5a539ecf504660169af23d31`. The working tree was already dirty with the Phase 1A/physical/overnight changes; those remain in place. This pass adds the changes listed below. After this pass: 42 modified tracked files and 22 untracked project files (64 paths total, including inherited work); zero staged files. Earlier accepted branches and checkpoints were not modified. Temporary Registry databases/browser state and generated captures are outside the repository.

## Story: two authorities had been conflated

The Registry's `story_progress` table stored only the highest completed battle and replaced it only with an equal/higher battle. Continue restored that historical checkpoint. Meanwhile Start Over cleared browser-local Story history, finished and Lore keys but did not reset the Registry checkpoint. Consequently, a new low-numbered run could not supersede the old high-water record; account refresh restored the old Necromancer-era route.

Story Path and Lore were browser-local, account-keyed lists populated when a screen was viewed. Restoring an account's later checkpoint on another browser did not reconstruct earlier chapters. Clearing those lists on Start Over produced sparse history; Goblin had no special combat defect—it was missing because its earlier narration had never been recorded in that browser (or had been erased).

An additive `story_runs` table now separates active `run_id`/completed checkpoint from monotonic lifetime scene/unit/completion unlocks, keyed by immutable Player ID. Authenticated Start Over creates a new run ID and null active checkpoint; lifetime unlocks and permanent Hero/avatar unlocks remain. Completed authoritative Story results advance only their own run, monotonically within that run. Old-run completions cannot overwrite the new run. Local Story slots save the run identity and are not offered as current-run recovery after reset. Guest ownership is retained; it is not silently rebound to a subsequently logged-in account.

Lifetime reconstruction uses the canonical ordered opening, authoritative completed battle, saved routing context, rosters and Plague/Cleric facts. The normal Goblin chapter is therefore present after its legitimate unlock. Conditional Cleric content is not granted on an untouched non-Plague route. Story Path and Lore merge these Registry lifetime facts with already-recorded local history. No particular real account or three observed chapter titles is special-cased.

Migration safety: the previous high-water row is preserved and read conservatively as the legacy active checkpoint until the account explicitly starts a new run. The new table is additive; no accounts, sessions, career records or real private databases were edited in testing. A Start Over performed *before* this repair left no server reset fact: its intended new-run position cannot safely be inferred. No automatic rewind/wipe or broad real-data repair was attempted. Use Start Over once on the fixed candidate when a genuinely fresh run is intended.

Evidence: a fresh isolated account completed battles 1–8 via the authoritative service. Path/Lore included Goblin. UI Start Over retained all lifetime entries, then the new run completed only battle 1. Logout/login, a second phone-sized browser and server restart retained active battle 1; Continue opened the Castle transition rather than the old Necromancer point. Separate storage tests cover legacy import, stale completion rejection, lower-result rejection, unchanged auth/career data, permanent Hero unlock and conditional Cleric routing. Existing account Story tests also pass. No mid-battle cross-device save system was added.

## Plague: confirmed same-target replacement defect

Before this pass, `schedulePlague` removed every existing Plague container for the target board before appending the new one. A detached copy could finish the step already executing, but its later scheduled steps were lost. The old deterministic fixture retained **one**, not two, outbreaks. This was an authoritative identity/lifecycle defect, not merely slow graphics.

Each scheduled container now survives independently, with its existing immutable match/root-scoped `statisticsId`, owner/trigger/source origin, target board, seed, infected set, frontier and round. Scheduled work carries an optional `plagueId`; progress/removal and statistical attribution select that exact outbreak. Legacy serialized work without the optional field is still supported. Bounded private diagnostics use the same immutable identity and report removal per outbreak. AI protection/escape adapters consume the union of all matching outbreaks instead of only the first, retaining the existing protection formula and random selection policy.

Rules preserved: seed plus four expansions; early exhaustion only when no legal continuation is available; Hero contact does not cancel the outbreak; source elimination retains it and uses the accepted target-turn fallback; target elimination clears the outbreaks on that target. Shared already-shot cells may legitimately block overlap. Frontiers/history remain separate; there is no merged growth budget. Shared ambience remains unchanged. Plague remains separate from ordinary accuracy. Frozen historical expectations were not rewritten. Keeping a second outbreak is the explicitly requested compatibility correction; the previously lost outbreak now legitimately changes dual-outbreak outcomes/RNG consumption. Single-outbreak accepted host/RNG parity is unchanged.

Deterministic resolver fixture, two different sources on one board:

| Step | A added cells | B added cells |
|---|---:|---:|
| Seed | 1 | 1 |
| 2 | 1 | 2 |
| 3 | 1 | 3 |
| 4 | 2 | 5 |
| 5 | 3 | 10 |

Both IDs remain distinct; the inactive outbreak is byte-for-byte unchanged during the other's step; each impact retains owner/ID/step attribution. Serialization after every operation reproduces identical state/RNG. Same-owner scheduling, source elimination, target elimination and union protection are also checked.

## Why it can look slow

A separate four-seat real service fixture injects two independent outbreaks at known origins, then uses ordinary legal HTTP-service command paths. Each source receives exactly five progression opportunities at its own turn boundary. Source B advances at commands 1/9/17/25/33; A at 5/13/21/29/37. Their added cells are respectively 1/1/1/2/3 and 1/1/2/3/6. This is normal random branching, not stolen or alternating shared steps. Other players' turns occur between the scheduled opportunities.

Server work for those ten actions was approximately 8–30 ms. Feeding their actual public frames through the browser renderer took approximately 226–419 ms per update (2–7 frames, including the originating ordinary shot). The renderer serializes presentation and waits for authored shot/paint timing; no extra Plague timer was introduced or shortened. Exact timings are in the evidence JSON. The physical match without a log cannot be reconstructed: the confirmed replacement defect can lose continuation, while random low branching and current serialized playback can also look slow. No unsupported claim that all observed slowness had one cause, and no arbitrary pacing change.

## Narration resume

Continue previously preferred the host/local battle checkpoint and had no preserved pre-deployment narration stage; visiting Main Menu could resume that host instead of the chapter. The browser now retains the pending narration action with its account/run identity until Story deployment starts. Main Menu stops audio but does not advance the chapter. Continue reopens the same narration (audio restarts normally); entering deployment clears it. Opening Story Log does not replace it. This is presentation-stage retention, not a new battlefield save format.

The test leaves both Chapter 1 narration and the Castle transition for Main Menu, then returns to the same chapter; normal Chapter 1 deployment follows successfully. An unmounted narration-only client no longer attempts to call a removed battle view getter when pausing for Main Menu. Existing narration text/audio mappings/routing are unchanged.

## Locked input

Two holes were identified: settled newer Group authority could enable shooting while older presentation was still playing; and event gating tested only the current lock, so a pointerdown received while locked could produce an accepted click after unlock. The original controller submitted a command in the latter regression fixture.

Playback now always locks battlefield intent until delivered. A pointer gesture is valid only when it begins legally and survives unchanged battle/revision/choice and input validity through release; entering playback invalidates held gestures. Locked clicks are discarded at capture, not queued. The shooting cursor class is removed immediately when playback starts. Keyboard/programmatic activation remains subject to current legality; special decisions become usable once their presentation is settled.

Real browser tests: eight enemy-turn clicks; locked-down/unlocked-up; legal-down/locked-up; fifteen clicks through real Archer-chain playback with newer authority already ready; and ordinary legal clicks before/after. Zero delayed commands; exactly one command per legitimate click. The real 2-Human + 2-AI Group heartbeat/start check also passes during a ten-second presentation lock. No server input/reconnect validation was weakened.

## Verification

- New/updated focused named checks: Story browser 11, Story storage 9, input browser 6, dual-outbreak 15: **41/41**.
- Existing Plague continuation cases: **22/22**, including all relevant units, Hero, source/target elimination, frontier exhaustion and serialized resume. Together: **63/63**.
- Ten service progression records and ten matching browser playback measurements; no missing outbreak steps.
- Existing account Story checks: **11/11**.
- Exact accepted authoritative combat/RNG parity: Infantry, Wizard, Dragon, Demon, Archer, Goblin; separate accepted single-outbreak Group replay also passes.
- Existing Scout observer/privacy/elimination switch, final 2/3/4 reveal and exact-board Plague, one Catapult cue/summary, Archer impact timing, desktop/phone 2/3/4 layouts, 4→3→2→1 transitions, spectator cleanup and stale callback disposal pass.
- 2H+2AI heartbeat during long playback, old/new stale-poll regression and bounded private capture worker/rotation/host-RNG parity pass.
- Full existing regression runner: **8/8 suites PASS** (HOF, public qualification, browser audio, live lifecycle/REJOIN/statistics, music routing, rematch, music unit checks, statistics reliability).
- Normal launcher starts and restarts successfully with an isolated Registry/snapshot; no checkpoint journal is created.
- Git diff whitespace checking still flags inherited trailing spaces/retained legacy CRLF formatting; no formatting-only rewrite was made.
- Canonical TypeScript compilation passes. Final manifest verification is recorded in root CURRENT-STATE/HANDOFF.

The reviewed local recovery contract is updated for the additive operation field and includes the immediate prior candidate. Serialized legacy no-ID work remains valid. No checkpoint was relabelled or deleted; launcher directories stay build-bound. `checkpoint.journal` remains disabled for playtesting.

## Exact files changed in this pass

Paths below are relative to `playtest/`; generated compiled counterparts are included intentionally.

- `StoneThrow-v1.427-stage13-development.html`
- `StoneThrow-v1.427-stage13-production.html`
- `canonical/compiled/combat/contracts.d.ts`
- `canonical/compiled/combat/plague-scheduler.js`
- `canonical/compiled/combat/resolver.js`
- `canonical/compiled/combat/serialization.js`
- `canonical/compiled/combat/statistical-facts.js`
- `canonical/compiled/combat/units/necromancer.js`
- `canonical/compiled/host/lifecycle.js`
- `canonical/compiled/local-host/normal-policy.js`
- `canonical/compiled/policy/auto-target.js`
- `canonical/compiled/policy/special-decisions.js`
- `canonical/shared/combat/contracts.ts`
- `canonical/shared/combat/plague-scheduler.ts`
- `canonical/shared/combat/resolver.ts`
- `canonical/shared/combat/serialization.ts`
- `canonical/shared/combat/statistical-facts.ts`
- `canonical/shared/combat/units/necromancer.ts`
- `canonical/shared/host/lifecycle.ts`
- `canonical/shared/local-host/normal-policy.ts`
- `canonical/shared/policy/auto-target.ts`
- `canonical/shared/policy/special-decisions.ts`
- `client-v13/presentation.js`
- `client-v13/story-account.js`
- `client-v13/story-browser.js`
- `server/main.mjs`
- `server/plague-capture.mjs`
- `server/registry.mjs`
- `server/story-progress.mjs`
- `source/legacy/story.js`
- `tools/local-recovery-contract.json`

New tests/evidence/report:

- `tools/dual-plague-check.mjs`
- `tools/story-run-storage-check.mjs`
- `tools/precommit-story-browser-check.mjs`
- `tools/precommit-input-browser-check.mjs`
- `tools/precommit-plague-service-check.mjs`
- `tools/precommit-plague-browser-check.mjs`
- `tools/fixtures/input-archer.json`
- `MULTIPLAYER-UI-PRECOMMIT-REPORT.md`
- `MULTIPLAYER-UI-PRECOMMIT-EVIDENCE.json`

Root `CURRENT-STATE.md` and `HANDOFF.md` receive a new unaccepted handoff entry; `playtest/build-manifest.json` is regenerated. Earlier reports remain historical. Prior Phase 1A/overnight changes are retained, not reclassified as new edits here.

Browser tests accept `ST_BROWSER_HARNESS` as the file URL of the existing Playwright launch helper and `ST_PRECOMMIT_EVIDENCE_DIR` as an external temporary output directory. Run the Plague service test before its browser timeline test. The small input fixture is public projection from an isolated test match; no private account or runtime database is packaged.

## Short physical checklist

1. Use `playtest/PLAYTEST-LAN.cmd`. Log into the Story account, inspect Story Path and Unit Lore (including Goblin), then Start Over. Confirm earlier lifetime entries remain.
2. Leave Chapter 1 narration for Main Menu and Continue. It should return to that narration. Deploy, complete only the new first battle, leave/log out/in and Continue: expect the new Castle transition, not the old high-water chapter. A second device should see the same completed checkpoint/lifetime unlocks.
3. In Group, keep Game Log ON for investigation. When two Plagues reach one board, check that both continue through their own remaining steps, subject to legal frontier/target survival. Preserve the log if the natural physical case differs; exact timing is still a physical observation item.
4. Click/hold an enemy cell during another player's turn and through a chain; release around your turn transition. Nothing should fire until a new legal click. Then fire normally once. Check a normal pending special choice too.
5. Briefly confirm the existing board slide/final overview and Rematch/REJOIN remain as before.

Physical acceptance received. Locked-click and dual-Plague pacing remain non-blocking natural-observation watchlist items. No further feature work or polish was started.
