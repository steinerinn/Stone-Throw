# Startup entry and uninterrupted Online music — UNACCEPTED / UNPROMOTED

## Cause and correction
The previous Main Menu relied on arbitrary input to retry autoplay. A cold browser could correctly refuse the quiet autoplay attempt, leaving a silent menu. The new full-screen entry gate explicitly requests a real tap/click/keyboard Enter. Exploration is primed while waiting but no music play is attempted until Enter. Enter synchronously resumes the existing controller's AudioContext and starts the wanted menu track. No synthetic click unlock, new audio system, or mix change.

Create/Join previously called location.reload() immediately after the server set the seat cookie. That discarded the unlocked document/context. They now reopen the server-selected seat and mount it through the existing Story-browser mode renderer path. This retains configuration restoration, tutorials, public update callbacks, playback bookkeeping and server-owned cookies/identity. Ordinary Leave/result returns and Group room/rematch handoffs use the same path, including the existing resolveReturn prompt where applicable. Outstanding old-room reads/heartbeat errors are invalidated by a navigation generation so they cannot reload or paint a replacement room.

## Splash identity and lifetime
Both production/development HTML shells include the gate before the menu. A modal dialog traps focus; Escape cannot bypass it. The supplied banner bytes/aspect ratio are unchanged. Current registered welcome copy comes from the existing Registry /me response via a read-only displayName export; Guests/unauthenticated clients use generic copy. It does not read a cached label, set identity, require login, or affect playerId/seat credentials.

The gate exists once per document and is removed on Enter. Internal Single Player, Story, Online and result navigation does not recreate it. Browser refresh/new document requires Enter again. Exceptional failed seat remount, revoked/rejoin-required seat polling, or explicit bootstrap error recovery can still reload; the resulting document gets the same deliberate gate. Normal Create/Join/Leave do not reload.

## Exact runtime files changed
- StoneThrow-v1.427-stage13-production.html
- StoneThrow-v1.427-stage13-development.html
- styles-startup.css (new)
- client-v13/startup.js (new)
- client-v13/registry.js (read-only welcome-copy export only)
- client-v13/music.js (entry-gated unlock/quiet priming; tracks/gains/routing preserved)
- client-v13/bootstrap-production.js
- client-v13/bootstrap-development.js
- client-v13/story-browser.js (reuse existing mount path for explicit server-opened sessions)
- client-v13/lan.js
- client-v13/group-lan.js
- server/main.mjs (static allowlist for the two new public files only)

Other candidate changes: this report, STARTUP-ENTRY-EVIDENCE.json, compatible predecessor entry in tools/local-recovery-contract.json, build-manifest.json. Root CURRENT-STATE/HANDOFF updated separately.

## Focused verification
All PASS against real isolated Node service and Edge/Chromium browser contexts, without autoplay override flags:
- Eight routing flows: 1440px desktop / 390px touch-phone × Single Player, Story, Duel, Group. Initial Enter -> Exploration; Story Rising Moon; actual deployment Eye of the Storm; combat continues the same advancing audio instance. Random/Ready/Start cause no menu replay. Sound OFF/ON creates no duplicate music instance.
- Four startup/navigation flows: desktop/phone × Duel/Group. Authoritative changed Display Name and generic Guest welcome, keyboard/touch Enter, zero pre-Enter music play attempts, preserved 4:1 banner/no horizontal overflow, actual UI Create and UI Join without document replacement or extra audio-wake click. Same room/seat/playerId on Rejoin; genuine reload shows the gate again. Duel result Main Menu retains document. Group third-disconnect return preserves the existing takeover/dismissal policy and retains document.
- Two local internal-return flows: Single Player and Story deployment -> Settings -> Main Menu with no second splash.
- Four existing identity flows rerun: registered names through create/Ready/start/Rejoin, stale-seat setup recovery, desktop/phone Duel/Group; separate logout -> generated read-only Guest identity check.
- Seven portable music-controller checks: autoplay retry, one instance, continuity, draw silence, narration ducking, public-only inputs.
- All prior canonical code, assets (including music/narration/banner), and server authority/Registry/persistence files match the immediate pre-task manifest. server/main.mjs differs only in public static file allowlist. No gameplay/RNG/AI/scoring/private database changes. Journal remains disabled.

Evidence: STARTUP-ENTRY-EVIDENCE.json. Repro harnesses and desktop/phone screenshots are in the workspace outputs/post-phase2-batch2/startup-* files. No server/browser testing used the real private Registry database.

## Physical retest
Run the normal PLAYTEST-LAN.cmd. On desktop and phone: cold-load, confirm welcome name, tap/click Enter and listen for Exploration. Create/Join Duel and Group; deployment must play Eye of the Storm without an extra wake-up click. Random/Ready/Start must not restart it. Leave/Rejoin and result -> Main Menu should retain audio activation and not show a new splash. Check Story narration/deployment and Single Player deployment. Only a genuine refresh/error-recovery new document should ask for Enter again. Physical listening remains required; phone-sized automation is not a physical phone audio test.

No commit, push, promotion or deployment. Candidate remains UNACCEPTED / UNPROMOTED.
