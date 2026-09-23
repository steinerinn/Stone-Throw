> ACCEPTED for commit/push on 2026-09-23. See ONLINE-GAME-PHASE1-ACCEPTANCE.md for final verification and non-blocking watchlist. Earlier development status below is historical. No merge or deployment authorized.

# Story causal progression + entry terminology — UNACCEPTED / UNPROMOTED

Branch: online-game-ui-phase1. No commit/push/merge/deployment.
Previous Online/local Single Player/Quick Start/classification physical PASS is preserved. This Story/wording follow-up awaits physical testing.

## Root causes and correction

Scout: the accepted direct-hit rule schedules five scouting choices for the Scout owner's NEXT turn. A deterministic real Story authority run hits the enemy Scout, records one scheduled benefit, then executes five scouting cells on the enemy turn. Authority was not missing or Story-filtered. Local snapshots omitted the own-board Scout footprints already supported by the existing renderer and Group projection. Local projection now sends only public Scout-only coordinates on the player's own board, filtered by the existing publicScoutOnlyCells helper. No enemy hidden units, IDs, private policy or RNG are exposed. Normal local Duel shares this proven missing projection; Group is unchanged. AI direct hits still schedule five; special hits on the owner's turn remain immediate, off-turn remain deferred, Plague does not activate Scout. No range/count/selection/animation redesign.

Cleric: storyPlagueTargets was populated in schedulePlague, before any infection. Both local Story routing and registered completedStory progression treated that pending marker as completed evidence. The shared projection helper now requires an existing authoritative impact event whose source is plague for the scheduled target. No parallel milestone/store: the complete authoritative event history already survives serialization. Pending-only defeat yields no Cleric credit, including after restore. Executed Plague followed by defeat retains credit. A fresh attempt has neither prior pending nor completed credit. Actual executed contact is the milestone, not waiting for all five outbreak rounds. No canonical Plague, terminal combat or RNG changes, and no retroactive private account edits.

UI additions explicitly authorized after the original Story specification: Online entry BACK TO ONLINE is now MAIN MENU and closes directly into the Main Menu in the same document. The room Leave handlers are unchanged. Visible setup/rematch controller labels use PLAYER / AI / EMPTY; request/controller values remain human/ai/empty. Human race labels in the avatar picker are intentionally unchanged.

## Exact runtime scope for this pass (relative to playtest)

- canonical/shared/client-contract/public.ts
- canonical/shared/local-host/authority.ts
- canonical/shared/local-host/plague-presentation.ts
- canonical/compiled/client-contract/public.d.ts
- canonical/compiled/local-host/authority.js
- canonical/compiled/local-host/plague-presentation.js
- canonical/compiled/local-host/plague-presentation.d.ts
- server/story-progress.mjs
- client-v13/online-entry.js
- client-v13/single-entry.js
- client-v13/group-lan.js
- tools/local-recovery-contract.json (engine digest and explicitly reviewed preceding candidate compatibility; checkpoint/host schema unchanged)

Existing uncommitted work elsewhere belongs to the prior Online/SP/classification pass and is preserved.

## Focused verification

- NEW tools/story-scout-check.mjs: 8 deterministic groups plus 1 real-browser renderer check. Real direct hit/next turn, exactly five/exactly once, only public own-board footprint coordinates, repeated read and durable restore stability; direct-AI/special/Plague canonical rule fixtures; existing renderer displays the resulting footprints.
- NEW tools/story-causal-check.mjs: 5 real canonical Story fixtures: pending-before-defeat excluded; serialized restore excluded; real Plague impact admitted; later defeat preserves Cleric progression; fresh retry clean.
- UPDATED tools/online-entry-browser-check.mjs: 14 desktop/phone checks including PLAYER label with human authority value, MAIN MENU navigation, private/public lists and joins, Group mount/Random.
- UPDATED tools/local-group-browser-check.mjs: 24 desktop/phone checks, run with ST_QUICK_START=1; PLAYER terminology, 1/2/3 AI setup, exact host/RNG resume, same-count rematch, Single Player statistics/Game Log and no Online requests.
- tools/precommit-story-browser-check.mjs: 11 existing Story/account/browser checks, including Start Over/Continue, second device, logout/login, server restart, account isolation and exclusion from career statistics. Passed; three nonfatal HTTP 404 console messages were emitted by this existing suite, no page errors.
- tools/local-group-authority-check.mjs: 10 canonical host/RNG groups.
- tools/local-group-result-check.mjs: 8 canonical completion/result/rematch checks, no duplicate stats.
- tools/result-screen-authority-check.mjs: accepted-base host/RNG/placement equality and final-Human surrender/closure PASS.
- tools/local-group-session-check.mjs: 21 integration groups including mode separation, durable restart exact host/RNG, no room/seat cookies or journal.
- TypeScript compile PASS; whitespace/diff check PASS.

102 checks/groups plus the accepted-base parity script PASS. Test Registry databases and browser evidence stay under OS temporary storage, not the candidate or real private Registry. checkpoint.journal remains disabled.

## Physical retest

1. In Story, hit an enemy Scout with a normal shot, then finish your turn. On the enemy's next turn, confirm scouting footprints appear on your board. Direct hits are deferred by the accepted rule, not immediate on your shot.
2. Reach the Necromancer chapter; lose after both Necromancers are hit but before a Plague contact. Confirm Cleric is not introduced from that pending outbreak. Retry/refresh and confirm it remains pending-only.
3. Allow actual Plague infection, then finish or lose: confirm the normal Cleric introduction remains available.
4. Open Online Create/Join: confirm PLAYER / AI / EMPTY, then MAIN MENU returns directly to the main menu. Check Single Player setup and Group rematch terminology too.

No unrelated gameplay, audio, result, Registry identity/schema, HOF or lifecycle changes. No acceptance/promotion until physical retest.
