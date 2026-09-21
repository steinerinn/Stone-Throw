# Online result/remount correction — UNACCEPTED / UNPROMOTED

## Confirmed reproduction and causes
The same-document regression was reproduced before editing: an authoritative Group victory against AI was followed by a visible `You lose.` after MAIN MENU, and a newly created three-seat Group rendered zero player-grid cells. The document itself had not reloaded and there were no browser errors.

1. MAIN MENU's navigation opened the saved local session and immediately mounted its renderer. If the existing local session was a finished loss, this replayed that old local loss behind/on top of Main Menu. It was not a reversal of the Online victory: the original finalized matches, participant outcomes/summaries and career aggregates were identical before and after leaving. The test deliberately retains a real earlier local loss to reproduce this path.
2. Story-browser cached playback under the generic `multiplayer` mode key. Independent Group rooms restart their room-local epoch/battle numbering. The new room therefore inherited the previous room's terminal/revision/event cursors, pending playback and feedback state. The renderer rejected the lower-revision initial deployment snapshot as stale after unmount had emptied the grids.

## Narrow correction
- Menu-only return suspends/unmounts the renderer without replaying the saved local battle. The local session remains in its existing server slot; selecting a normal mode mounts it through the existing mode-selection path.
- Multiplayer playback is selected by room code + seat + match/recovery epoch, rather than just mode. Same-room Rejoin retains its own playback state; independent/new matches initialize cleanly. Single Player and Story retain their separate caches.
- Disposed renderers reject queued/delayed updates before logging, projecting or calling presentation callbacks.
- Group Leave now resynchronizes its disabled state when the Start/request busy flag clears. The identity/Rejoin regression exposed a previously latched disabled control after a request completed.
- No full reload workaround. Startup gate, shared music controller/context and continuous deployment/combat playback remain intact.

## Exact runtime files changed
- client-v13/story-browser.js
- client-v13/presentation.js
- client-v13/group-lan.js

Other candidate files: ONLINE-REMOUNT-FOLLOWUP.md, ONLINE-REMOUNT-EVIDENCE.json, tools/local-recovery-contract.json (compatible predecessor only), build-manifest.json. Root CURRENT-STATE/HANDOFF updated separately. Every other pre-task runtime/asset file matches its prior hash, including all Scout/Plague, server, statistics, canonical combat/RNG and music code. No private real Registry data touched.

## Focused verification
PASS on real Node service and browser, with an isolated temporary registered account/database:
- Before-fix reproduction recorded both false loss and zero cells; first Online match stayed a finalized Win and career/stat records were unchanged.
- Group versus AI -> real Win -> MAIN MENU -> fresh 3-seat/2-AI Group: desktop and phone-sized browser. Exactly one visible result transition (`You won!`), no result during three seconds at Main Menu, 225 placement cells, successful Random/Ready/start, same document and continuing battle music instance/time.
- Duel versus an AI-taken-over opponent -> real Win -> MAIN MENU -> new Group passes the same checks.
- Fixture uses a reduced ten-unit roster to reach a genuine win promptly via ordinary authoritative shots; outcomes are not forced or edited. It exercises real Create/Ready/AI/resolver/finalization and renderer paths, not a full-duration physical match.
- SQLite finalized match rows, participant outcomes/summaries and career inspection are compared before/after leave. No duplicate finalization or new loss. Starting the subsequent match does not add a finalized result for the earlier match.
- Existing four desktop/phone registered identity/Create/Ready/Start/Rejoin checks and Guest/logout check pass.
- Eight desktop/phone Single Player/Story/Duel/Group music-routing flows pass; seven portable controller checks pass.

Evidence: ONLINE-REMOUNT-EVIDENCE.json; workspace outputs/post-phase2-batch2/remount-check.mjs and remount-before/after*.json. No Scout/Plague work performed in this task.

## Physical retest
Use PLAYTEST-LAN.cmd. Enter the splash once, win an Online match against AI, then MAIN MENU. Confirm no loss popup/result follows. Create a new three-player Group with two AI: verify both battlefield layout and player placement grid, Random placement, Ready/start, and uninterrupted music. Please test in the same tab without refreshing between matches.

Candidate remains UNACCEPTED / UNPROMOTED. No commit, push, promotion or deployment.
