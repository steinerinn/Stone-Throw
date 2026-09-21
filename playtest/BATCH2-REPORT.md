# Post-Phase-2 Batch 2 — UNACCEPTED / UNPROMOTED

Based on the user's physically passed Batch 1 (manifest e42baaac3e4eee3dba768e8118c80e881ada4f147a8bdae6980a52525795a107). Its 559-file payload is byte-verified and preserved outside Git at workspace outputs/post-phase2-batch2/batch1-physical-pass-backup. No acceptance commit, branch switch, push or deployment performed.

## Scout-only markers
Root causes: legacy scout-visuals removed markers for only direct/Archer sources, reconstructed Scout events using history indices that Group projection filters, and Group's extra footprint overlay re-added all scouted cells without checking public results. One shared board-scoped public-contact rule now supersedes the Scout-only marker for every impact source. Existing learned knowledge remains intact; no unit identity or private state is consulted. Public impacts (including misses), suspect elimination and already-public repeat resolution remove the mark. Scout-only cells persist. Group footprints collect only the currently visible target's scoped knowledge.
Runtime: canonical/shared/local-host/scout-visuals.ts, canonical/compiled/local-host/scout-visuals.js and .d.ts; server/ring-pvp.mjs.
Tests: real direct/Wizard/Demon/Dragon roots, real nested Wizard/Goblin, independent board keys, Scout-only persistence, no authority mutation; real four-seat worker Group Scout decisions followed by a direct shot remove both marker paths.

## Resurrection strength graph
The sampler already produces each round while search is unresolved. In Single Player/Duel, explicit privacy-unknown samples broke the plotted line, which looked like stopped progression. Per the user's additional authorization, the display now holds the last PUBLIC value across unknown rounds, as Group already does. No prior public value means no invented point. Raw samples stay null, are not backfilled, and private strength never enters chart scaling. Normal later known samples resume normally.
Runtime: client-v13/shell.js.
Tests: five unresolved-search rounds all sampled; mixed candidate sizes remain null; browser checks horizontal extension through unknown rounds followed by the next known value, desktop and phone.

## First AI Hero relocation
New first-hit selection: 45% adjacent to a hit/revealed unit, 45% adjacent to an available unshot bait (Demon > Dragon > Wizard > Necromancer > Goblin), 10% legal random. With no legal bait category: 50% hit/revealed, 50% random. An empty selected category falls back within the legal pool. Uses only the resolver's destinations with the existing Plague safety filter and gameplay RNG. Categories may overlap; random means uniform over the legal/safety pool. Existing later Hero relocation and Auto Match policy code remain unchanged. This intentional policy change affects future first-hit AI choices, not serialized battlefield/RNG state already earned.
Runtime: canonical/shared/policy/first-hero-relocation.ts and compiled .js/.d.ts; canonical/shared/local-host/normal-step.ts and compiled .js; server/duel-ai.mjs; server/ring-pvp.mjs.
Tests: probability boundaries, deterministic repeated selection/two draws, every bait priority, absent/illegal categories, empty legality, real normal-AI pending Hero decision and valid answer. Existing 47-case combat/RNG parity gate passes.

## UNIT CELLS HIT
Uses existing authoritative impact facts with an occupied unitId and their cell count; Human/Guest attack owners only, respecting takeover cutoffs. Excludes AI credit, empty cells, already-ignored repeats and Plague, following existing destructive-impact accounting. Separate from accuracy and Scout/Plague counters. Multiple legitimate occupied impacts count individually. Additive stat_global.unit_cells column defaults to zero on old installs; prior totals remain intact and are not guessed/backfilled. Existing databases receive a consistent SQLite backup before the column is added. No score formula, rankings or Hall of Fame design changed.
Runtime: server/statistics-metrics.mjs; server/statistics-store.mjs; client-v13/registry.js.
Tests: four-cell Wizard contacts, nested/special contacts, empty/AI/Plague exclusion, old aggregate compatibility, populated old global values, backup, repeat capture and restart idempotency. Existing statistics checks and desktop/phone inspector pass.

## Result MAIN MENU
Adds the local result action for wins/losses/draws/Give Up. Story results that already use MAIN MENU retain that action without a duplicate. Online uses the existing leave-to-Online-menu handler; even an eliminated Group player's button now clearly reads MAIN MENU. No result navigation semantics changed.
Runtime: both StoneThrow-v1.427-stage13-production.html and -development.html; client-v13/presentation.js; client-v13/story-browser.js; client-v13/lan.js.
Tests: shared result renderer actions/click-through on desktop and phone; existing Single Player/Duel/browser and exact local resume checks pass.

## Stale local warning
Successful public updates now clear the old local-recovery warning and its stale error state. Actual failures still use existing validation and error/retry handling. No save is deleted and no persistence recovery is redesigned.
Runtime: client-v13/bootstrap-production.js.
Tests: real successful local replacement clears the warning; phone menu/Online/recovery check and 8-case exact saved-host/RNG/turn/Single-vs-Story resume suite pass. Journal remains disabled.

## Rediscovery floating text
Suppresses the impact/unit-name callout when the same update publicly announces resurrection-found for that cell. FOUND! remains. It does not suppress damage, existing impact sound or Event Log records.
Runtime: client-v13/combat-feedback.js.
Tests: browser captures FOUND! alone for found + impact on the same cell, both viewport sizes.

## Supplied banner
Original Chain_Siege_Banner_Reexported.png copied byte-for-byte to assets/ui/chain-siege-banner.png. Added manifest entry and responsive main-menu image, 2508 x 627, unchanged aspect ratio. Prevented the old menu-logo clone from duplicating it. No artwork generation/transcoding or identifier rename.
Runtime/assets: both HTML shells; styles-22.css; asset-manifest.json; assets/ui/chain-siege-banner.png.
Tests: exact source checksum, browser decode and 4:1 rendered ratio; desktop 626 x 156.5, phone 320 x 80, no horizontal overflow; screenshots inspected.

## Validation and remaining physical tests
Focused rules: 23 passing checks; additive-storage migration/capture/restart checks pass. Existing statistics: 12 checks; Biggest Chain: 9; combat/RNG: 47; statistics browser: 6; local resume: 8; phone recovery menu check; Group narrative: 13; Demon reservation test. Detailed harness/results remain outside the build under outputs/post-phase2-batch2. Normal launcher recovery: 5 checks pass against the reviewed Batch 1 predecessor, exact local host/RNG/turn and old save bytes preserved through restart; checkpoint.journal absent. Final artifact verification: 566/566 files PASS. Only the requested first-hit AI policy intentionally changes gameplay decisions; other canonical combat code is unchanged.

Supporting changes: tools/batch2-rules-check.mjs; tools/batch2-store-check.mjs; tools/local-recovery-contract.json (reviewed compatible Batch 1 source, same serialized format; new first-hit policy applies prospectively); build-manifest.json; this report; root CURRENT-STATE.md/HANDOFF.md.

All eight items implemented. Physical testing remains required: Scout-only cell then direct/special hit, target elimination, Cleric search across rounds, first AI Hero relocation, global UNIT CELLS HIT, local/Story/Online result menus, stale-warning cleanup, FOUND-only rediscovery and banner on phone. Use C:/Users/Notandi/Documents/GitHub/Stone-Throw/playtest/PLAYTEST-LAN.cmd and its printed address on both devices. Close an old launcher first if using 3212. Keep Batch 2 unaccepted until user testing; no commit/push/promotion/deployment.
