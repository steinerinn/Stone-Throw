# Multiplayer UI Phase 1A — ACCEPTED

Physical acceptance was explicitly received on 2026-09-22. Accepted branch/checkpoint: `multiplayer-ui-phase1` / `multiplayer-ui-phase1a`. This acceptance commit is the new protected project checkpoint. Its parent is `9fd9ec7e9691f17c5a539ecf504660169af23d31` (Avatar/Profile); that parent is historical, not the current accepted checkpoint.

Accepted scope: accumulated Phase 1A battlefield/layout/transitions/final overview and physical fixes; rematch/liveness and stale-callback repair; Catapult single-presentation grouping; Scout target-owner footprint visibility with observer privacy; Archer/shared premature-paint correction; Story active-run/lifetime Story Path and Unit Lore separation; Start Over resets only the active run; independent authoritative same-target Plague identity/lifecycle; pending narration survives Main Menu until deployment; locked Multiplayer input is discarded, never queued.

Physical Story Path / Unit Lore / Goblin visibility, Start Over preserving lifetime unlocks, and Main Menu during narration → Continue returning to narration all PASS.

Non-blocking WATCHLIST (accepted, not unresolved acceptance failures):
- Multiplayer locked-click/delayed-shot behavior: strong automated/browser coverage; continue natural physical observation.
- Dual same-target Plague: authoritative replacement defect fixed and independently verified; continue natural physical observation of rare pacing/presentation cases.

Deferred separate work: cumulative performance / Game Log / polling / persistence / fsync investigation after UI completion. Do not begin it in this acceptance task.

Final verification: 18/18 verification jobs PASS, including TypeScript compilation, the requested focused/browser/service/UI checks and the full existing runner (8/8 suites PASS). Named Story/storage/input/dual-Plague/continuation checks: 63/63. No new regression; no assertions weakened. Runtime/assets remain byte-identical to the physically accepted 941-file manifest `6be6d6d6b62453660ac80d9cfb5c07afe40858a91023945c8ca83ba6bb5ec7cf`; only acceptance/evidence/build/recovery-handoff metadata changed during acceptance. The immediate predecessor is added to the existing compatible local-recovery allowlist; no save is deleted or relabelled and checkpoint.journal remains disabled.

Only intended repository runtime, assets, regression tests, public synthetic fixture and useful project reports/manifests/handoffs are included. Private Registry databases, browser profiles, captures, scratch probes, workspace outputs and machine-local test artifacts are excluded. Earlier reports/status entries below are historical and superseded by this acceptance.

Acceptance commit/push is authorized. No merge or deployment. Next branch: `result-screen-ui-phase1`, created directly from the pushed acceptance commit, with no Result Screen implementation yet.

---

# Historical acceptance records

# Accepted post-Phase2 checkpoint

Physically accepted by the user on 2026-09-21. Branch: post-phase2-batch1. Base: registry-phase2-v1, 0d2c6b35f9b39692e65f1a2c8be61b927a686055.

Accepted scope: post-Phase2 multiplayer lifecycle/remount, rematch, account statistics, startup/registered Online identity, branding and music work in this payload. REMATCH/APPLY SETUP and statistics attribution passed physical testing. A 171-cell AI chain did not enter the Human career. False defeat after Victory and missing new Group grids have not resurfaced. Startup splash, same-document Online navigation and continuous music remain working.

## Non-blocking watchlist
- Scout observer/target privacy: strong automated evidence; watch in natural physical play. No further change at acceptance.
- Plague ambience lifetime: strong automated evidence; watch in natural physical play. No further change at acceptance.

These are WATCHLIST items, not failures and not unaccepted work. Polish/tweaks are deferred. Earlier reports/evidence retain their original pre-acceptance status as historical context; this record supersedes that status for the current payload.

No gameplay, UI or audio implementation changed during acceptance. Runtime/assets are byte-identical to the physically tested 592-file manifest 0bcea80118069a1e5f1c23f295c415f20ced5313df758df2407e1b20ef63d351. Only acceptance/build/recovery metadata and root handoffs are updated.

Private Registry databases, runtime state, test accounts, temporary test databases and workspace harness outputs are excluded from promotion. Useful source, regression tools and summarized project evidence are retained. Full included-file inventory and accepted manifest digest are in promotion/POST-PHASE2-ACCEPTANCE.json outside this manifest.

Verification: normal manifest verifier; focused real-service/browser Group rematch; focused account/finalization checks; seven music-controller checks. Prior ten-suite overnight evidence and physical acceptance are retained; no broad re-audit.

No merge to main, deployment, new development branch or Registry/Hall-of-Fame implementation is part of this checkpoint.
