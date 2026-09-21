<!-- Current physical acceptance supersedes earlier testing-pending limitations in this implementation report. -->
# Registry / Hall of Fame Phase 3 + Audio Options

Status: ACCEPTED — physical testing passed, 2026-09-21.
Branch registry-hof-phase3 starts directly at accepted c901711908036e0ccc7180a65fd2acdd555d8070. post-phase2-batch1 remains at that commit. Acceptance commit/publication is tracked in Git; no merge or deployment authorized.

## A. Hall of Fame

### Architecture and authoritative source
A read-only POST /api/registry/hall-of-fame endpoint reads the existing stat_career rows joined to active Registry accounts. No schema, career metric, finalization or reliability change. Immutable Player ID is the ranking key. Current display_name and country are read from accounts on every request. No username/seat/browser/host identity is used to select career data. The viewer is derived from the authenticated account session; clients cannot choose a viewer ID or bypass flag.

Exactly three tabs: Duel, 3 Players, 4 Players. Six cards in a 3×2 desktop layout, responsive single column on phone:

| Category | Existing authoritative metric |
| --- | --- |
| Siege Champion | wins descending |
| The Underdog | losses descending |
| Highest Win Ratio | winRatio = wins / games descending |
| Highest Loss Ratio | lossRatio = losses / games descending |
| Game Master | reliability.Full descending; never effectiveFull |
| Stormtrooper Award | ordinary-shot accuracy ascending; null/undefined excluded |

Draws remain in games. Single Player/Story are not accepted HOF modes. AI/Guest have no career rows and never enter HOF. No admin exclusions invented. Score and formula-version fields remain untouched/null; no WARLORDS ranking or formula.

### Qualification, ties and detail
The existing FUTURE_HALL_OF_FAME_FULL_GAMES constant supplies 10 Full games per selected mode. Normal startServer defaults enforce it. Current PLAYTEST/PLAYTEST-LAN explicitly enable hofPlaytest; explicit development mode also bypasses it. A publicOrigin always disables the bypass. Request bodies cannot override qualification. The UI identifies playtest rankings, with no user-facing bypass checkbox.

Equal exact metrics receive competition ranks (1,1,3); Player ID orders tied rows only for stable rendering. Cards identify tied-leader counts. Detail supplies Top 10 entries plus approximately five neighboring entries each side of the viewer, deduplicated by Player ID; the viewer's own row is highlighted. Viewer status distinguishes guest, no finalized games, no metric, not qualified and ranked. Open/Refresh fetches current server data; no authoritative browser ranking cache.

### Nationality flags
Current Registry country is shown beside Display Name in cards and detail rows. The existing country/change rules are untouched. Missing nationality renders a neutral em dash with an accessible 'Nationality not set' label. 249 unmodified flag-icons 7.5.0 SVGs match the existing Registry country codes, bundled locally so Windows rendering does not depend on flag-emoji support or third-party network requests. MIT license and package-integrity/provenance are retained in assets/ui/flags. This is display-only; no new nationality/profile system.

### HOF files
- server/hall-of-fame.mjs (new): ranking/qualification/read-model.
- server/statistics-store.mjs: read-only current-account join.
- server/main.mjs: read-only endpoint, server-owned bypass, explicit new static assets allowlist.
- tools/playtest.mjs: current prototype bypass enabled.
- client-v13/hall-of-fame.js (new): tabs/cards/detail/refresh/flags.
- client-v13/registry.js: HOF entry beside account/statistics controls.
- styles-phase3.css (new, shared): responsive HOF/audio controls.
- assets/ui/flags/*.svg (249), LICENSE.txt and ATTRIBUTION.md.
- Both stage13 production/development HTML shells load shared Phase 3 CSS.

## B. Audio Options

Four independent ON/OFF + 0–100 groups in existing Options/gear: Master, Music, SFX, Narrator. No separate debug UI. Obsolete 'coming later' audio labels removed.

Effective gain = existing authored gain × Master level × category level, with either relevant OFF setting making gain zero. Default levels are 100; authored gains/tracks/duck-release values unchanged.

- Music: all actual musical tracks, including menu, Story, battle and results, retain their existing per-track authored Web Audio gain, followed by user Music/Master gain.
- SFX: the deployed client's synthesized hit/miss/gameplay feedback uses a shared per-AudioContext SFX/Master bus. Both Plague eerie and intensity layers use SFX/Master user gain even though playback remains inside music.js. Existing public active-outbreak routing/timers are unchanged.
- Narrator: the existing 19 WAV mapping/text/lifecycle uses a narrator gain stage (native volume fallback if Web Audio is unavailable), independently scaled by Narrator/Master. Story screen narration toggle shares the same preference. Audio is muted through gain without resetting chapter position; it can advance silently while muted. Leaving narration still releases/stops the old chapter as before.
- Master: scales all three categories, including already-playing effects and narrator. OFF retains stored levels; moving a slider to zero does not change its toggle.

Preferences use the existing browser/localStorage approach under chainSiege.audioOptions.v1, outside Registry and match state. Existing narration ON/OFF preference initializes the new Narrator setting; later changes keep that legacy preference synchronized. Storage events synchronize preferences between tabs. No account/gameplay data is put into preferences.

Gain changes do not recreate media or seek tracks. Normal same-document menus/modes/rematches preserve audio. Startup still unlocks through the existing splash interaction. Page hide silences/pauses music; pageshow restores wanted playback with user gains preserved. Closed SFX contexts are removed from the preference bus registry.

### Audio files
- client/audio-options.js (new): persistent preferences, Options controls, SFX/Narrator gain routes.
- client-v13/music.js: user gain stage; Plague uses SFX; page-restoration integration.
- client-v13/combat-feedback.js: existing synthesized effects through SFX bus.
- client-v13/presentation.js: old hidden sound bridge delegates to shared Master setting.
- client/story-presentation.js: shared Narrator preference and gain, preserving 19 text/WAV mappings and screen lifecycle.
- StoneThrow-v1.427-stage13-production.html and ...development.html: load audio preferences/CSS and remove obsolete placeholders.
- styles-phase3.css (shared), server/main.mjs static allowlist (shared).

No audio files replaced or modified. Current deployed non-music/non-narrator sounds are the synthesized feedback path and the two Plague layers; both are under SFX. Retired legacy engine copies are not loaded and were not refactored.

## C. Verification

Eight final suite entries PASS; workspace outputs/registry-hof-phase3/final-results.json retains output:
1. HOF storage/ranking: 22 isolated accounts; all modes/categories; Top 10/viewer/neighbors; deduplication/ties; no-shot accuracy exclusion; raw Full vs effectiveFull; current name/nationality after existing profile update; per-mode qualification; duplicate capture idempotence. Uses isolated authoritative-format finalization fixtures, not edits to production career rows.
2. Normal-server HTTP qualification: Duel qualifying population, unqualified 3-player population, unsupported mode rejection, attempted request bypass rejected.
3. Real browser at 1440 and 390 widths: 3×2/phone HOF layout, loaded flag images on cards/rows, exactly one own-rank row, all four audio controls, actual UI toggle/slider events, persistence after reload, startup entry, pagehide/pageshow recovery and no browser errors.
4. Genuine authoritative match/service matrix: Duel/3/4-player finalization, live Rejoin preserving state/accounting, same-document rematch starting/finalizing once, different accounts and Guest isolation, real Story-win exclusion, All/global invariants, same account queried from independent contexts yielding identical HOF results.
5. Eight real service/browser music flows: Single Player, Story, Duel and Group at desktop/phone widths. Menu/deployment/combat routing, continuous battle instance/time through Random/Ready/Start, no Exploration blip, Master OFF/ON without duplicate tracks. The workspace copy uses new gain-mute semantics rather than requiring paused media; original historical tests are unchanged.
6. Existing real Group-AI rematch check: APPLY SETUP once, Random/Ready/start, same document/audio, prior finalized records unchanged.
7. Existing music-controller tests: 7 checks (autoplay retry, preload, routing, ducking, continuity, result/draw behavior).
8. Existing reliability tests: 8 checks (disconnect/Rejoin/WAIT/auto/kick/surrender, takeover cutoffs, recovery identity).

Audio matrix measures the actual browser media/Web Audio graph, not just labels:
- Master OFF zeros Music, both Plague layers and Narrator.
- Music OFF leaves SFX/Plague/Narrator independently enabled.
- SFX OFF zeros both Plague layers; ordinary feedback creates no new sound while muted; Music/Narrator remain enabled.
- Narrator OFF leaves Music/SFX enabled.
- Master 50 / Music 40 / SFX 80 / Narrator 100 yields authored-level multipliers .2 / .4 / .5 respectively.
- Toggles preserve slider values; music/narration times are not reset; no duplicate instances.
- Genuine synthesized feedback uses the SFX bus and its expected gain.

The gain matrix includes battle and both Plague media layers plus real Story narration. Story/menu/result scene selection remains covered by existing routing/controller cases; common Music bus covers all musical tracks. No extra music assets are preloaded beyond the existing wanted/next-track policy.

### Limits / not verified
Physical listening on the user's actual PC/phone and OS output volume remains for retest. Automation uses independent browser contexts, not two physical machines. Firefox/Safari-specific hardware audio behavior was not run. The no-Web-Audio volume fallback is retained; hardware/media limitations of browsers without Web Audio are not fully certified. No live AFK policy or future HOF score system is implemented/tested. Scout privacy and Plague active-lifetime remain WATCHLIST only and were not reopened.

## D. Regression and protection

Canonical engine/gameplay/RNG/AI/placement/chain code, multiplayer/rematch implementations, Registry identity/profile rules, statistics metrics/finalization, Story progression and original audio assets compare byte-identically with the accepted base. Server statistics-store adds only a read operation; no schema migration/backfill. Real private Registry data was never opened for automated tests. Test directories and downloaded package archive stay in the workspace, outside the served payload.

Additional metadata: PHASE3-REPORT.md, PHASE3-EVIDENCE.json, build-manifest.json, tools/local-recovery-contract.json and root CURRENT-STATE/HANDOFF. The accepted checkpoint's ACCEPTANCE.md and earlier reports remain historical; the current build manifest/handoff explicitly mark Phase 3 unaccepted.

## E. Physical retest

1. Launch normal PLAYTEST-LAN.cmd (or PLAYTEST.cmd); enter through splash. Open HALL OF FAME from Main Menu. Check Duel/3/4 tabs, six cards, your current name/flag and ranking detail. Check own row/nearby rows and tied ranks. The playtest qualification notice should appear.
2. Log the same account into the other device; select the same mode/category and compare own rank. Try another account. Finish a Duel/Group and a rematch; refresh HOF and Statistics and confirm each result appears once. Existing profile nationality/name rules still apply.
3. Options: test Master OFF for complete silence, then Music OFF with SFX/Narrator ON; SFX OFF with Music/Narrator ON; Narrator OFF with Music/SFX ON. During active Plague, both layers must obey SFX, not Music.
4. Try Master 50, Music 40, SFX 80, Narrator 100. Toggle each OFF/ON and check retained numbers. Move a slider to zero without changing its toggle. Reload and verify settings persist.
5. Story: independently control Rising Moon and Lewis. Toggle Narrator without restarting the chapter; deployment still switches to Eye of the Storm. Check battle/result music, ordinary effects, and Online rematch/return continuity.

Stop for physical acceptance. No commit/push/merge/promotion/deployment.

## Physical acceptance — 2026-09-21

User PASS: HOF functionality, Duel / 3 Players / 4 Players rankings, nationality flags, details/rankings, Master/Music/SFX/Narrator controls, Plague as SFX, rematch and statistics. Scout and Monk remained stable through repeated physical games. Active Plague audio on a relevant opponent battlefield is intentional and accepted. HOF visual polish is deferred and non-blocking. No runtime changes made during acceptance. No avatar work, merge or deployment.
