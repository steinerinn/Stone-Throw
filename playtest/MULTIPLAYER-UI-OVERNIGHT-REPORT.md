# Multiplayer UI Phase 1A — overnight fixes

UNACCEPTED / UNPROMOTED. Branch `multiplayer-ui-phase1`; HEAD/base unchanged: `9fd9ec7e9691f17c5a539ecf504660169af23d31`.

## Rematch investigation

Matti's exact match cannot be reconstructed without its log. Two concrete client lifecycle defects were reproduced independently; no authoritative architecture rewrite was needed.

- Group start/request handlers hold `busy` until presentation finishes. The heartbeat also required `!busy`. A ten-second presentation wait exceeded the server's seven-second timeout: real browser controller + HTTP service produced zero heartbeats and a disconnect episode (8501 ms contact age). After repair, eight heartbeats, no episode, approximately 511 ms age. Group and Duel heartbeats now run independently of presentation/input busy state, preserving identity/generation/rejection checks.
- Polls checked generation before awaiting playback, then observed the response without rechecking. Navigation during playback could restore old-room metadata after remount. A controlled browser race restored OLD room state before the fix and retained NEW room state after it. Group and Duel now recheck navigation generation after playback.

Real HTTP commands through independent registered browser contexts passed 10 consecutive 2H+2AI rematches (11 completed matches, 17 Human actions each), two 3H+1AI rematches (3 matches, 19 actions each), and two 2H Duel rematches (3 matches, 7 actions each). Random, Ready/start, normal completion, all-Human rematch and Group Apply Setup were exercised. Every action asserted account ownership, Human controller, no absence episode and connected heartbeat. Codes/epochs are in the evidence. Repeated final reads did not duplicate statistics.

These stress cycles used independent browser session HTTP contexts, not seventeen fully animated UI playthroughs. Separate existing real browser suites verify mounted rematch, same-document continuity, audio, real Leave/REJOIN and preserved host state. The deterministic long-presentation probe exercises the liveness failure explicitly. No disconnect UI, timeout, grace, takeover, credential or server rule was weakened.

## Catapult

Group projection invoked the stateful cue allocator twice for the first Catapult impact, then discarded the second online cue. Impact zero allocates a new group, so following rolls inherited that unused group. Real five-contact before sequence: `[1,2,2,2,2]`; repaired: `[1,1,1,1,1]`.

The excluded online Catapult path now skips allocation. Existing authoritative root/work grouping and primary playback handle the whole stone. Browser result: exactly one CATAPULT! introduction and one five-cell roll summary. All five roll frames remain. Exact accepted-reference host/events/RNG comparison passes; no trajectory, damage or rule change.

## Scout

Own-board footprints previously queried self→self, missing incoming inspections. Only the own-board footprint now unions incoming inspection coordinates. Opponent results remain observer→target scoped. No private unit/results are copied.

Real four-Human test: five Scout choices, actor results preserved, target owner sees those own-board cells, unrelated observers receive no footprint, and real elimination/target switch does not transfer private knowledge. Host/RNG untouched. This implements the explicitly authorized target-owner activity exception.

## Archer

`online-overview.play()` painted the first resolved snapshot before starting projectile playback. Removing that eager paint preserves displayed boards until the existing authored impact callback. No arbitrary delay or authoritative timing change.

The old path fails the browser pre-arrival assertion. The repaired path retains the pre-impact cell in all 77 samples during the first arrow flight, then paints the result. This shared entry correction also prevents first-frame prepaint for other routed online effects. Wizard/Dragon/Demon/Archer/Goblin animation checks remain green.

## Exact changes in this overnight pass

Runtime:
- `client-v13/group-lan.js`: heartbeat busy independence and post-playback generation guard.
- `client-v13/lan.js`: equivalent Duel liveness/stale-poll guards.
- `client-v13/online-overview.js`: remove premature impact paint.
- `server/group-presentation.mjs`: allocate Catapult cue only once.
- `server/ring-pvp.mjs`: own-board incoming Scout activity footprints.

Tests/metadata:
- `tools/online-catapult-check.mjs` (new real-service grouping regression).
- `tools/online-overview-check.mjs` (owner and unrelated-observer assertions).
- `tools/local-recovery-contract.json` (previous candidate manifest compatibility; same engine digest).
- This report, `MULTIPLAYER-UI-OVERNIGHT-EVIDENCE.json`, `build-manifest.json`.
- Repository-root `CURRENT-STATE.md`, `HANDOFF.md`.

Earlier uncommitted Phase 1A/Fix Pass changes remain intact. Private test databases, browser artifacts and scratch probes remain outside the repository in workspace `outputs/multiplayer-ui-phase1/overnight/`.

## Verification

- Existing full regression runner: 8/8 suites PASS (HOF, public qualification, Registry browser, live statistics/REJOIN/rematch, music routing, same-document rematch, music unit, statistics reliability).
- Rematch stress: 17 completed matches / 14 rematch transitions PASS.
- Heartbeat and stale-poll before/after browser probes PASS.
- Catapult grouping, newsflash/log and exact accepted host/RNG parity PASS.
- Scout actor/owner/third-party/switch privacy PASS.
- Archer before-arrival/impact browser check PASS.
- Desktop/phone 2/3/4 layouts; 4→3→2→1 transitions; stable turn; no duplicate sounds; stale teardown; final unique original participants/reveal; exact-board Plague; clean eliminated-observer view PASS.
- Six ordinary/special accepted-host/RNG parity cases plus Catapult and Plague parity PASS.
- Five special-animation browser checks PASS.
- Final manifest count/hash recorded in CURRENT-STATE/HANDOFF after finalization.

Optional medallion/route polish deliberately deferred. No broader architecture decision is required. Physical confirmation of Matti's original symptom remains necessary; the deterministic failures above are verified repairs.

## Physical checklist

1. Run candidate PLAYTEST-LAN.cmd; use two independently logged-in devices. Enable existing Game Log if collecting recurrence evidence.
2. Group 4P, 2 Humans + 2 AI: finish, both REMATCH, Apply Setup, Random/Ready, several turns including long opening/chain. Repeat twice. Both Humans remain seated without false disconnect/takeover.
3. Briefly disconnect/rejoin one device; genuine grace/REJOIN still works.
4. Watch one multi-roll Catapult: one introduction and one summary.
5. Scout the other Human: actor sees normal results, owner sees own inspected cells, third party sees neither private results nor footprint. Check no inherited knowledge after target switch.
6. Watch Archer attack a lower board: target appearance changes only after arrival.
7. Become eliminated, then finish match: clean survivor view; final original participants each appear once with final reveal.
8. If ejection recurs, save both Humans' logs and approximate time. Runtime private logging is not newly enabled by this patch.

UNACCEPTED / UNPROMOTED / NO COMMIT / NO PUSH / NO MERGE / NO DEPLOYMENT / STOP AFTER REPORT
