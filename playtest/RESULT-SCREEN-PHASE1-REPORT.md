# ACCEPTED — Result Screen and physical bug-fix checkpoint

Physical acceptance confirmed by the user on 2026-09-22. This acceptance supersedes earlier candidate/visual-review status statements below. Historical investigation limitations remain documented. No speculative watchlist fixes were made.

# Supplied-art pass - UNACCEPTED / UNPROMOTED

Branch result-screen-ui-phase1; unchanged HEAD c008851de246968eda21ae37e50484e3e2ffb7f7.

The eight supplied PNGs now provide the full backdrop, solo/duo first throne, second/third platforms, occupied fourth and empty fourth with rat. The medal sheet is displayed directly using CSS sprite windows: target, blindfold, eagle, crossed axes/skull, chain, purple skull correspond to the six existing awards in order. Source artwork bytes are unchanged. No regeneration, image editing, avatar changes or award calculation changes.

Exact runtime files changed in this pass:
- playtest/client-v13/result-screen.js (asset selection and medal mapping)
- playtest/styles-result-screen.css (art-driven layout; old CSS podium boxes removed)
- playtest/server/main.mjs (eight explicit static PNG allowlist entries)

Other changed files:
- playtest/tools/result-screen-browser-check.mjs
- playtest/RESULT-SCREEN-PHASE1-REPORT.md
- playtest/RESULT-SCREEN-PHASE1-EVIDENCE.json
- playtest/tools/local-recovery-contract.json (prior compatible candidate digest; engine unchanged)
- playtest/build-manifest.json
- CURRENT-STATE.md
- HANDOFF.md

Newly manifest-listed user-supplied assets, untouched:
- playtest/assets/result-screen/Background.png
- playtest/assets/result-screen/1st place solo.png
- playtest/assets/result-screen/1st place duo.png
- playtest/assets/result-screen/2nd place.png
- playtest/assets/result-screen/3rd place.png
- playtest/assets/result-screen/4th place.png
- playtest/assets/result-screen/4th place no player.png
- playtest/assets/result-screen/fantasy_medal_icon_collection.png

Verification: 9/9 logic groups; 21/21 browser checks at 1440/390px (all eight static responses; decoded images; solo/duo/rat/occupied fourth; no fourth on 3-player screens; six medals; Human flags/AI second row; ties, four-way first/long names and no horizontal overflow; sequencing, early spectator and cleanup). Live service/browser View Battlefield -> RESULTS -> Rematch -> Apply Setup -> Random/Ready/start PASS. Separate Main Menu -> no stale result/duplicate statistics -> new Group grid PASS. Existing music continuity assertions PASS. Broader first-pass evidence reused.

Layout compromises: mobile stacks first above silver/bronze, then fourth and scrollable awards/buttons. Rare 3/4-way shared first wraps all identities above the duo asset because no larger shared throne is supplied. Full-screen background uses cover sizing and crops outer edges on narrow displays. Podium PNGs and portraits keep their aspect ratios. The supplied art is now the actual presentation, with no CSS-box fallback.

959 manifest files; final SHA in CURRENT-STATE/HANDOFF. Screenshots: external outputs/result-screen-ui-phase1/art-pass. Prior images preserved. No commit, push, merge or deployment. Stop for physical review.

---

# Historical visual-pass records

# Visual Pass 2 — UNACCEPTED / UNPROMOTED

Branch `result-screen-ui-phase1`; unchanged HEAD/base `c008851de246968eda21ae37e50484e3e2ffb7f7`. Continued the existing uncommitted first pass. No commit, push, merge or deployment.

## This pass

Preserved podium grid, dense/tied rankings, 3-/4-player structure, awards grouping, actions and result sequencing. Replaced the visual treatment with a gold title and ceremonial rules; static layered atmospheric lighting, fine texture, vignette and restrained vertical architectural framing; a raised golden winner surround; heavier metal caps, inset trim and stepped platform bases; colder silver, warm bronze and rough nailed timber; six distinct inline-vector award medallions; and inset metal action frames with a gold Rematch treatment. No avatar or other existing image/audio asset was changed. No permanent animation or image download was added.

Public result identity now includes `ai`, derived from the seat controller. The renderer puts NPC name on line 1 and literal `(AI)` on line 2, suppressing a flag for AI even if country metadata exists. Human name remains on line 1 and the existing nationality flag on line 2. Identity is not inferred from the name string. Combat, statistics, NPC assignment and result flow are unchanged.

## Focused verification

- `node tools/result-screen-check.mjs`: 9/9 scenario groups PASS (also invoked by browser check), including explicit AI/Human identity checks.
- `node tools/result-screen-browser-check.mjs`: 20/20 checks PASS at 1440px and 390px, including identity slots, human flag, AI flag suppression, six vector medallions, normal 3/4, shared first, four-way tie/long names without horizontal overflow, result sequencing, View Battlefield, spectator results and cleanup. The first run caught overflow from the winner's decorative halo on narrow shared-first; ornament was contained, then all checks passed.
- `node tools/result-screen-live-check.mjs`: PASS through actual HTTP/browser match completion, View Battlefield/RESULTS, rematch setup/Random/Ready/start, same document/music and unchanged finalized statistics.
- `RESULT_MENU_CHECK=1 node tools/result-screen-live-check.mjs`: PASS through Main Menu, no stale result/duplicate finalization and a new Group deployment grid in the same document.
- Manifest inventory remains 951 files. Final exact digest is recorded in CURRENT-STATE.md/HANDOFF.md after verification.
- Reused first-pass authority/RNG and broader regression evidence; did not rerun unrelated suites.

## Exact files changed in Visual Pass 2

Runtime:
- `playtest/styles-result-screen.css`
- `playtest/client-v13/result-screen.js`
- `playtest/server/result-screen.mjs`

Focused tests:
- `playtest/tools/result-screen-check.mjs`
- `playtest/tools/result-screen-browser-check.mjs`

Reports/build bookkeeping:
- `playtest/RESULT-SCREEN-PHASE1-REPORT.md`
- `playtest/RESULT-SCREEN-PHASE1-EVIDENCE.json`
- `playtest/tools/local-recovery-contract.json` (previous candidate digest added to existing compatibility list; engine digest unchanged)
- `playtest/build-manifest.json`
- `CURRENT-STATE.md`
- `HANDOFF.md`

Other uncommitted files belong to the preserved first pass, not new Visual Pass 2 changes.

## Screenshot review and remaining gap

Before: flat dark field, detached portraits over shallow blocks, small text-symbol awards and plain buttons. After: winner reads as one framed monument; platform caps, stepped bases and material contrast are more substantial; medallions give each award a recognizable mark; title/section rules and metal actions make the screen more ceremonial. All original screenshot files remain available as before evidence; pass2 screenshots are separate.

This is visibly stronger, but is NOT the illustrated fantasy scene in the concept and is NOT declared visually complete or accepted. Platforms remain geometrically straight CSS objects. The backdrop is atmospheric rather than a detailed location. Vector emblems remain line art rather than sculpted medals. The empty fourth platform still has no rat art.

Recommended small dedicated assets, in priority order: one restrained dark courtyard/stone environment layer with clear central space; a compact transparent winner throne/trim ornament (optionally matching silver/bronze caps); one small rat sprite for the empty fourth platform; a six-medallion illustration set if richer award art is wanted. These would close the material/scene gap more effectively than adding further gradient layers. No such assets were generated in this pass.

Physical review: inspect 3/4-player results, name/flag/AI stacks, ties, and View Battlefield/RESULTS/Rematch/Main Menu. Candidate remains UNACCEPTED / UNPROMOTED. Stop here for visual/physical review.

---

# First-pass record (historical; test counts and screenshots below predate Visual Pass 2)

# Result Screen UI Phase 1 â€” UNACCEPTED / UNPROMOTED

Branch: `result-screen-ui-phase1`. Unchanged HEAD/base: `c008851de246968eda21ae37e50484e3e2ffb7f7`. Branch/base and clean working tree were verified before editing. No commit, push, merge or deployment.

## Implementation

Only completed Online 3-/4-player matches use the new Result Screen. Duel/Story retain their result flows. Server-owned elimination boundaries and final outcome produce dense placements; equal boundaries share one platform. A shared first platform expands with its occupants. Three-player screens have no fourth platform. Four-player compressed rankings keep an unlabelled wooden platform. **The small rat asset is still needed**: there is deliberately no emoji/cartoon substitute.

Existing avatars are displayed unedited. Registered Display Name, avatar and nationality come from the Registry's multiplayer identity; Guests use their existing stable Goblin identity. AI uses the reserved Cruns/Snurk/Rackler A art and no nationality flag. NPC allocation uses Node crypto identity randomness, never gameplay RNG. Each room stores the selected NPC on its seat; recovery preserves it, repeated setup preserves it, and rematch carries reservations forward. Takeover changes the visible identity after recording the former Human's statistics cutoff. Per the explicit user decision, departure of the last joined Human records surrender/loss/cutoff and closes the room without assigning a fourth NPC or executing further AI combat. Unfilled Human lobby slots do not count as participants.

Final match awards reuse `summarizeMatch`'s existing six formulas/eligibility thresholds with all battlefield actors included in a separate **presentation-only** summary. AI can therefore win a ceremonial match award. This summary is never sent to career aggregation or stored as account credit. Human career cutoff and the existing human-only career award calculation are unchanged. All tied names are shown. Absent awards are omitted and the remaining row centers. Match results contain only public identities, placements and final award values; they contain no private board/fact archive or credentials.

Winner/loser/draw art appears for 2.4 seconds, then fades for 0.3 seconds before the new screen. Early eliminated players retain the immediate, dismissible loss screen and spectating; the final Result Screen opens when their match finishes. Timers/listeners are disposed with the mounted client and cancelled on Main Menu. No result opens over Main Menu. View Battlefield reveals the existing final overview; RESULTS reopens the podium. REMATCH and MAIN MENU invoke the accepted Group actions. Keyboard Tab stays within the new dialog; Escape views the battlefield.

Opening Results selects existing Exploration/menu music; viewing the field restores the normal scene. No authored mix, SFX, narration, autoplay unlock or music-instance code changed. The real browser test checks menu music and continuity into rematch battle music.

## Visual review

The first visual pass follows the supplied concept's central elevated gold first place, lower silver/bronze flanks, compact portrait/name/flag stacks, rough low wooden fourth platform, platform-mounted labels, balanced awards, and bottom actions. Existing circular avatar artwork is not cropped or regenerated. CSS provides bevelled caps, inset metal faces, restrained light, dark atmosphere, timber seams/nails, and short entrance/fade transitions. Small inline vector laurels are interface ornament, not redrawn avatar art.

The result is still **for user visual review, not visual acceptance**. The CSS podiums and small typographic award seals remain more stylized and less richly illustrated than the concept. The castle courtyard, sculpted throne/lions, fabric banners and detailed medal art are not reproduced. A dedicated small rat asset is needed; illustrated podium/background/award assets may be useful if the next visual pass needs the concept's material richness. No poor substitute scene/rat artwork was generated.

Desktop was reviewed at 1440px. At 390px, first place spans the top row, silver/bronze share the next row, and fourth follows below. Shared winners wrap when necessary; awards become two columns and actions wrap. Long names truncate inside their portrait width. This intentionally differs from exact desktop geometry to preserve readability. Tests include four tied first places, long names and no horizontal overflow. The dialog scrolls internally; background scrolling is locked only while it is open.

## Verification

- `tools/result-screen-check.mjs`: 9 focused scenario groups PASS â€” real 3-/4-seat final results, dense tie shapes, unique/stable NPC pool and recovery, takeover/last-Human closure, six awards/co-winners/no Purple Death, registered flag/Guest avatar, career AI exclusion unchanged.
- `tools/result-screen-authority-check.mjs`: PASS â€” accepted-base versus candidate authoritative host/RNG/placement equality; final Human surrender closes without host/RNG mutation and preserves Quit/Loss/cutoff accounting.
- `tools/result-screen-browser-check.mjs`: 18 checks PASS at desktop/phone sizes â€” initial outcome sequencing, shared platforms, empty/occupied fourth, missing awards/co-winner reflow, four-way tie/long-name no overflow, final overview, loser/draw/early spectator flow, cancellation on Main Menu and disposal.
- `tools/result-screen-live-check.mjs`: real production browser/service Group vs AI win â†’ podium â†’ View Battlefield â†’ RESULTS â†’ REMATCH â†’ APPLY SETUP â†’ Random/Ready/start PASS. NPC names remain stable; same document, battle music instance and previous accounting preserved.
- Same live test with `RESULT_MENU_CHECK=1`: podium â†’ MAIN MENU â†’ no stale result/duplicate finalization â†’ new Group deployment PASS.
- Relevant full regression: 8/8 suites PASS (HOF, qualification, browser/audio options, live multi-client statistics/lifecycle, routing, rematch, music, reliability). The live/rematch test selectors were adapted to the intentionally new Group controls; authority/statistics assertions remain intact. The old browser setup also needed to complete the actual startup/REJOIN UI before asserting visible Results. The adapted multi-client test is retained as `tools/result-screen-regression-check.mjs`.
- Existing final-overview (2/3/4 seats), Scout privacy/owner visibility and dual-Plague (15 checks) PASS.

## Inspection / physical route

Run `PLAYTEST-LAN.cmd` from this repository's `playtest` directory. Enter startup â†’ Online â†’ Group â†’ choose 3 or 4 seats â†’ create/join â†’ place/Ready or consented Quick Start. Complete a match while remaining in the room. Check the outcome art then the podium, View Battlefield/RESULTS, Rematch/Apply Setup, and Main Menu â†’ new room. Also leave an early eliminated client spectating until the final result.

Automated screenshot setup uses the real production renderer at a temporary local service URL, with explicit public result fixtures. `tools/result-screen-browser-check.mjs` generates `normal-4-1440.png`, `tie-1123-1440.png`, `normal-3-1440.png` and matching 390px images. The 1/1/2/3 fixture explicitly sets dense places for a deterministic visual inspection; it is not a new production endpoint or a forced gameplay result. Logic tests separately verify dense placement from authoritative elimination boundaries. `tools/result-screen-live-check.mjs` produces `live-3-human-npc.png` from a real service match using a small deterministic test roster, real commands, and no forced outcome.

Tests accept `ST_BROWSER_HARNESS` (ES-module URL exporting `launch`) and `ST_RESULT_EVIDENCE` (external screenshot directory). Without a supplied harness, they use Playwright. The live test supports `RESULT_MENU_CHECK=1` for the menu/new-room branch. Private test Registry stores are created outside the repository in OS temp directories. No real Registry database or account was changed.

## Exact runtime files

- `client-v13/result-screen.js` (new dialog, podium/awards, sequencing/disposal)
- `styles-result-screen.css` (new scoped visual treatment)
- `client-v13/presentation.js` (Group-only mount/render/unmount hook)
- `client-v13/lan.js` (Group result actions/reopening; legacy Duel controls retained)
- `client-v13/music.js` (visible Results â†’ existing menu music)
- `server/result-screen.mjs` (new public final summary/dense placements/NPC helpers)
- `server/ring-pvp.mjs` (public final payload, NPC persistence, authorized last-Human closure)
- `server/pvp.mjs` (Duel takeover uses reserved NPC name; no Duel result redesign)
- `server/multiplayer.mjs` (NPC reservations across rematch room move)
- `server/registry.mjs` (existing nationality in public multiplayer identity)
- `server/main.mjs` (allowlist new client/CSS assets)

Other changes: five `tools/result-screen-*-check.mjs`/`result-screen-check.mjs` test files, this report, evidence JSON, build manifest, existing local-recovery predecessor manifest allowlist, and root CURRENT-STATE/HANDOFF. No canonical combat/AI/RNG files or avatar/audio artwork changed. Existing accepted watchlists and the later cumulative-performance investigation remain deferred.

## Desktop fit / podium scale micro-pass — UNACCEPTED / UNPROMOTED

Desktop-only CSS (>850px): solo first width 440 -> 350px, duo first 490 -> 390px; second/third 285 -> 260px, still wider than unchanged 250px fourth. Art retains 4:3 aspect ratio. First-place containers shorten to 290/305px and secondary containers to 245px. Podium top spacing 22 -> 14px; fourth margin -6 -> -12px; awards top margin 15 -> -15px and bottom 17 -> 10px reclaim transparent-art/dead space. Identity groups move upward 22px relative to their previous anchors to clear the smaller wreaths; avatar/text sizes remain unchanged. Fourth art/label, awards, buttons, background and all result logic unchanged.

Visual review at 1850x940: solo four-player and duo-first/rat both show title, all six awards and all action buttons without scrolling. 1ST/2ND/3RD optical percentage centers remain correct under proportional art resizing; no new rank offset needed. Mobile 390px layout remains governed by the unchanged narrow-screen rules and passes overflow checks. Existing result test: 9 logic groups + 17 browser checks PASS under ST_RESULT_FIT=1 (desktop fit and phone, solo/duo/rat, crowded and three-seat layouts, View Battlefield).

Files changed in this micro-pass: styles-result-screen.css; tools/result-screen-browser-check.mjs; this report; tools/local-recovery-contract.json; build-manifest.json; repository CURRENT-STATE.md and HANDOFF.md. All other runtime and asset bytes match the preceding manifest. Screenshots are workspace-only outputs/result-screen-ui-phase1/desktop-fit/normal-4-1850.png and tie-1123-1850.png. No commit/push/merge/deployment.
