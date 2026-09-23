> ACCEPTED for commit/push on 2026-09-23. See ONLINE-GAME-PHASE1-ACCEPTANCE.md for final verification and non-blocking watchlist. Earlier development status below is historical. No merge or deployment authorized.

# Single Player local Group integration — UNACCEPTED / UNPROMOTED

2026-09-23. Branch: online-game-ui-phase1. Accepted parent remains 6d37741720b94518da2d7a66d154fc7b8a77ec3a. Implements the approved SINGLE-PLAYER-GROUP-ARCHITECTURE.md audit.

## Implementation

The four-card setup fixes Seat 1 to the current Human identity and Seat 2 to AI. Seats 3/4 offer only AI/Empty and default Empty. Participant count is derived. NPC choices use unique Cruns/Snurk/Rackler identities and reserved artwork; selection uses browser cryptographic randomness outside combat RNG. Registered name/avatar/flag and Guest identity use the existing Registry identity provider.

One AI retains the existing two-player local authority. Two/three AI use a localSession facade inside ring-pvp.mjs so it can call the existing private Group placement, AI policy, command, projection and serialization functions directly. No copied combat engine and no new damage/trigger/RNG rules. Local battles are never inserted into the Online rooms/tokens maps and never receive heartbeat, disconnect, lobby discovery, join codes or seat credentials. The existing drain/start guards explicitly recognize local ownership; their Online conditions are preserved.

The facade implements the existing local read/dispatch/configure/checkpoint/statistics interfaces. A versioned local-group-session-v1 checkpoint lives in the Single Player slot, with the full authoritative host, RNG, AI memory and pending choices. Story keeps its separate legacy slot. Main Menu pauses the local presentation and subsequent Single Player resumes the same saved host. Server restart reconstructs the same host and refreshes public handles. Give Up closes the local session and finalizes the Human quit/loss; no Online takeover or replacement identity is created. Normal completion uses the existing Group Result Screen and local action adapters. Rematch goes straight to deployment with the same NPC count/identities and fresh presentation timing.

Multi-board cards, unit strips, routes, elimination views and result/award rendering are reused unchanged. Local Start and Result actions are bound by local-group.js rather than installing Online lifecycle controls. Statistics capture always supplies mode Single Player, including 3/4-participant battles; AI has no registered career identity. Game Log receives Single Player metadata without changing history/export/storage architecture.

## Exact runtime files changed in this integration

- client-v13/single-entry.js (new): local setup, identities, derived count and resume/new routing.
- client-v13/local-group.js (new): local multi-board presentation integration and direct rematch/menu actions.
- client-v13/bootstrap-production.js: installs local controllers and clears them when switching modes.
- client-v13/story-browser.js: mounts a newly opened local session; fresh rematch clears old playback timing, resume retains playback; local result button wording.
- client-v13/game-log.js: local Group match metadata classified as Single Player.
- styles-online-entry.css: scoped shared-card local setup styling and existing multi-board positioning.
- server/main.mjs: local setup/identity/rematch endpoints, session selection, tagged checkpoint restore, static allowlist and Single Player participant capture.
- server/ring-pvp.mjs: local facade around shared Group operations and explicit local start/drain lifecycle guards.

No canonical combat/RNG, Result Screen, board renderer, audio, Castle/Plague/Monk/Scout/Archer/Catapult/Goblin, Registry/Profile or HOF runtime implementation was edited by this integration. Earlier unaccepted Online entry files remain part of the candidate; their scope is documented separately in ONLINE-GAME-UI-CLEAN-REBUILD.md.

## Focused verification

New test files and results:
- tools/local-group-authority-check.mjs: 10 PASS groups. For both 3/4 participants, byte-identical serialized canonical host (including RNG/history) against the accepted Online Group path through initial state, Random, Start and ordinary shots; private restore; same-count/identity rematch; no local Online room registration.
- tools/local-group-session-check.mjs: 21 PASS groups. Real server with LAN disabled, all 2/3/4 participant modes, independent Story slot, exact host/RNG/pending-state resume and durable server restart, Give Up/finalization, finalized Single Player database records, AI exclusion, same-count rematch, no Online cookies/rooms and no checkpoint.journal.
- tools/local-group-browser-check.mjs: 24 PASS checks. Real desktop and 390px browser/service paths, setup restrictions/defaults/avatar/name/flag, one/two/three AI, placement/start, extra boards, actual Settings -> Main Menu -> Single Player resume, refresh resume, Game Log metadata, Give Up -> direct rematch, no pvp requests or browser errors. A real pending Catapult choice is preserved during resume.
- tools/local-group-result-check.mjs: 8 PASS checks. Isolated reduced roster, real canonical combat and browser shots to normal completion (no forced winner), actual Result Screen/identity/View Battlefield/reopen, direct same-count rematch and no duplicate finalization.
- tools/local-group-modes-check.mjs: 3 PASS checks. Same browser local Group and Online Private room; switch in both directions; leaving Online preserves exact local checkpoint.

Integration subtotal: 66 passing checks/groups across the five focused suites (not a count of individual assertions).
Preservation suites: online-entry-check.mjs 8 PASS groups; online-entry-browser-check.mjs 14 PASS; private-entry-browser-check.mjs 14 PASS; result-screen-authority-check.mjs PASS accepted-base host/RNG/placement parity and last-Human surrender/stat closure behavior. No broad audit.

## Screenshots and physical testing

Screenshots are outside Git at workspace outputs/online-game-ui-phase1/single-local:
- single-setup-1440.png
- single-setup-390.png
- single-battle-3.png
- single-battle-4.png

Physical test: choose one, two and three AI in fresh Single Player; Random/Start; play ordinary and special chains; leave through Settings/Main Menu and resume; refresh/restart and resume; finish and Rematch, confirming same count and identities with no setup. Check existing Online Create/Join and Story remain separate, and inspect finalized Single Player statistics/Game Log.

Remaining physical-only checks: long-match responsiveness, natural chains/elimination presentation, phone touch usability and audio continuity. The local Group facade resolves each authoritative command/AI drain before returning its presentation batch; it does not install the Online worker/heartbeat lifecycle or promise Online-style incremental preview streaming. No performance architecture rewrite was included.

All test accounts/databases live in isolated OS temporary folders, never the private Registry or repository. Screenshots are external evidence. No commit, push, merge or deployment. Await physical testing.
