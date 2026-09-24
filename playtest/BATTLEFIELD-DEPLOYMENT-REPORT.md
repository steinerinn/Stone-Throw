# ACCEPTED — Battlefield / Deployment Phase

2026-09-24. Branch: `battlefield-deployment-phase1`. Accepted parent: `b25d1da884f6084015996d49435077b2c29cffbb` (Online / Single Player checkpoint).

The user has physically accepted the current candidate. Battlefield UI is complete and frozen for this phase. This acceptance supersedes all earlier UNACCEPTED / UNPROMOTED labels in the historical notes below. Commit and push authorized; no merge or deployment.

Accepted scope: supplied battlefield route/medallion assets; equal-size aligned battlefield maps and animation-safe geometry; live/spectator/final cleanup; floating central deployment window covering stats/map banners without moving maps; portraits/identity/flags/readiness; stable Random layout; Ready/Unready and 120-second timer starting after required PLAYER seats join; canonical missing-unit timeout placement and durable rejoin; finalized Online reliability and minimum gates; diagnostic-only deployment AFK; removal of room banner; Leave navigation and newest-first visible Events. The explicitly authorized source-independent non-Plague Catapult benefit correction is included; its physical reaction case remains WATCHLIST. No Score implementation or unrelated combat/RNG redesign.

Final verification: 35 focused suites completed successfully, comprising 574 explicitly counted cases/groups and seven additional pass/fail suites. TypeScript 5.9.3 compilation PASS; all 160 generated canonical files match byte-for-byte. Exact accepted-parent combat/RNG comparison: 47 cases PASS. Build manifest: 1008/1008 PASS (digest reported after final metadata refresh; manifest cannot contain its own digest).

Non-blocking follow-up only:
- Event panel polish: backlog.
- Catapult reaction physical case: WATCHLIST, not a failed acceptance gate.
- Match Score / PLAYER vs AI: separate next phase; dry-run outputs excluded from Git.
- Profile work: separate next phase.
- Historical isolated Castle/Plague disclosure and multiplayer seat-loss reports remain documented watchlist evidence, with no speculative new fixes.

No private Registry/database/backup, screenshots, browser captures, generated accounts, logs, Score analysis, archives or OS-temp artifacts belong to this checkpoint. Normal playtest launcher keeps checkpoint.journal disabled; durable tests confirm no journal. Exact candidate scope and verification are in `playtest/BATTLEFIELD-DEPLOYMENT-REPORT.md`.

## Final verification detail

| Suite | Count |
|---|---:|
| Deployment authority | 21 |
| Canonical placement / accepted-base RNG | 120 |
| Deployment durable restart / rejoin / no journal | 7 |
| Online reliability and minimum gates | 11 |
| Online entry service | 8 |
| Disconnect / statistics reliability | 8 |
| Local Group authority / RNG | 10 |
| Local Group session / restart | 21 |
| Local Group results / accounting | 8 |
| Local / Online mode separation | 3 |
| Classification / backfill | 15 |
| Story causal progression | 5 |
| Monk targeting | 14 |
| Catapult source matrix and Group pending choices | 74 |
| Result screen logic | 9 |
| Registry | 59 |
| Deployment real-browser Ready / timer | 10 |
| Battlefield 4P / 3P / 2P live / spectator / mobile | 10 |
| Real SP / Online six-action map geometry | 14 |
| Private room browser joins | 14 |
| Final battlefield overview | 4 |
| Single Player browser setup / resume / rematch | 24 |
| Result screen desktop / mobile / solo / tie artwork | 21 |
| Story Scout | 8 |
| Music | 7 |
| Deployment overlay / Random stability / flag / mobile follow-up | 20 |
| Single Player / Story Leave follow-up | 2 |
| All-unit accepted-parent combat / RNG / restore comparison | 47 |

Total counted cases/groups: **574 PASS**. Seven additional pass/fail suites also PASS: live Result/Registry/rematch/rejoin regression; registered identity rematch; retained Game Log history/export; final Demon/route cleanup; browser Archer/Catapult single presentation; Online Catapult five contacts in one group; accepted-base Result host/RNG/surrender cutoff comparison. These are separate suite runs; they are not claimed to be 574 unique gameplay scenarios.

The Result regression first reached its final report write but the obsolete relative evidence folder was missing. It was rerun unchanged with its working directory under OS temp and passed. An archival Registry Phase 1 parity helper referenced a removed sibling checkout; the equivalent 47-fixture test was run from OS temp against the actual accepted parent above, with both states normalized equally for statistics instrumentation. No source assertion was weakened and no runtime workaround was introduced.

Generated test data/evidence is outside the commit. One legacy Registry test created a uniquely named temporary directory in the repository root; that exact generated directory was moved to OS temp after the test closed. No real private Registry or backup was opened or changed for acceptance.

## Exact included file scope

- `CURRENT-STATE.md`
- `HANDOFF.md`
- `playtest/BATTLEFIELD-DEPLOYMENT-REPORT.md`
- `playtest/assets/battlefield/route-broad.png`
- `playtest/assets/battlefield/route-curved.png`
- `playtest/assets/battlefield/turn-medallion.png`
- `playtest/assets/battlefield/turn-pointer.png`
- `playtest/build-manifest.json`
- `playtest/canonical/compiled/combat/units/benefits.js`
- `playtest/canonical/compiled/policy/placement-legacy.d.ts`
- `playtest/canonical/compiled/policy/placement-legacy.js`
- `playtest/canonical/shared/combat/units/benefits.ts`
- `playtest/canonical/shared/policy/placement-legacy.ts`
- `playtest/client-v13/combat-feedback.js`
- `playtest/client-v13/deployment-overlay.js`
- `playtest/client-v13/game-log.js`
- `playtest/client-v13/group-lan.js`
- `playtest/client-v13/lan.js`
- `playtest/client-v13/online-entry.js`
- `playtest/client-v13/online-overview.js`
- `playtest/client-v13/presentation.js`
- `playtest/client-v13/registry.js`
- `playtest/client-v13/shell.js`
- `playtest/server/deployment.mjs`
- `playtest/server/main.mjs`
- `playtest/server/multiplayer.mjs`
- `playtest/server/online-entry.mjs`
- `playtest/server/pvp.mjs`
- `playtest/server/ring-pvp.mjs`
- `playtest/server/statistics-capture.mjs`
- `playtest/server/statistics-store.mjs`
- `playtest/styles-multiplayer.css`
- `playtest/styles-online-overview.css`
- `playtest/tools/archer-catapult-group-check.mjs`
- `playtest/tools/battlefield-art-browser-check.mjs`
- `playtest/tools/battlefield-live-gap-check.mjs`
- `playtest/tools/deployment-browser-check.mjs`
- `playtest/tools/deployment-check.mjs`
- `playtest/tools/deployment-placement-check.mjs`
- `playtest/tools/deployment-restart-check.mjs`
- `playtest/tools/final-battlefield-cleanup-check.mjs`
- `playtest/tools/local-recovery-contract.json`
- `playtest/tools/monk-retaliation-check.mjs`
- `playtest/tools/online-reliability-check.mjs`

## Historical development notes

Earlier geometry/overlay proposals and UNACCEPTED status below are historical and superseded by the accepted final implementation and verification above.

# Battlefield / Deployment / Online Reliability — development candidate

2026-09-23. Branch `battlefield-deployment-phase1`, directly from accepted `b25d1da884f6084015996d49435077b2c29cffbb`.
**UNACCEPTED / UNPROMOTED. No commit, push, merge or deployment.**

## Architecture and implementation

Authoritative geometry correction: battlefield layout is frozen to accepted commit `b25d1da884f6084015996d49435077b2c29cffbb`. The overview DOM/order/reflow and map/container CSS are restored to that baseline. Reverted candidate lower-board centering (live and spectator), the in-flow mobile turn label, compact header/status dimensions and spectator padding override. Deployment overlay and all timer/Ready/rejoin/reliability behavior remain in place.

Only route/indicator artwork differs on the battlefield. Four survivors have four broad arrows; three retain old board positions with a curved overlay at the old route bend; two have no route arrows. Arrow endpoints and dial horizontal anchor/pivot are unchanged. The entire dial overlay is translated 20px upward without changing document flow. The 72px medallion overflows the original 46px dial box; the number uses inset-zero grid centering, with no arbitrary offset. Pointer art is enlarged from 28px to 44px and rotates around the shared dial/count center. Broad arrow image boxes are 56px tall (original aspect ratio), curved arrows 64px square, with 1.35 brightness and a subtle 2px gold shadow. This removes the previous gap-distance size clamp that made the upper arrow nearly invisible. Route overlays refresh after the existing card transition completes, without changing that transition. Narrow layouts hide decorative routing/dial and add no in-flow replacement. Assets remain verbatim and preserve aspect ratios.

Deployment identities, flags/AI, muted/green readiness and countdown remain a translucent overlay anchored to the enemy board, leaving placement input unobstructed on desktop and phone. Accepted header/status dimensions are retained so the battlefield origin is unchanged.

Correction verification: 10/10 real-public-authority-payload browser cases compare exact map/container rectangles and board DOM order against the accepted renderer/CSS: 4P live, 3P live/spectator and 2P live/spectator, at desktop 1440x1000 and phone 390x1000. Map rectangles remain exact; the latest visual follow-up intentionally translates the dial overlay 20px upward. Count centers equal dial centers. Route counts, curved route, phone hiding and absence of page errors pass. Deployment authority 21/21, reliability 11/11 and real deployment browser 10/10 rerun PASS (52 focused cases total). The prior broader verification below is historical, not rerun for this presentation-only correction.

Exact files changed by this correction: `client-v13/online-overview.js`, `styles-online-overview.css`, `styles-multiplayer.css`, `tools/battlefield-art-browser-check.mjs`, this report, `build-manifest.json`, and root `CURRENT-STATE.md` / `HANDOFF.md`. No server, canonical, recovery, asset or gameplay file changed in the correction.

Duel and Group retain their existing authority, command queues and Group workers. Ready toggles back to Unready during placement; units remain unchanged. Placement polling is allowed while Ready locks editing, so other readiness updates and battle start still arrive. No combat input lock changed.

The server arms one absolute deadline (`now + 120000`) after every required PLAYER seat has joined; AI seats are already deployed/Ready. Ready toggling, page mounting, refresh, disconnect and rejoin never reset it. Existing room serialization carries the deadline through server restart. Each new match/reset has its own deadline. Public metadata supplies deadline/server time; a small local countdown interpolates between authoritative updates. Deadline processing uses the existing serialized service/worker transaction before normal reconciliation, not a browser timer.

Timeout preserves every existing legal placement. The adapter derives each seat's missing roster and passes occupied cells to the existing canonical reduced-roster Random policy, then submits its additions through canonical `place` validation and the existing start boundary. The optional occupied-cell parameter defaults empty; ordinary Random, Story generation and combat are unchanged. No alternate random algorithm or combat RNG source was introduced. A transaction restores host/serial/readiness on a validation exception rather than discarding placement. Tests cover full and partial armies and a disconnected participant at expiry.

The reconnect/grace/takeover protocol is unchanged. Same-seat rejoin retains placement, readiness and deadline. Local Single Player Group sessions bypass Online deployment timers and reliability.

## Reliability policy (user-confirmed)

No Registry schema migration is needed. `statisticsStore.reliability(playerId)` derives durable totals from existing finalized registered-account Online participant rows, once per match ID. Single Player/Story are excluded, including classification guards for local Group history.

- Full participation and voluntary surrender (`Quit`) count as completed participation.
- Permanent `Disconnect` / `Kick` takeover counts as one failure per finalized match.
- Successful grace/rejoin is unpenalized; transient disconnect news is not a failure.
- Percent = completed finalized Online matches / relevant finalized Online matches * 100.
- Zero relevant games is UNRATED (null percent), never provisional 100%.
- Guests have no durable rating.
- Positive room minimums reject Guests and UNRATED accounts; no-minimum rooms admit them.
- Profile shows totals, percentage/UNRATED and diagnostic AFK count. Create offers no minimum or 50/60/70/80/90/100%; list shows only the threshold. Server checks registered playerId history before seat creation; no client-supplied score is trusted. Group rematch carries entry requirements forward.

AFK needed a product decision, now answered: only a connected PLAYER still unready at deployment timeout gets a per-seat diagnostic, saved with the match descriptor. It is **diagnostic-only**, never a reliability penalty. No new combat AFK timer or penalty.

## Exact runtime files

- `canonical/shared/policy/placement-legacy.ts`
- `canonical/compiled/policy/placement-legacy.js`
- `canonical/compiled/policy/placement-legacy.d.ts`
- `client-v13/deployment-overlay.js` (new)
- `client-v13/group-lan.js`
- `client-v13/lan.js`
- `client-v13/online-entry.js`
- `client-v13/online-overview.js`
- `client-v13/registry.js`
- `server/deployment.mjs` (new)
- `server/main.mjs`
- `server/multiplayer.mjs`
- `server/online-entry.mjs`
- `server/pvp.mjs`
- `server/ring-pvp.mjs`
- `server/statistics-capture.mjs`
- `server/statistics-store.mjs`
- `styles-multiplayer.css`
- `styles-online-overview.css`

All paths above are relative to `playtest/`. Recovery compatibility metadata in `tools/local-recovery-contract.json` is refreshed for the reviewed compatible optional policy argument and accepted predecessor. Build manifest and root CURRENT-STATE/HANDOFF updated separately.

## Exact supplied assets

Verbatim copies; original Downloads files remain untouched. No generation, cropping, resampling or image editing:

| Runtime asset under `playtest/assets/battlefield/` | Supplied filename suffix | SHA-256 |
|---|---|---|
| `turn-pointer.png` | `09_32_34 PM.png` | `adb8c90ed2c131ba7c7183129273a502b098df4bae495f5bc7068ff6a82d4aff` |
| `route-curved.png` | `09_36_12 PM.png` | `efddf55709226ab95851f1d61f8ef274b65a025a015a1e0083a345c757020396` |
| `route-broad.png` | `09_36_04 PM.png` | `5ed21381bd1204ef39d49207bb57ecbdc70eb102625f62d5bb0d16eea5363fe4` |
| `turn-medallion.png` | `09_32_50 PM.png` | `d47ddb3c63c1229c8c90b71a74306786e9854ce2c03cf1524696c9294bd62733` |

Each original filename begins `ChatGPT Image Sep 23, 2026, `.

## Verification

289 checks/groups PASS, plus accepted-base Result/authority parity script, TypeScript compilation, compiled-output byte equality and supplied-asset byte equality:

| Suite | Checks |
|---|---:|
| New deployment authority (2/3/4P; real Group worker, Ready toggle, timeout, preservation, rejoin/restore, disconnected expiry, diagnostic idempotence) | 21 |
| New canonical placement (30 seeds, two profiles; accepted-base placements/RNG and partial fill) | 120 |
| New Online reliability/history/gates | 11 |
| New real browser deployment/Ready/start + Guest threshold message, desktop/phone | 10 |
| New real-public-payload overview renderer, 4/3/2 live/spectator, desktop/phone | 10 |
| New real service durable restart, Duel/Group, same placement/RNG/deadline; no journal | 7 |
| Existing Online entry service / Private browser | 8 + 14 |
| Existing disconnect/rejoin/statistics | 8 |
| Existing local Group authority / session-restart / results / mode separation | 10 + 21 + 8 + 3 |
| Existing classification/backfill | 15 |
| Existing Story causal progression / final overview | 5 + 4 |
| Existing Monk retaliation | 14 |

New test files: `tools/deployment-check.mjs`, `tools/deployment-placement-check.mjs`, `tools/deployment-browser-check.mjs`, `tools/battlefield-art-browser-check.mjs`, `tools/deployment-restart-check.mjs`, `tools/online-reliability-check.mjs`.
The existing Monk test's historical bug comparison used moving HEAD and failed once HEAD included its accepted fix. Its reference is now pinned to the actual pre-fix accepted parent; all 14 assertions pass. No Monk runtime changed.

Browser screenshots and temporary test registries remain in OS temp, outside Git. Real private Registry and backups were not opened or changed. No credentials/private authority/RNG added to public payloads. `checkpoint.journal` remains disabled and was absent in durable tests.

## Physical retest

Check artwork legibility in narrow existing gaps, pointer/count, elimination routing 4 -> 3 -> 2 and spectator/mobile layouts. Check registered-avatar/flag readability, Ready/Unready placement editing, shared countdown, deadline autofill with partial placement, refresh/rejoin during deployment, and room minimum rejection messages/Profile totals. Automated coverage is not physical acceptance.

All previously accepted watchlist entries remain watchlist; no speculative Scout/Monk/Castle/Catapult/disconnect gameplay changes were made. Stop for physical testing.

Latest visual follow-up: 10/10 focused desktop/phone live/spectator browser cases PASS; screenshot review for 2P/3P/4P. Map positions/sizes/gaps/order unchanged, no added spacing; only overlay art sizing/position/contrast changed. Runtime edits limited to online-overview.js and styles-online-overview.css. Prior broader suite results remain historical.

Tiny follow-up: desktop four-survivor lower-row top padding reduced from 32px to 12px, moving only that row up 20px. Medallion/number vertical position unchanged. Number horizontal positioning uses measured glyph ink bounds around the shared center, not an eyeballed offset. No arrow logic changed. Browser expectations allow precisely this lower-row translation and verify horizontal ink centering.

Final three-item correction supersedes earlier spacing/count details: desktop active 4P overview padding-top 12px -> 0 and margin-top 4px -> 0. Measured lower-wrapper top minus upper-wrapper/footer bottom is exactly 0px. Dial top compensates the removed 4px margin so medallion position is unchanged. Count uses a dedicated SVG inner-circle anchor and measured glyph bounds on both axes; 1/2/3/12 verified. Straight route direction groups use only 0/90/180/270 degrees; the native down-facing PNG is normalized to a right-facing basis separately, with no angle derived from slightly mismatched endpoints. Curved route unchanged. Ten focused browser cases PASS; other map dimensions/order/mobile/spectator behavior unchanged. Runtime changes: client-v13/online-overview.js and styles-online-overview.css only.

Horizontal-gap clarification: only the two active desktop 4P lower cards move inward 12px each, closing their visible horizontal gap from 24px to 0px. Original grid track sizing is retained to avoid changing intrinsic battlefield width or upper-map positions. Heights, widths and vertical positions are unchanged. Ten browser cases PASS. Only runtime edit: styles-online-overview.css.

Equal-map-size follow-up: active desktop secondary maps inherit the same responsive --cell as the primary maps instead of overriding it to 22px. Side padding reduced to 1px and existing 376px card minimum retained to avoid changing upper-map geometry. All four grid rectangles measure 339.84375 x 339.84375 at 1440px. Horizontal card gap remains 0px; upper maps and lower-row top positions unchanged. Spectator/final/mobile untouched. Ten focused browser cases PASS. Runtime change only styles-online-overview.css.

Live-match regression correction: previous lower-gap CSS used absolute nth-child positions. After the first action, a hidden card moved ahead of the visible cards; the wrong offsets reopened a 36px horizontal gap in both real Single Player and Online. Selectors now count only non-hidden children. No card reorder or gameplay change. New battlefield-live-gap-check.mjs enters full-roster 4P matches through real Single Player and Online menus, performs six actions (including the opening Catapult choice in Single Player), and measures/screenshots at start and after each action. Before: 0px at start, 36px after actions. After: 0px at all 14 checkpoints, equal four map dimensions. Existing 10-case overview test also PASS. Only runtime change this follow-up: styles-online-overview.css.

Spectator overlay follow-up: curved 3P spectator arrow now sits beside the lower map near its top-right corner. Indicator uses one shared desktop anchor in live 4/3/2P and spectator 3/2P: centered horizontally, center 12px below top card footers. Adds exactly 5px breathing space to lower rows (4P padding 0->5, 3P live padding 32->37, spectator row-gap 24->29). Map dimensions/order/horizontal gap unchanged. Ten focused browser cases PASS; final-complete indicators remain hidden and phone fallback unchanged. Runtime files: client-v13/online-overview.js and styles-online-overview.css.

Unified desktop map states: live 3P now uses padding-top 1px plus existing 4px margin, matching 4P total gap 5px. Spectator row-gap is also 5px. Every desktop secondary map (including spectator/final) inherits the primary responsive cell size. Indicator art remains shared 72px and uses the shared anchor below upper footers. Focused assertions cover equal grid dimensions, common indicator dimensions, and exact 5px gaps for live 4P/3P and spectator 3P. Phone fallback unchanged.

Indicator/frame follow-up: shared indicator center now sits 8px inside the bottom of upper unit-bar/card footers (20px above the previous below-footer position), without changing row spacing. Secondary live frames and cells synchronize to actual rendered primary dimensions on geometry updates. Browser checks now assert full frame width/height as well as grid width/height; all four frames 371.84375 square and grids 339.84375 square at tested 1440px viewport. Screenshot size discrepancy was not reproduced at that viewport before this defensive synchronization. Runtime change only client-v13/online-overview.js; focused tests enhanced.

Demon orphan cleanup: real .demon-fire-whoosh animation-start failure reproduced. Presentation caught the failure and continued authority painting but retained route animation elements until whole-room completion; a locally finished spectator could therefore see the orphan. Failed route playback now clears its own transient effects before rethrowing, and base playback also clears on the existing failure boundary. Successful animation behavior unchanged. Updated real-browser failure regression verifies immediate effect/plane removal while the room is still live, live dial preservation, and final effect/dial/routes absence. Four final overview cases PASS. Runtime files: client-v13/online-overview.js and client-v13/presentation.js. This reproduces a failure path yielding the screenshot symptom; the original physical occurrence has no browser error trace to establish its initiating exception.

Indicator/width-cap follow-up: moved the shared dial 2px left with its vertical position unchanged. Removed the desktop secondary frame max-width cap and centered the frame independently of card content width, preserving measured primary dimensions. The physical browser was unavailable, so the exact physical discrepancy remains unconfirmed. Ten desktop/phone overview checks PASS at 1440/390px; fourteen real Single Player/Online checkpoints PASS at 1280px through six actions per mode. All four frames measured 343.015625 square and grids 311.015625 square at 1280px. Runtime change only styles-online-overview.css. No gameplay change.

Visible-column alignment correction: supersedes the earlier zero lower-card-gap objective. Removed the opposing 12px inward offsets. In active desktop 4P, each lower card is positioned from its actual map-frame left edge to the corresponding upper map-frame left edge; frame sizes remain synchronized. No indicator is used as a reference or changed. Both visible frame edges and widths are now asserted, rather than only card gap/width. Real full-roster Single Player and Online: start plus six actions each at 1440px and 1280px, 28 checkpoints PASS. Ten overview desktop/phone checks PASS. Screenshots at both desktop widths reviewed with matching frame columns and equal grid/frame dimensions. Runtime files: client-v13/online-overview.js and styles-online-overview.css. No gameplay changes; UNACCEPTED / UNPROMOTED.

Animation/layout regression correction: reproduced lower-card displacement of about 186px when a board shake replaces the frame centering transform and a scroll geometry update compensates the animated rectangle. Centering now uses the independent CSS translate property; column alignment subtracts transient transform translations before positioning cards. Shake timing/strength and gameplay unchanged. Regression samples six paused shake frames with scroll/layout updates: failed before, PASS after with stationary card and bounded intended shake. Ten overview cases and fourteen real Single Player/Online start/action checkpoints PASS. Runtime files: styles-online-overview.css and client-v13/online-overview.js. Indicator unchanged. UNACCEPTED / UNPROMOTED.

Authoritative Catapult rule correction: every new non-Plague Catapult hit now grants a Catapult benefit. Removed off-turn Archer nextShots++ and ordinary-shots ledger conversion; removed direct-source forced deferral on the owner turn. Owner-turn benefits use catapultNow; off-turn benefits use existing catapultLater plus Catapult ledger entry. Plague excluded. Existing duplicate-hit guard, turn-entry delivery, serialization, targeting/roll/RNG algorithms and visuals unchanged. Expanded archer-catapult-group-check.mjs with 66 deterministic cases (11 sources x own/off turn x 2/3/4 seats), duplicate hit checks, ordinary budget unchanged, pending/private restore and normal turn transitions, exactly one choice and five resolved contacts. Original eight Group cases covered own-turn chains only, leaving the off-turn exception untested; retained and PASS. Browser Archer chain deterministic state/RNG and single presentation PASS; Online Catapult five-frame single-group PASS; ten local Group authority/RNG parity groups PASS; TypeScript build PASS. Runtime changes only canonical/shared/combat/units/benefits.ts and generated canonical/compiled/combat/units/benefits.js. Physical retest: Archer hits Catapult off-turn -> next legal owner turn offers Catapult target choice; ordinary shot budget unchanged. UNACCEPTED / UNPROMOTED; no commit/push/merge/deployment.
