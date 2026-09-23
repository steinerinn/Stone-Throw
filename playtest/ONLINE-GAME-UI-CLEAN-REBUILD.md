> ACCEPTED for commit/push on 2026-09-23. See ONLINE-GAME-PHASE1-ACCEPTANCE.md for final verification and non-blocking watchlist. Earlier development status below is historical. No merge or deployment authorized.

> Follow-up: the approved local Single Player integration is now implemented, UNACCEPTED / UNPROMOTED. See SINGLE-PLAYER-LOCAL-GROUP.md for current scope and verification. The audit/entry-only statements below describe the earlier stage.

# Online Game UI clean rebuild

Status: UNACCEPTED / UNPROMOTED — awaiting physical testing.
Branch: online-game-ui-phase1.
Accepted parent: 6d37741720b94518da2d7a66d154fc7b8a77ec3a.

## Replacement scope
The superseded, unaccepted combined lobby and waiting-host/rematch redesign were removed. Their files were backed up outside the repository. The accepted Result checkpoint supplied the baseline; no earlier checkpoint was used.

## Entry behavior
- Separate CREATE GAME / JOIN GAME tabs.
- Four creation cards: creator Human, fixed second Human, independently selectable Human/AI/Empty third and fourth cards (both default Empty).
- Active cards determine Duel/3-player/4-player. Empty cards are omitted from the server's contiguous active seat array. No creation Ready or player-count selector.
- AI identities are randomly assigned, without duplication, by the unchanged accepted server controller when the room is created. The draft labels these seats Random unique NPC rather than promising a client-selected identity.
- Public/Private direct controls. Private rooms remain listed; their listing contains an opaque room identifier and no join code. Selecting a private JOIN opens the existing code field, bound to that room; a code for another room is rejected.
- Create shows open Public and Private rooms. Join shows Public/Private/Full waiting rooms. Full rows have disabled FULL buttons.
- Server-created timestamps and persisted creation order sort open Public first, open Private second, Full last, oldest first within each. Legacy rooms without entry metadata retain default Public visibility.
- Two-second refresh while the entry UI is open. Host freshness and placement/closed eligibility remain enforced.
- BACK TO ONLINE opens an explicit Online landing panel. MAIN MENU is an explicit separate action; neither exposes an underlying local battle.
- Existing deployment, Ready, Quick Start, rejoin, rematch and same-document mounting remain in the accepted controllers.

## Exact runtime files
- client-v13/lan.js — delegate only the entry form/list to the new module.
- client-v13/online-entry.js — tabs, cards, lists, private code prompt, navigation.
- styles-online-entry.css — entry-scoped responsive CSS.
- server/online-entry.mjs — validate new slot contract, stamp/list room metadata, bind private list selection to code.
- server/multiplayer.mjs — connect entry metadata to existing service delegation; accepted rematch path unchanged.
- server/main.mjs — static allowlist for new entry JS/CSS only.

## Focused verification
- tools/online-entry-check.mjs: 8 PASS groups: defaults/seat restrictions, 2/3/4 derivation, unique accepted NPCs, Public/Private/Full sorting, selected-private wrong/correct code, duplicate-account rejection, room-metadata export/restore, read-only host listing, stale-room exclusion.
- tools/online-entry-browser-check.mjs: 14 PASS checks at 1440x1000 and 390x1000: registered/Guest identity, tabs/cards/defaults, no dropdown/Ready, independent controls, Create public list, Join full/private list, private prompt, wrong/correct code, explicit navigation, actual 4-seat Group mount/Random placement, automatic list refresh and Public JOIN.
- tools/result-screen-check.mjs: 9 PASS groups.
- tools/result-screen-authority-check.mjs: PASS accepted combat/host/RNG parity and final-Human closure contract.
- tools/verify.mjs: final manifest verification recorded in CURRENT-STATE.md and HANDOFF.md.

## Preservation and limitations
Accepted combat, RNG, Duel/Group authority engines, rematch controllers, Result Screen, Game Log/history, battlefield cleanup, Registry/Avatar/HOF, narration and music sources/assets are byte-identical to the accepted parent. Recovery contract only adds the accepted parent manifest to its compatibility list; no recovery semantics changed. No private runtime data was added.

Phone Create uses vertical scrolling; there is no horizontal overflow. Screenshots are stored outside Git under outputs/online-game-ui-phase1/clean-rebuild. Tests use isolated temporary Registry directories and browser contexts. Physical multi-device LAN testing remains outstanding. No new full-match rematch or audio listening run was needed for this entry-only change; their accepted runtime files are unchanged. No commit, push, merge or deployment performed.

## Physical follow-up: Private discovery and code entry

2026-09-23 — still UNACCEPTED / UNPROMOTED.

Confirmed roots:
1. The Create-tab client filter explicitly excluded Private rooms under the prior contract. It now includes all non-full waiting rooms, retaining authoritative order. Heading is OPEN GAMES.
2. The HTML code field limited raw input to six characters before normalization. Real browser typing of two leading spaces plus a six-character lowercase code retained only the spaces and first four code characters. The server correctly rejected that truncated value. An unpadded lowercase manual Group join succeeded before the fix. The limit is now 64 raw characters; existing trim/uppercase normalization runs before submission. This reproduces a concrete join failure, but cannot prove whitespace was the cause of the user's specific incident without that request's evidence.

Identifier model: the six-character game code both locates the room and authorizes private entry. There is no additional password. An opaque roomId is separately published in listings only to bind a row selection to its intended room. It is not the access code and is never autofilled into the code field. Both must match when a private row is selected. Manually typed codes do not require a roomId. No server validation changes.

Focused checks: private-entry-browser-check.mjs — 14 PASS at 1440/390 widths, using actual Host Create UI, separate browser clients, real keyboard input and live server time. Verified Private rows on Create/Join, lock/occupancy, automatic tab switch/focus/blank input/no premature join, wrong code error, padded lowercase selected and manual joins, authoritative seat/cookie creation, full Private disabled/rejected, Public joins. Existing online-entry-check: 8 PASS groups; online-entry-browser-check: 14 PASS checks (updated Create visibility expectation).

Exact files changed in this follow-up: client-v13/online-entry.js (only runtime change), tools/online-entry-browser-check.mjs, tools/private-entry-browser-check.mjs (new), ONLINE-GAME-UI-CLEAN-REBUILD.md, build-manifest.json, repository CURRENT-STATE.md and HANDOFF.md. Other unaccepted rebuild changes remain as before. No combat/RNG, server join, recovery, result, logging or navigation changes.
