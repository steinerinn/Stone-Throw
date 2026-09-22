> Superseded for layout/finalization by MULTIPLAYER-UI-FIX1-REPORT.md. The third board is now bottom-left, and terminal matches restore every original participant with global final reveal.

# Multiplayer UI Phase 1A — implementation report

Status: UNACCEPTED / UNPROMOTED. Physical testing required. No commit, push, merge or deployment.

## 1. Branch and starting checkpoint

Branch: multiplayer-ui-phase1. HEAD remains 9fd9ec7e9691f17c5a539ecf504660169af23d31, the accepted Avatar/Profile Phase 1 checkpoint. The working branch began at that exact commit. Earlier accepted branches were not modified.

## 2. Exact changed files

Runtime (11 files):
- client-v13/presentation.js
- client-v13/online-overview.js (new)
- client-v13/overview-board.js (new)
- client-v13/combat-playback.js
- client-v13/legacy-animations.js
- server/board-overview.mjs (new)
- server/group-presentation.mjs
- server/ring-pvp.mjs
- server/pvp.mjs
- server/main.mjs
- styles-online-overview.css (new)

Verification/documentation:
- tools/online-overview-check.mjs (new portable Scout/projection regression)
- tools/local-recovery-contract.json (accepted predecessor manifest added; engine digest unchanged)
- MULTIPLAYER-UI-PHASE1A-EVIDENCE.json (new)
- MULTIPLAYER-UI-PHASE1A-REPORT.md (this report)
- build-manifest.json
- ../CURRENT-STATE.md
- ../HANDOFF.md

No assets were generated or changed. No private Registry data, browser profiles, temporary databases, source archives or generated match recordings were copied into the repository. Workspace browser harnesses and synthetic fixtures remain outside the candidate.

## 3. Existing architecture reused

The server still resolves every action. Existing observer/target views and multicell, stationary-unit, resurrection, Hero and unit-strip disclosure helpers produce the additional public board views. Existing synchronous presentation capture supplies resolved impact frames. The existing ordered client presentation queue owns delivery and the settled boundary. Legacy visual primitives receive a grid resolver rather than a second game controller. Existing room/session mounts dispose the additional renderer together with the primary renderer.

All 684 checked canonical engine, asset, Registry/statistics and music/audio files match their accepted hashes. The new code does not submit gameplay commands or consume gameplay RNG.

## 4. Implemented presentation

- Online Duel and Group: small gold dial, central authoritative ordinary-shots count, pointer toward the authoritative turn owner's board. Names stay on boards. The pointer follows turn control, not nested attack ownership.
- Three active players: existing own/target pair plus one centered secondary board.
- Four active players: own/target pair; lower left is the local player's attacker, lower right is the target's target.
- Every secondary board has a public unit strip directly beneath it.
- Thin muted gold arrows show the authoritative surviving cycle at three/four players; none at two. The dial remains at two.
- Cells can update during a chain, but layout membership/route changes wait until the presentation queue settles.
- Remaining lower cards use a 230 ms positional transition. Target promotion uses a short visual clone transition into the existing primary target slot, preserving the existing input renderer. The clone is non-interactive and hidden from accessibility.
- Eliminated local players can observe the remaining public boards without acquiring an input controller.
- Resolved Archer, Wizard, Dragon, Demon and Goblin cues address their actual displayed origin/destination boards. Existing visual timing/assets/newsflashes are reused. Demon uses the already reserved public rune data.
- Plague marks, public hits/misses, public Hero states and resurrection suspects render from existing sanitized presentation data. Castle tiles use the existing decoded-image readiness gate.
- No new global Scout, Hero, resurrection or Catapult callouts. Catapult retains its existing primary-view playback and results; no new cross-board Catapult projectile.

## 5. Privacy

Every extra board is projected using the same local observer and that specific target board. It never borrows the attacker of that board as the observer. The output has public cells, roster/status strip, Plague cells, masked resurrection candidates and public Hero marks; no private unit IDs, canonical units, AI memory or RNG state.

The focused real Scout sequence makes five decisions, then eliminates the prior target. The discovering player retains their knowledge. Another observer sees neither foreign Scout payload fields nor Scout DOM classes before/after receiving that target. Extra-board cells and strips equal the accepted primary disclosure when focused on the same target. New public misses occurring during that fixture remain visible normally.

Existing unidentified Castle/Cavalry and resurrection masking helpers are reused unchanged. Secondary boards have no targeting/click commands.

## 6. Audio

Additional board painters and scoped animation players do not create audio controllers. The original combat-feedback consumer remains the sole event SFX path and retains its event-position deduplication. Elimination playback tests observed exactly the expected public-event oscillator count (three for the surviving observer, one for the eliminated observer), without extra sounds. Existing music/audio routing suites pass. No new distance/muffling policy or mix changes.

## 7. Responsive behavior

Desktop uses the requested two-primary plus centered/two-secondary arrangement. At phone widths, secondary cards stack vertically to preserve readable cells and strips. Direction arrows follow actual DOM positions. This makes the page taller; it does not introduce a separate phone gameplay UI. Six real-service layout checks passed at 1440 px and 390 px, covering Duel/3/4. Screenshots were inspected. Final visual polish is deferred.

## 8. Automated coverage

Portable candidate command: node tools/online-overview-check.mjs.

Workspace harnesses under outputs/multiplayer-ui-phase1:
- layout-check.mjs: real service, six desktop/phone room layouts, counts, strips, routes, authoritative dial values, hidden placement.
- special-check.mjs: real four-Human special chains and observer frames.
- animation-check.mjs: those real frames played through the browser renderer; five full special animations, stable turn pointer and disposal.
- parity-check.mjs: paired accepted/current service executions for ordinary elimination, Wizard, Dragon, Demon, Archer and Goblin; exact host and RNG equality after commands.
- transition-check.mjs: actual 4→3→2→1 elimination frames, target promotion, spectator layouts, no mid-sequence rearrangement, no duplicate SFX, stale update rejected after disposal.
- privacy-dom-check.mjs: legitimate versus foreign Scout DOM.
- local-check.mjs: real phone-sized Single Player and Story flows, no Online overview, continuous accepted music.

These harnesses use the existing Stage 10 browser harness. Test databases and generated fixtures are isolated workspace-only files. Initial test-fixture assumptions were corrected where Dragon actually eliminated seats and where new public misses legitimately appeared during a Scout/elimination sequence; no inherited assertion/baseline was weakened.

## 9. Targeted results

PASS: six layout cases; five special-authority frame cases; five browser animation cases; six paired authoritative parity cases; two survivor/spectator transition sequences; Scout service and DOM regressions; two local-mode flows. No browser page errors in the tested flows. Added read-only projections did not mutate host/RNG. New renderer disposal rejects delayed updates.

## 10. Existing regression results

Full existing Phase 3 regression runner: 8/8 suites PASS:
- Hall of Fame account/mode/ranking/statistics
- public qualification
- Hall of Fame/browser/audio options
- live Duel/3/4 finalization, Rejoin, same-document rematch and duplicate-finalization guards
- desktop/phone music routing across Single Player, Story, Duel and Group
- overnight rematch/apply-setup
- music controller
- statistics reliability

Additional existing Avatar account/unlock/persistence checks PASS; existing phone local-recovery warning/actionable-error/exact-state checks PASS. Normal manifest verification is recorded separately in CURRENT-STATE/HANDOFF and the final response. A manifest file count is an integrity count, not a gameplay-test count.

## 11. First-pass limitations

Dial/arrows/card styling and easing are functional first-pass CSS, not final artwork. Phone boards stack and require scrolling. Promotion animates a public visual clone into the retained primary renderer rather than moving the input-owning DOM. No cross-board Catapult work or additional secondary SFX policy. Existing Hero/resurrection/Plague public state renderers are reused; their full historical matrices were not rerun. Physical PC/phone testing is still needed, especially long chains, lower-board newsflashes, spectator viewing and transition readability.

## 12. Physical test checklist

Run PLAYTEST-LAN.cmd from this repository's playtest folder. Use the displayed LAN URL on the phone.
1. Duel: dial points to the correct player and shows their shots; no route arrows.
2. Three players: one lower board/strip and three links; dial does not overlap its header.
3. Four players: verify lower-left attacker/lower-right target's target, all strips and four links.
4. Watch a big Wizard/Dragon/Demon/Archer/Goblin chain. Pointer stays with turn owner; secondary effects appear; no doubled SFX.
5. Eliminate a non-target: 4→3 centered transition happens after playback.
6. Kill your current target: correct next board moves into target slot with its public marks.
7. Reach 3→2: secondary board and route arrows disappear; dial stays.
8. Be eliminated: watch surviving boards; no new shot controls or hidden placement become available.
9. Scout a board on one account, then switch another player's target to it. The second account must not inherit private Scout markers.
10. Check PC and phone; leave to menu, create another room, Rejoin and Rematch. Check grids/music remain correct.
11. Single Player/Story: no multiplayer dial/extra boards.

UNACCEPTED / UNPROMOTED / NO COMMIT / NO PUSH / NO MERGE / NO DEPLOYMENT / STOP AFTER REPORT
