# ACCEPTED — Result Screen and physical bug-fix checkpoint

Physical acceptance confirmed by the user on 2026-09-22. This acceptance supersedes earlier candidate/visual-review status statements below. Historical investigation limitations remain documented. No speculative watchlist fixes were made.

# Post-Result-Screen physical bug pass

Status: UNACCEPTED / UNPROMOTED. Branch result-screen-ui-phase1; HEAD remains c008851de246968eda21ae37e50484e3e2ffb7f7. No commit/push/merge/deployment.

## Findings and corrections

- Result freeze: exact physical cause is unconfirmed because the supplied log begins after escape/new-room placement. Deterministically reproduced an animation-error replay mechanism: the presentation flow retained its current group index after rejection, so later reads retried the same group indefinitely. Delayed Goblin/Wizard async callbacks could also throw without settling their enclosing promise. Delayed work now propagates failures, a failed visual group logs ANIMATION GROUP FAILED and applies its already-resolved public frames, then advances to results. No authoritative timing, damage or RNG depends on this handling. This is not a claim that the absent final-match log proves that mechanism occurred physically.
- Stale work: unmount resolves the playback cancellation signal and clears pending presentation; disposed work cannot paint or write a late ANIMATION GROUP END / NEWSFLASH END into the next room. This addresses the stale END clue, but its contribution to the physical freeze is not proven.
- Initial target/cursor: paint ran while request/mount/Ready locks were still set, without resynchronizing when those locks cleared. Cached input-state refresh now updates after callbacks/request release and on a lightweight timer for external locks. Legal Human shots show the shot cursor; already-processed cells, AI turns and locked playback use default cursor. Pending Catapult/resurrection input retains its appropriate cursor. No legal-input authority changes.
- Goblin duplication: the routed overview destroyed its playback controller between groups. One split activation therefore launched all ten bombs twice. A persistent controller per owner/target route retains activation deduplication for the battle/revision/group, with each contact consumed once. Baseline reproduction: 20 launches; candidate: 10 for each tested observer. Canonical authority produced exactly ten contacts throughout.

## Archer -> Catapult: investigated, physical failure NOT reproduced

The reported Human direct shot -> enemy Archer -> Human Catapult requires same-root Catapult target selection. It is not supposed to silently become ordinary shooting. catapultBenefit in canonical/compiled/combat/units/benefits.js increments catapultNow when the impacted owner equals ruleTurn. Resolver same-turn-effects drains this into catapult-series, which requires a Human catapult-target decision. The host rejects ordinary shots and turn advancement while awaiting that decision. After answering, five deterministic stone contacts retain the original root.

A distinct accepted legacy exception is documented in canonical/rules-quirks-ledger.json (archer-catapult): an off-turn Archer hit increments nextShots instead of scheduling Catapult. That does NOT explain the specified same-turn reproduction without evidence of a different causal turn. No gameplay change was made to either rule.

Local real-browser reproduction receives the target choice, accepts a target click, plays exactly one stone, and ignores repeated final update playback. Three/four-seat Group service tests exercise creator and last-seat actors, both worker and inline resolution: the choice survives repeated reads/heartbeat and serialized recovery; ordinary-shot attempts reject; turn and RNG remain unchanged while waiting. Answering executes the same-root five contacts. No clearing, overwriting, conversion, normalization loss or later-turn loss was reproduced. The user's clarification (two subsequent rounds of ordinary shooting) remains an unresolved physical observation, not a presentation-only diagnosis or a claimed fix.

## Focused verification

- result-physical-bugs-check.mjs: 9 checks PASS (real four-Human authority fixtures, both Goblin observers, split delivery, local-mode input states, injected Catapult/Goblin animation failures reaching results, disposal).
- archer-catapult-check.mjs: deterministic final state/RNG repeat equality, real browser shoot/answer, one stone, no replay duplicate PASS.
- archer-catapult-group-check.mjs: 8 cases PASS (3/4 seats x creator/last actor x inline/worker), pending retention, invalid ordinary shot rejection, recovery and same-root contacts.
- result-screen-live-check.mjs: real 1H+3AI Random/Ready -> target before first shot -> win/result -> Rematch setup/start PASS; Quick Start -> target before shot -> win/result -> Main Menu/new room PASS. Original finalized statistics unchanged; same document/music continuity.
- precommit-input-browser-check.mjs: 6 checks PASS; locked spam, playback spam, pointer races and ordinary clicks.
- result-screen-browser-check.mjs: 9 logic groups + 21 desktop/phone browser checks PASS.
- online-final-overview-check.mjs: 2/3/4-seat final reveal/unique board layout and exact-board Plague attribution PASS.
- online-overview-check.mjs: real Scout/elimination target switch, observer privacy and unchanged host/RNG PASS.
- result-screen-authority-check.mjs: accepted-base host/RNG/placement parity, last-Human surrender accounting/closure PASS.
- All canonical files, Result Screen art assets and styles-result-screen.css remain byte-identical to the preceding 959-file candidate manifest.

## Exact files changed in this pass

Runtime: client-v13/presentation.js; client-v13/online-overview.js; client-v13/combat-playback.js; client-v13/legacy-animations.js; styles-online-overview.css.
Tests: tools/result-physical-bugs-check.mjs (new); tools/archer-catapult-check.mjs (new); tools/archer-catapult-group-check.mjs (new); tools/result-screen-live-check.mjs (expanded).
Metadata: POST-RESULT-PHYSICAL-BUGS.md (this report); tools/local-recovery-contract.json (preceding manifest admitted with unchanged engine digest); build-manifest.json; repository-root CURRENT-STATE.md and HANDOFF.md. Existing earlier uncommitted result work is preserved.

## Physical retest

1. Launch normal PLAYTEST-LAN.cmd. Enable Game Log before play. Create 1 Human + 3 AI with Random/Ready, then repeat with Quick Start. Confirm target indication before the first click.
2. Check Single Player and Story: legal target and shot cursor on your turn; default cursor on AI turn/locked playback and already-processed cells.
3. Trigger Goblins from both directions. Expect one bomb volley for one activation. Finish a Group match through a special chain; result should appear once. Leave to Main Menu during an effect and create another room; no old animation should continue there.
4. For Archer -> Catapult, save the Game Log immediately if the choice fails, BEFORE leaving the match. Record the acting player, impacted Catapult owner, whether the Catapult was already damaged, and whether Plague/nested activity preceded the Archer. The existing opted-in bounded private capture can correlate authoritative root, benefit-scheduled reason and pending decision. Do not clear saves or enable checkpoint.journal. The missing-choice observation remains open pending a capture that distinguishes same-turn Catapult from the explicit off-turn legacy exception.

## Subsequent minimal outline cleanup

Removed only the #enemyGrid.st-shot-target outline CSS rule at user request. The target-state class, existing board/turn indication, legal-shot cursor and all input/lock code remain unchanged. No replacement border or glow. Exact byte-diff check confirms the stylesheet changed by that one rule only. Manifest refreshed; preceding candidate retained for local recovery compatibility.
