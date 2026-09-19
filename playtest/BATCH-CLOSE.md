# group-battle-batch1 — complete, not promoted

2026-09-19. The user reports the corrected Plague contract working in physical play and authorized closing this batch after the Game Log setting and verification. This candidate is the completed deliverable. No accepted checkpoint was overwritten; no promotion, push or deployment was performed. Player Registry remains a separately scoped future phase and has not started.

## Permanent Game Log setting

The existing gear / Settings menu now contains Game Log ON/OFF. Default OFF; the local preference persists and synchronizes across same-origin tabs. OFF records no new client log rows and requests no private/debug gameplay capture. Previously saved evidence is retained. An in-flight request accepted while ON can finish its capture; subsequent OFF requests do not capture.

ON enables the existing public multiplayer Game Log/save controls. In the local LAN launcher it also opts that client's requests into private Group Plague capture and numeric beta metrics. Each browser has its own preference; another enabled client's requests can still produce server evidence. This setting never downloads or exposes the private snapshots to clients. Hosted deployment restrictions remain unchanged; the launcher must permit private capture. No gameplay intent or command envelope changes: a diagnostic-only request header carries the opt-in.

Server limits remain two 2 MiB rotating trace files, two overwritten 32 MiB maximum snapshots and 4,096 progress rows per command. Browser memory and pending buffers remain limited to 22,000 rows; stored IndexedDB rows now also cap at 22,000 across matches, with an 8,192-character per-row ceiling. Oversized rows are dropped and reflected in the dropped-row count. This prevents browser disk history from accumulating indefinitely. Capture is not a recovery journal.

`checkpoint.journal` stays disabled in the playtest launchers. Normal checkpoint snapshots remain enabled; the journal-based deployment mode was not re-enabled or redesigned. Existing journal files are not appended or replayed by snapshot-only playtests.

## Preserved Plague contract

- Hero dies immediately on contact; Plague continues.
- Source-player elimination does not cancel the outbreak. Its remaining steps then advance on the infected player's turns.
- Target-board elimination clears its outbreak.
- Five scheduled steps and existing frontier/branch rules are unchanged.

## Final verification

- `tools/game-log-setting-check.mjs`: real browser gear toggle; default OFF; ON/OFF persistence across reload and ordinary REJOIN; opt-in headers for the real Group stream; absent debug metrics when OFF; OFF does not record events or reactivate on received metrics; browser storage bounded to 22,000 rows; no journal.
- `tools/plague-capture-check.mjs`: real Group workers with logging ON/OFF; exact authoritative host/history/RNG equality; OFF writes no private files even with the directory configured; ON records frontier/impacts/snapshots; rotation; Hero death with continued Plague.
- `tools/plague-continuation-check.mjs`: 22 cases PASS, all 15 unit types, 1v1/Group Hero contact, recovery, source/target elimination and genuine blocked frontier.
- `tools/plague-hero-strip-check.mjs`: 12 projection/actual-renderer DOM cases PASS, keeping the hit counter and RNG unchanged.
- `tools/group-random-stream-check.mjs`: four seats, two Humans/two AI; desktop and phone-sized browser RANDOM deployment; all four rosters complete; invalid requests still rejected.
- `tools/playtest-snapshot-check.mjs`: 500 writes, three restarts; exact host/RNG and LAN room recovery; no journal created, existing journal unchanged.
- `tools/story-narration/check.mjs`: 63 route cases, all 19 WAV/text hashes, browser playback/lifecycle/mobile controls and Battle 1 PASS.
- `tools/story-narration/deployment-check.mjs`: Story deployment/streamed placement/reload; malformed requests rejected; non-Story connection failure and REJOIN preserve snapshot PASS.
- Existing Group `ring-core`, `ring-privacy`, `statistics`, `shuffle`, and `service` suites PASS: chain ordering, Cleric-before-elimination, draw, hidden-world privacy, credential checks, exact reconnect state/RNG, controller mixes, consent, independent absence, WAIT/AUTO KICK/KICK/takeover and rematch.
- Manifest verification performed after closing metadata and documentation updates; final digest recorded in root CURRENT-STATE.md and HANDOFF.md.

These checks supplement the user's physical playtest. No claim of a fresh exhaustive historical matrix or physical multi-device test of the new setting is made.

## Files changed in this final cleanup

Within this candidate:
- client-v13/game-log.js
- client-v13/transport.js
- server/main.mjs
- server/plague-capture.mjs
- tools/playtest.mjs
- tools/plague-capture-check.mjs
- tools/game-log-setting-check.mjs (new)
- PLAGUE-CAPTURE.md
- BATCH-CLOSE.md (new)
- build-manifest.json

Workspace handoff updates: CURRENT-STATE.md and HANDOFF.md. Existing test evidence was regenerated by the listed Group suites. No canonical gameplay source, artwork, CSS, narration or accepted checkpoint changed in this cleanup.

Run: close the previous server, then double-click PLAYTEST-LAN.cmd. Leave Game Log OFF for ordinary play; enable it in Settings before reproducing a bug. The console prints the private evidence folder. Do not publish private snapshots containing hidden boards.
