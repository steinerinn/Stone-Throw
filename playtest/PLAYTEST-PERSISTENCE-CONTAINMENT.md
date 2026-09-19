# Temporary playtest persistence containment

Local, LAN and development playtest launchers now set `playtestSnapshotOnly: true`. Direct server/deployment startup keeps its previous default persistence mode.

In snapshot-only mode:
- No checkpoint.journal creation, append, replay, archive-delta accumulation or torn-journal repair occurs.
- Each changed save replaces checkpoint.json with a complete, checksummed snapshot, including full authoritative state/history. Data is written to a temporary file, fsynced, closed, then renamed over the previous snapshot. Identical snapshots are not rewritten.
- Existing save boundaries, write-failure handling, state locks, build/mode checks and private state location remain intact.
- Existing journal files are not loaded, changed or deleted. Journal-dependent placeholder snapshots are rejected rather than silently treated as a valid recovered game.
- The launcher uses a new build-specific state directory. Development playtests now use the same build isolation with a separate development suffix. Previous build saves/journals remain untouched; no manual deletion is needed to start this build.

Temporarily lost: journal replay, recovery from the valid prefix of a damaged journal, and recovery of states that exist only in an older journal. Recovery is from the latest complete snapshot only; there is no journal fallback if that snapshot becomes corrupt. A crash before atomic replacement leaves the previous complete snapshot. This does not claim protection against every filesystem/power-loss failure.

The retained snapshot is not size-capped: it contains the current full state/history and may grow with actual game history. It no longer retains another full/delta commit for each request, so repeated saves do not accumulate a journal. Full snapshot serialization may cost more per save than the previous incremental path. This is temporary disk-growth containment, not a performance redesign.

Checks passed:
- 500 repeated snapshot writes: no journal created; test checkpoint remained 1,238 bytes.
- An existing unusable journal remained unchanged and did not affect a valid snapshot startup.
- Three real server close/restart cycles recovered identical authoritative host/RNG and a LAN room. The tested full host checkpoint was 178,163 bytes, with no journal.
- Default non-playtest journal mode still writes a journal.
- Production playtest Story deployment/streamed placement/reload passed. Malformed requests still reject; non-Story connection failure and REJOIN recover an identical snapshot.
- Full candidate manifest verification rerun.

Changed: server/store.mjs, server/main.mjs, tools/playtest.mjs, tools/playtest-dev.mjs, tools/playtest-snapshot-check.mjs, this report, build-manifest.json. No gameplay, narration, network protocol or accepted checkpoint changes. Candidate remains unaccepted.

Close any old playtest console before launching PLAYTEST.cmd / PLAYTEST-LAN.cmd / PLAYTEST-DEV.cmd again; an already-running older process does not acquire this change.
