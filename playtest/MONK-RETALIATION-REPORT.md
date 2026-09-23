> ACCEPTED for commit/push on 2026-09-23. See ONLINE-GAME-PHASE1-ACCEPTANCE.md for final verification and non-blocking watchlist. Earlier development status below is historical. No merge or deployment authorized.

# Monk direct-shot retaliation target — UNACCEPTED / UNPROMOTED

Branch: online-game-ui-phase1. No commit/push/merge/deployment.

## Finding and fix

monkProximity constructed retaliation metadata through reactionMeta, which chooses the Monk owner's cached reactionTarget and discards the incoming source participant. Direct-human and direct-ai reactions now override only targetPlayerId/targetBoardId using the authoritative incoming meta.actorId seat. The Monk remains the reaction owner/actor. No new state or fallback name is involved.

Reproduction limit: fresh synchronized ring commands already target the original shooter because syncRing stores the predecessor as reactionTarget. The reported physical room/state is unavailable, so the origin of its apparent divergence is not established. A deterministic divergent-default fixture reproduces the old wrong destination and passes with the fix. This removes the cached-target dependency for direct shots; it is not evidence that a fresh room normally has the wrong cached target.

The accepted trigger is proximity: an ordinary shot near an active Monk triggers one retaliation. An exact hit on the Monk's own cell defeats it and produces no retaliation. That rule is unchanged. Monk-deflect-triggered proximity continues using the existing cached/default reaction target; no attempt was made to change the ring's existing predecessor/clockwise conventions. Archer/Goblin proximity likewise remains unchanged.

## Exact files in this pass

Runtime:
- canonical/shared/combat/units/monk.ts
- canonical/compiled/combat/units/monk.js

Verification/metadata:
- tools/monk-retaliation-check.mjs (new)
- tools/local-recovery-contract.json (updated canonical digest; reviewed previous candidate checkpoint schema remains compatible)
- build-manifest.json
- MONK-RETALIATION-REPORT.md
- ../CURRENT-STATE.md
- ../HANDOFF.md

All earlier uncommitted candidate files remain preserved. No Scout, Plague, Cleric, setup, Result, Registry/statistics, presentation or audio runtime file was edited in this pass. Target selection follows the requested direct-retaliation correction; existing random selection code, count, geometry, legality, disclosure and animations are unchanged. Existing saves/events are not rewritten.

## Verification

- TypeScript compile: PASS.
- New monk-retaliation-check.mjs: 14 deterministic groups PASS. Real accepted direct commands in Duel/3P/4P; direct-human/direct-ai with divergent cached destination in 3P/4P; exactly one retaliation and actual impact on attacker board; no impact on default board; exact RNG-state parity for equal legal pools; real Monk-source nearby contact preserving old target; Archer/Goblin unchanged; exact-cell Monk defeat preserved.
- Comparison loads the prior committed Monk implementation through the existing resolver. Fresh valid direct, Monk-deflect and other special cases retain complete state/event/RNG equality. Changed-destination fixtures preserve RNG draws with equivalent legal cell pools. Different actual board contents can naturally cause different downstream outcomes; this is the intended destination correction, not blanket old-outcome parity.
- local-group-authority-check.mjs: 10 PASS, local/Online canonical host/RNG parity and restore/rematch.
- result-screen-authority-check.mjs: accepted-base host/RNG/placement and final-Human surrender/closure PASS.
- story-scout-check.mjs: 8 PASS.
- story-causal-check.mjs: 5 PASS.
- 37 focused groups plus accepted-base parity script PASS; diff whitespace check PASS.

## Physical retest

In a 3- and 4-participant game, fire an ordinary shot adjacent to an active opponent Monk. Confirm the single retaliation lands on the shooter's board, not the Monk owner's ordinary target board. Then observe a Monk-deflect-near-Monk chain to confirm its established default-target exception. Duel should look unchanged. Exact-cell hits should still defeat the Monk. If the physical wrong-board issue persists, retain the multi-match Game Log so authoritative target versus visual target can be distinguished.

Candidate remains UNACCEPTED / UNPROMOTED pending physical retest. checkpoint.journal remains disabled.
