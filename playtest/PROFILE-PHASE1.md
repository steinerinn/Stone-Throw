# Profile Phase 1 — review candidate

Branch: `profile-ui-phase1`
Accepted parent: `a2ef6fe6da3fc2f9ca2813a1373be447318e09d9`
Status: uncommitted, unpushed, unmerged and undeployed.

## Delivered

One owner/public Profile with PROFILE, BATTLES, HALL OF FAME and YOUR STATISTICS (STATISTICS for public visitors). Fixed viewport panel, desktop columns, phone subpages, paginated history/statistics/ranks, compact Player Card, owner avatar/bio editing and access to existing account settings. Six reserved badge positions; no achievement logic.

Registered identities open Player Cards from deployment, supported battlefield names, Results and Hall of Fame. The global Hall of Fame design and Register remain unchanged.

Owner history opens a read-only adaptation of the existing Result renderer, with podiums and rewards on separate pages. No rematch/leave/gameplay controls. Retained replays use the existing public replay cursor and viewer, with board pagination.

## Read model

`POST /api/registry/profile-view` supports overview, paginated battles, owner stored Result and owner replay sections. It uses existing Registry/statistics, score and Reliability services. No schema migration or second statistics store was introduced.

Lifetime, Highest and Millennial use existing score definitions. Average uses naturally completed MATCH_SCORE_V1 records only. Canonical Result Rewards use the same pure summary calculation and all-actor eligibility as the live Result renderer, including ties. Raw retained facts are never returned. Read operations contain no writes, capture calls or combat simulation.

Public responses omit email, username, credentials, diagnostic facts, internal match references and replay controls. Public battle history stops at the latest five summaries. Owner Result/replay endpoints independently enforce account ownership and the five-match retention boundary. Chainest Friend ties use ascending stable account ID. Detailed Reliability recovery is owner-only.

## Exact runtime files

New:
- `client-v13/profile.js`
- `styles-profile.css`
- `server/profile-read-model.mjs`

Modified:
- `client-v13/registry.js`
- `client-v13/deployment-overlay.js`
- `client-v13/group-lan.js`
- `client-v13/online-overview.js`
- `client-v13/hall-of-fame.js`
- `client-v13/result-screen.js`
- `server/registry.mjs`
- `server/result-screen.mjs`
- `server/main.mjs`

Also updated: `build-manifest.json` and this report.
New verification sources: `tools/profile-fixture.mjs`, `tools/profile-data-check.mjs`, `tools/profile-browser-check.mjs`.

## Verification

- Profile data: 15 checks PASS — career values, completed-only average, early-exit treatment, AFK recovery, owner/public privacy, canonical reward ties, deterministic co-player ties, HOF ranks, five-match retention, pagination, unavailable history, bio editing and read-only/idempotent history.
- Profile browser: 149 checks PASS — 1920×1080, 1440×800 and 390×844; owner/public/Card flow, all statistics pages, Overview subpages, five visible recent rows, avatar/bio edits, long bio, historical four-player Result, replay navigation, pagination, compact Card and no page errors.
- Match Score: 85 PASS.
- Score/replay integration: 15 PASS; authority and RNG unchanged.
- AFK Registry: 36 PASS.
- Registry: 59 PASS, including persistence and unchanged gameplay checkpoint.
- Canonical TypeScript and compiled runtime are unchanged from the accepted parent.
- Screenshots and isolated fixture databases are outside the checkout. No real private Registry was used by tests.

## Data limits and visual review

No new HOF categories were invented: the tab shows the existing six categories in each of three modes. The example Lifetime/Biggest Chain/Rewards rankings do not yet exist in the authoritative HOF.

Historical Results are unavailable when final placements or a complete retained event sequence are missing. Older history keeps available summaries; Results/replays remain limited to the owner's latest five. Reward totals are labelled known when historical coverage is incomplete. Missing metric values display as unavailable rather than invented zeros.

Historical portraits/flags use current account identity because original portraits/flags were not frozen in the retained descriptor. Historical names and scores use stored match records. Special-ability usage/hit counters are shown where retained; a complete per-ability kill breakdown is not supported by the existing metrics and is omitted.

Physical review remains appropriate for typography, density, phone subpage preference and the compact historical podium presentation. Automated fit checks and screenshots passed; this candidate is not physically accepted yet.

## Playtest location

This candidate is in `C:\Users\Notandi\Documents\Codex\profile-ui-phase1\playtest`.
The existing running AFK playtest was not replaced. To test Profile on LAN port 3212, stop the existing playtest console first, then launch **this checkout's** `PLAYTEST-LAN.cmd`. Verify its startup output says `profile-ui-phase1`. Do not use the older AFK checkout's launcher for this candidate.

Screenshots: `C:\Users\Notandi\Documents\Codex\profile-ui-phase1-review` (synthetic test accounts).
