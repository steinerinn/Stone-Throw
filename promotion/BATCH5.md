# Accepted Batch 5 GitHub promotion

Checkpoint: presentation-parity-batch5-v1. Accepted after the user's final manual playtest, including partial Castle right-click removal and the launcher follow-up. Protected next-work starting point: playtest/. Do not alter this accepted tree in place for future work.

The 439 manifest-listed files and build-manifest.json are copied byte-for-byte from the accepted artifact. Manifest SHA-256: 2305d704be4a6c6dead31fe758bb54d3bad3618a4c1198ece7e8973cd3c58ee5. Acceptance metadata is in batch5-acceptance.json; its local paths/source commit identify provenance, not paths or commits within this GitHub repository.

The frozen build manifest and README retain historical pre-acceptance wording. External acceptance metadata records current accepted status. Those bytes were deliberately preserved, including the manifest identity used for recovery state. No gameplay or presentation changes were made for promotion.

On Windows with Node.js 24 installed, double-click playtest/PLAYTEST.cmd. It verifies the build, opens production locally on 127.0.0.1 with port fallback, and stores private state in the ignored sibling playtest-state-batch5/build-<manifest hash>. No private checkpoints, locks, browser profiles or test sessions are included.

The root index.html, prototype-reference golden file and audit files are unchanged. Accepted Stage 14 controlled-playtest-v1 remains unchanged in the original workspace. This promotion does not merge to main, deploy, or authorize Batch 6.
