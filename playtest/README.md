# Batch 6 normal-game playtest candidate

Unaccepted; awaiting manual playtest approval. Derived from protected presentation-parity-batch5-v1. Accepted Batch 5, Stage 14 and the golden prototype remain unchanged.

Double-click PLAYTEST.cmd with Node.js installed. The launcher verifies the candidate, starts production on 127.0.0.1:3212 (or an available fallback), and opens the browser. No build/install step. Close with Ctrl+C. Private state is outside the served tree, in sibling playtest-state-batch6/build-<manifest hash>. Each changed build uses its own recovery directory; previous build saves are retained rather than silently relabeled.

Follow-up: Single Player, Story and Multiplayer select independent persistent server slots. Menu navigation preserves their gameplay, RNG and pending choices. Story boards 1/2/3 now begin at the correct stats-ribbon height: the zero-value caption can fit without an extra wrapped line. The redundant 200ms pre-AI presentation hold is removed; the prompt final-shot marker and enemy-shot cadence remain.

Earlier Batch 6 fixes retained: drag/right-click cancellation, Story Retry/Continue controls, covered Story/normal transitions, streamed ordinary-shot markers with failure rollback, and Castle artwork decode readiness. No gameplay, artwork, AI or Castle identification changes in this follow-up. Multiplayer room rules are unchanged; this follow-up only separates mode selection.

Please check repeated Single Player / Continue Story switching, the initial Story 1/2/3 layout and quick-play responsiveness. The rare Castle-art recurrence remains deferred. See ../REPORT.md. Do not promote without explicit approval.
