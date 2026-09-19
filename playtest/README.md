Current unaccepted revision: **physical-group-archive-performance-v1**. Performance-only continuation; see [archive/durability notes](ARCHIVE-PERFORMANCE.md) and `../archive-performance/REPORT.md`. The older sections below describe earlier iterations. No promotion or deployment.

# Group Battle / 3+ Multiplayer Batch 1

Unaccepted candidate derived from protected `core-multiplayer-stabilization-v1`. Do not promote or deploy until physical playtesting is approved.

## Local LAN playtest

Double-click `PLAYTEST-LAN.cmd`. Node.js 24 must already be installed; no build/install step is required. Verification runs first. Keep the console open. Use the phone/second-device URL printed there, on the same LAN. The launcher prefers port 3212 and selects an available port if needed. Build-bound private saves live outside the served candidate tree.

Choose ONLINE PLAY > CREATE GAME > GROUP BATTLE, choose 3 or 4 players and HUMAN/AI seats. The creator is Human. Other Humans join by game code or the existing open-games list. Each Human places an army and presses READY; AI places and becomes Ready automatically. Alternatively, the creator proposes Quick Start and every other Human accepts; AI accepts automatically.

The accepted authoritative shuffled ring determines the first player and targets. Only your own board and your current legal target are displayed. Other players appear by name in status, statistics and graph.

Eliminated players can Leave or commit to Rematch while watching public statistics/graph/Event Log. When the battle finishes, committed players move into a new rematch lobby without entering a code. Its first requester is host. The host can configure remaining seats without displacing joined Humans. Later returning rematch participants can claim unoccupied AI slots while the lobby is still open. Once that lobby has started, a later requester opens a fresh lobby rather than joining an active battle. A rematch host leaving before start passes hosting to the next joined Human.

Each Human's first two disconnects use the existing REJOIN / WAIT / AUTO KICK policy. Their third disconnect transfers the seat to AI without another reclaim period. Pre-start takeover replaces only that seat's placement through authoritative Random. Active takeover uses the current state. The last Human can Leave freely.

## Statistics contract

Group Units Destroyed and Core Units Destroyed credit the final damaging action's owner, including reactions, as explicitly authorized. Re-destruction after resurrection earns a new credit. Duel statistics remain unchanged. Ties use seat order. Unknown resurrection-dependent enemy strength remains a gap, never zero or retrospectively backfilled. Eliminated histories stop at elimination.

Full implementation, focused test results and changed-file list: `../REPORT.md`. Evidence and harnesses are outside this served artifact in `../evidence` and `../tests`.

No Team Mode, Chaos trigger, mini-maps, passwords, accounts, ratings, reliability statistics or audio redesign is included. Existing deferred stabilization polish remains deferred.

## Focused chain/presence stabilization (unaccepted)

Group combat transactions run in a private Node worker. Observer-safe shot and reaction frames stream into ordered playback while the main host services lightweight heartbeats independently. Gameplay remains authoritative and does not wait for animation completion. See `../stabilization/REPORT.md` for the four-browser chain, marker, presence and regression evidence.

## Final focused cleanup (unaccepted)

Multiplayer results can be closed for final-map inspection and reopened with RESULTS; the popup retains the authoritative REMATCH and MAIN MENU/LEAVE actions. Group comparison cards select the best other player, with seat-order ties. Dragon assets load independently of active command work, and Group flight waits for its sprite decode. See `../final-cleanup/REPORT.md` for current evidence and manifest identity.

Current unaccepted follow-up: ordinary-shot processing acknowledgement, forward Scout/Catapult opportunities, focus-stable feedback cursors and integer Group graph labels. See ../responsiveness/REPORT.md and GROUP-FORWARD-SPECIALS.md.

## Long-match responsiveness follow-up (unaccepted)

This candidate reuses committed public projections and validated unchanged Group host serializations, transfers private worker state without redundant JSON encoding, and avoids AI-only presentation projections. Checkpoint format and durability remain unchanged. Settled same-board normal input may overlap prior playback; reaction presentation remains ordered. Hidden-owner Archer arrows enter from a neutral right-side origin. The strength graph distinguishes exactly coincident known segments without moving samples; unknown samples remain gaps. Unstarted strength labels say WAITING.

Measurements, exact parity checks, physical-save strength traces and remaining manual checks: ../long-match/REPORT.md. This is still Group Battle Batch 1, not an accepted checkpoint.

## TEMPORARY BETA GAME LOG (unaccepted local playtest only)

Double-click PLAYTEST-LAN.cmd. This local launcher explicitly enables numeric request timings and the multiplayer GAME LOG / SAVE LOG controls. Direct production server startup keeps logging disabled; a configured public origin disables it even if requested programmatically. No private host or credential download endpoint exists. RESULTS and READY keep their existing controls next to the central GAME LOG.

Logs contain observer-public events and strength values, measured server/client spans and placement drag milestones. SAVE LOG downloads plain UTF-8 text. Recent rows are retained in memory and appended to browser IndexedDB every two seconds; SAVE LOG flushes pending rows. Reload/rejoin can recover stored rows on the same browser and origin. Abrupt close can lose the last unflushed records, and private browsing/storage eviction may prevent retention. Save before clearing browser data or changing launcher port. The panel shows its latest 2,000 lines; export includes all retained match rows.

Wall clocks are ISO UTC; relative clocks belong to each page. Server timing spans are measured separately and can overlap; do not sum nested projection/worker/persistence timings. Input availability is sampled at 100 ms, and requestAnimationFrame markers are paint opportunities, not physical-screen timestamps. Hidden reactions/identities not present in the observer projection are deliberately absent. Temporary instrumentation does not change gameplay/RNG or placement.
