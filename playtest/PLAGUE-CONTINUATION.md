# Authorized Plague continuation correction — 2026-09-19

The user clarified that unit contact never terminates Plague. It lasts five scheduled steps (the existing seed step plus four expansions), unless its reachable frontier is exhausted. Hero still dies instantly. Elimination of the infected board's owner removes that board's outbreak; elimination of the Necromancer/source player does not.

Removed the resolver's Hero-contact block that deleted the outbreak and discarded pending Plague frame work. Removed source-elimination deletion at the Group elimination boundary. An outbreak whose turn owner is eliminated retains its origin, infected set, frontier, step count, source attribution and RNG state; its remaining steps run at the infected player's turn ends. Target elimination still clears it. Finished matches do not gain additional turns.

No change to branch probabilities, weighted cell choice, eight-neighbor geometry, shot/reserved filtering, five-step count, instant Hero death, retaliation rules or other combat. Continuing previously cancelled work necessarily consumes its normal RNG draws; this is an intentional behavioral correction, not a claim of identical final RNG to the old early-stop behavior. Serialized/resumed corrected execution matches uninterrupted corrected execution exactly.

Historical oracle tests, the original lifecycle audit, the CD3DE5 capture and its Hero-contact termination evidence remain unchanged. They document the old behavior and must not be presented as the new contract. `tools/plague-continuation-check.mjs` records the new expectations separately. Runtime diagnostics no longer treat Hero contact as a legitimate stop reason.

Focused checks: all 15 unit types continue through five steps; Hero tested in both directions in 1v1 and four-seat play, plus three-seat play; blocked frontier legitimately stops; a new Necromancer outbreak does not erase the tested original; source elimination preserves remaining steps through real host turns and host recovery; infected-board elimination clears the outbreak. Real Group worker capture checks include Plague killing Hero without cancelling its outbreak. The corrected roster bar still renders instant Hero death.

Files changed for this correction:
- canonical/shared/combat/resolver.ts and canonical/compiled/combat/resolver.js
- canonical/shared/host/ring.ts and canonical/compiled/host/ring.js
- server/plague-capture.mjs
- tools/plague-capture-check.mjs
- tools/plague-continuation-check.mjs
- PLAGUE-CONTINUATION.md
- build-manifest.json

Physical follow-up: restart PLAYTEST-LAN.cmd, create a fresh Group match, observe a Plague hit on Hero (Hero dies; spread continues), then keep the infected board alive for the remaining steps. If the source player is eliminated, verify continued spread at the infected player's turn ends without resetting the count. Keep the private capture on any failure. Journal logging remains disabled. Candidate remains unaccepted; no promotion/push/deployment.
