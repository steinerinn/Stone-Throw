# Batch 5 normal-game playtest candidate

**Unaccepted: awaiting explicit user playtest approval.** Branch presentation-parity/batch-5, derived from Batch 4 commit 4615030. Accepted Stage 14 and all earlier candidates remain unchanged.

Double-click PLAYTEST.cmd. Node.js 24 must already be installed; no build/install step is needed. The launcher verifies this candidate, starts production on 127.0.0.1 (port 3212 or an available fallback), opens the browser, and keeps its console open. Ctrl+C stops the server. Private saves use the sibling playtest-state-batch5 directory, outside the served tree.

This batch fixes interrupted Goblin presentation grouping, Hero first/second-hit feedback, placement previews/interactions, and cold Quick Start Castle artwork. A presentation-only 200 ms hold gives the final ordinary player result a visible interval before enemy playback. Gameplay, RNG, AI, privacy, CSS, assets, and working animation implementations are unchanged.

Please playtest Goblin in both directions, Hero hit 1/2/final death, drag/move/rotation and Castle build hints, final-shot marker order, cold Quick Start, source icons, enemy-shot cadence, and Event Log readability. The exact manually observed final-shot timing problem was not independently reproduced beyond the prior class-only check; the stronger computed-style/timing check passes with the new hold.

Development tools and online refinements are explicitly deferred. Inherited development files remain available but were not changed or newly verified in this batch. Do not use this candidate as a newly accepted checkpoint until manual approval.

See ../REPORT.md and ../evidence for focused results and the exact changed-file list.

Final placement follow-up: Batch 5 otherwise passed user playtesting. Partial Castle right-click now removes only the clicked cell when connectivity permits and keeps Castle mode selected, including after removing the last cell. Focused sizes 1–5 pass. Still unaccepted pending the final manual placement check.

Launcher recovery follow-up: each build now uses playtest-state-batch5/build-<manifest SHA-256> outside the served tree. Reopening the same build recovers its own checkpoint; older checkpoints and locks remain untouched. A genuinely active same-build state lock still protects its running server. PLAYTEST.cmd is unchanged.
