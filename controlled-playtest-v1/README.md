# Stone Throw controlled playtest build

Checkpoint: `controlled-playtest-v1` (Stage 14). Parent: `randomized-initial-ring-v1`.

This is the accepted source/deployment tree, with compiled shared-engine JavaScript included. Use Node 24 (tested with 24.19.0) and a current Chromium/Edge browser. No runtime packages, database, bundler or public deployment are required. Existing historical filenames remain stable so asset and module references are unchanged. Only the allowlisted browser subset is served; do not point a generic static web server at this directory.

## Verify and run

From this directory in PowerShell:

```powershell
node tools/verify.mjs
$env:ST_STATE_DIR = 'C:\StoneThrow-private\playtest-state'
node server/main.mjs
```

Open `http://127.0.0.1:3211`. Choose normal play for local player-versus-AI or Story in the existing menu. Without `ST_STATE_DIR`, sessions are memory-only and restart loses them. Use a private operator-owned state directory outside any webroot or Git repository. Preserve the same browser cookies and origin to reconnect.

LAN, on a trusted local network:

```powershell
$env:PORT = '3211'
$env:ST_BIND = '0.0.0.0'
$env:ST_STATE_DIR = 'C:\StoneThrow-private\lan-state'
node server/main.mjs --lan
```

Players open `http://YOUR-LAN-IP:3211` and use Make/Join with the game code. Choose two, three or four seats and Human/AI controllers as supported. The host must be Human. Each Human keeps their own browser profile/cookies. AI seats are server-controlled. All 3-/4-seat matches shuffle the initial ring once at Start, including AI seats; Ready/join order does not select the ring. Rematch uses fresh battle RNG. Reconnect/recovery does not shuffle.

Loopback is the default. `ST_BIND` selects a local IPv4 interface; non-loopback binding requires `--lan`. `LAN_BIND` remains an alias. `PORT` defaults to 3211. Use the IP URL, not an arbitrary hostname. Stop the process with Ctrl+C (SIGINT; SIGTERM is also handled). In PowerShell, remove previous settings with `Remove-Item Env:ST_BIND` etc. before changing modes.

Explicit development, using a separate state directory:

```powershell
$env:ST_MODE = 'development'
$env:ST_BIND = '127.0.0.1'
$env:ST_STATE_DIR = 'C:\StoneThrow-private\dev-state'
node server/main.mjs
```

`--development` is also supported. Default `ST_MODE` is `production`; other values fail startup. Existing local development inspect/reveal/takeover tools remain available only in development. They expose private state by design, so keep development loopback-only and for trusted operators. No new Auto Match work or multiplayer takeover was added. A development checkpoint cannot be restored in production or vice versa.

## Optional reverse proxy

No public hosting was performed. For a later deliberate controlled proxy deployment, set `ST_PUBLIC_ORIGIN` to the exact origin, for example `https://playtest.example`, and keep Node on loopback behind the proxy. Forward that exact Host header and preserve Origin. HTTPS origin automatically adds Secure to both HttpOnly, SameSite=Strict cookies. `ST_SECURE_COOKIES=1` can also be explicit. Do not use Secure cookies on ordinary LAN HTTP. Forwarded headers are not trusted. Configure TLS and request limits at the proxy, restrict access to invited testers, and expose only Node routes, never this directory or the private state directory. No accounts or internet-scale protection is provided.

## Recovery and backup

With persistence enabled, each API response waits for a serialized full-server checkpoint write. Requests are processed serially for consistent snapshots. A temporary file is written and fsynced, then renamed over `checkpoint.json`; a process lock prevents two writers. An acknowledged action therefore has a saved snapshot. A lost response around a crash may leave an action committed: reconnect and read the new state; do not automatically replay the old command.

On restart, the server restores local sessions, all room seats and bindings, pending decisions, results, statistics, controller memory, gameplay RNG and fixed active rings. New random public epochs and refreshed handles reject commands from earlier process instances, including an older backup. This recovery randomness is cryptographic session metadata, not gameplay RNG. Browser-local preferences/Story UI settings still require the same browser profile. Transient animations are not replayed; public state is remounted. Development takeover is not automatically resumed.

The versioned JSON envelope contains a build-manifest SHA-256, production/development mode, payload checksum and server-private payload. Maps are tagged; canonical hosts use the existing serializer. These files contain hidden armies, RNG and bearer credentials. Checksums detect accidental corruption, not malicious operator edits. Use restricted OS permissions (Windows inherited ACLs must allow only the operator; Unix files are created 0600, directory 0700). Do not upload, email, log, publish or commit saves.

Backup workflow:

1. Stop with Ctrl+C and wait for the `shutdown` log.
2. Copy `checkpoint.json` to private backup storage together with this exact build's `build-manifest.json`/deployment archive. Do not copy `server.lock` or temporary files.
3. To restore, stop Node, preserve the current save separately, and copy the selected `checkpoint.json` into the configured state directory.
4. Run `node tools/verify.mjs`, then launch the same build, mode and origin. Check the `restore-success` log and `/health`.

Corrupt, unreadable or incompatible saves fail startup without serving or overwriting sessions. Preserve the failing file and restore a known good same-version backup. There is no migration framework. An upgrade must use an empty state directory unless compatibility is separately implemented. An abandoned lock from a dead PID is removed automatically; if a lock is unreadable or its PID has been reused, verify no Stone Throw process owns the directory before manually removing only `server.lock`.

If disk writes fail during play, the server returns `server-recovery-unavailable` and refuses further play with `server-recovering`; repair storage and restart from the last valid checkpoint. Do not continue from the unacknowledged in-memory state. Checkpoint rename/fsync protects ordinary process restart, not every power-loss/filesystem failure; keep backups. No multi-process hosting, distributed sessions or long-term persistence is supported.

## HTTP and operator status

API requests require POST, JSON objects and exact application/json media type (charset allowed), with a 64 KiB body limit. Request/header timeouts are 15/10 seconds, idle timeout 20 seconds and keep-alive 5 seconds. Host must match a local IPv4 endpoint or the configured public origin. A supplied Origin must match exactly. Missing Origin is permitted for same-site clients/operator tools; SameSite=Strict cookies and JSON-only mutations remain enforced.

Public errors are short codes: `malformed-request`, `request-too-large`, `invalid-host`, `invalid-origin`, `unknown-session`, `unknown-seat`, `bad-game-code`, `game-full`, `invalid-configuration`, `stale`, `illegal`, `development-denied`, `server-recovering` and `server-recovery-unavailable`. No stacks or private host state are returned. Incompatible/corrupt checkpoint errors are operator startup failures rather than a partially available game. Reload to obtain a replacement epoch after restart. Lost credentials require a new session/game; no account recovery is provided.

`GET /health` reports health, checkpoint/build identity, mode, recovery status, uptime and retained session/game counts. It contains no match identifiers, players, boards or RNG. Structured lifecycle logs cover startup, creation/join/leave, shutdown, restoration and safe failure codes. Tokens, cookies, private units and full errors are not logged. Counts include retained sessions; there is no automatic expiry or retention manager.

To rebuild shared TypeScript after deliberate source work, install the pinned development dependency (`npm install --ignore-scripts`), then `npm run build`. Runtime startup needs no install. The accepted compilation used TypeScript 5.9.3. Run the verifier after rebuilding; a change requires a newly reviewed manifest, not editing hashes to hide drift. The manifest covers the shipped payload, not private state or subsequently installed node_modules. Store the separately supplied manifest hash with the release archive.

See `DEFERRED-CLEANUP.md` for limitations and `GITHUB-PROMOTION.md` for the non-destructive promotion plan. Stage 14 adds no gameplay changes.
