# Monk targeting and scroll investigation

Accepted checkpoint boundary: MATCH_SCORE_V1 tactical completion, confirmed Monk pair targeting, and shared scroll-jump correction only. Commit/push authorized after verification; NO MERGE / NO DEPLOY.

## Monk: reproduced and corrected

Read-only inspection of finalized match fb962aca-4d56-4885-8ab5-a8c43933792d confirms the reported Round 3 chain (turnIndex 8, match-root-28).
- Event 200: Cruns (seat-2) ordinary AI shot at (3,6) near VondurDEV's Monk at (2,7).
- Event 205: VondurDEV's Monk attacks Cruns.
- Event 207: deflection lands at (5,3), near Cruns's Monk at (4,3).
- Event 209: Monk duel starts.
- Event 211 incorrectly sends Cruns's Monk to Snurk (seat-3).
- Events 218 and 225 send Snurk to Rackler (seat-1), then Rackler to VondurDEV (seat-0).
- The root contains 17 Monk attacks. Event 315 ends it when Cruns's Monk is defeated.

Two target sources were wrong: non-direct proximity used reactionMeta's cached/default enemy; monk-continuation also selected the responding seat's reactionTarget. Proximity now returns to the incoming attack owner. Continuation reverses the existing owner/target pair. No new RNG draws, shot counts, stopping conditions, targeting pools, serialization fields, or Catapult rules were introduced. Exact hits still defeat Monk without retaliation.

Runtime files: canonical/shared/combat/units/monk.ts; canonical/shared/combat/resolver.ts; their two generated compiled .js counterparts.
Tests: tools/monk-retaliation-check.mjs; tools/monk-pair-check.mjs.

15 pair cases across 2P/3P/4P and five seeds pass; four old 4P circulations reproduced. Every step survives serialization/restore. Third/fourth seats receive no Monk attacks. Exchanges terminate on Monk defeat. All five Duel cases match prior complete events/state/RNG exactly. Incoming-attacker and exact-hit checks pass for all formats. Local Group authority/RNG parity (10), Archer/Catapult worker/non-worker cases (8 plus 66 source cases), and Story progression (5) pass.

## Scroll: reproduced and corrected

The earlier controlled test only positioned the viewport around the upper maps and did not use the live Group body class. Extending it to Single Player Group styling, repeated choice changes, and mid/lower/bottom scroll positions reproduced automatic page movement. One deterministic failing observation was resurrection choice cancellation at desktop width 1440: scrollY 227 -> 874, without any focus or navigation call. The reported class of viewport instability is reproducible; this is a renderer-level fixture, not a claim to replay the user's exact complete battle.

Browser scroll anchoring was the shared cause. Diagnostic exclusion of only the choice overlay or only the lower cards was insufficient. Excluding the changing live battlefield subtree (`.st-main`) from scroll-anchor selection prevents automatic movement across the special-choice repaint transitions. The correction is a single `overflow-anchor:none` declaration in `styles-22.css`, scoped to that subtree. It does not disable manual scrolling, change focus/keyboard accessibility, force scroll restoration, resize/reposition maps, or modify combat/animations. No four separate gameplay fixes.

`tools/special-scroll-browser-check.mjs` now checks both Single Player Group and Online Group styling at 1440x800, 390x800 and 850x400. It covers 72 opening/cancellation transitions at half, lower and bottom page positions, plus 60 repeated Hero/Scout/Rez/Catapult/ordinary-shot interactions. Hero confirmation cancellation and Enter completion are included. Every completion asserts a command was actually dispatched. Scroll tolerance is one pixel. Each browser layout also verifies that a manual wheel action still moves the page. Test responses use controlled public fixtures, preserving the actual presentation renderer and CSS.

## Checkpoint verification and scope

Monk: 16 incoming-attacker/exact-hit groups and 15 pair cases pass, with four old four-seat circulations reproduced and all five Duel fixtures retaining exact complete events/state/RNG. The old comparison is pinned to the preceding accepted commit, not moving HEAD. TypeScript compilation passes; only the intended two compiled Monk/resolver files change.

All 35 final suites PASS, including the full Score/Replay/Registry/classification/Result/statistics/authority/Story/deployment/reliability run, both Monk suites, Catapult, input-lock browser tests, and the expanded scroll suite. All 60 interactions, 72 position transitions and six manual-wheel checks PASS. Archer/Catapult regression passes eight worker/non-worker scenarios and 66 source cases. Earlier missing external reference paths are resolved through the existing archived fixtures, using an external test loader without runtime changes.

MATCH_SCORE_V1 tactical components and six-path persisted Result visibility were already accepted/pushed in parent `cbc7d15ef9814db8ef8690e29611c89a6cbf71b6`; they remain in this checkpoint. No Chaos Manifestation, Goblin change, second Elf, Assassin, speculative Castle change, new reliability policy, spectator fix, or Profile visual overhaul is added here. The original AFK checkout's unrelated pending work remains preserved separately.

Private Registry, browser outputs, logs, screenshots and test databases stay outside Git. No commit contains private/temp artifacts. The normal launcher keeps checkpoint.journal disabled.

## Files committed in this checkpoint

- `CURRENT-STATE.md`
- `HANDOFF.md`
- `playtest/MONK-SCROLL-REPORT.md`
- `playtest/build-manifest.json`
- `playtest/canonical/compiled/combat/resolver.js`
- `playtest/canonical/compiled/combat/units/monk.js`
- `playtest/canonical/shared/combat/resolver.ts`
- `playtest/canonical/shared/combat/units/monk.ts`
- `playtest/styles-22.css`
- `playtest/tools/monk-pair-check.mjs`
- `playtest/tools/monk-retaliation-check.mjs`
- `playtest/tools/special-scroll-browser-check.mjs`
