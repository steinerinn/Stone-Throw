# Chain Siege — Registry Phase 1 (multiplayer identity follow-up ready for physical testing)

Starting point: accepted group-battle-batch1-v1, manifest SHA-256 5926c47d888185fa2ba774be13568b8ecfd5d1c0c3e12b79fa50939c894ba1d6. This separate candidate does not modify that checkpoint or the Git repository. No promotion, push or deployment. Phase 2 is not started.

## Run and storage

Double-click PLAYTEST-LAN.cmd here. Node 24 is sufficient; no package installation/build is required. The console prints the Registry folder and LAN URL. On the other device, use that LAN URL.

Default private database on this Windows account:
C:\Users\Notandi\AppData\Local\ChainSiege\Registry\registry.sqlite

The general default is %LOCALAPPDATA%\ChainSiege\Registry; non-Windows fallback is ~/.local/share/ChainSiege/Registry. An operator may explicitly override ST_REGISTRY_DIR. This location does not depend on candidate path, build hash, port or match snapshot. All copies run under the same Windows account use this Registry. Do not delete it when replacing a candidate. The server refuses a Registry directory inside the runnable build; the static HTTP allowlist never serves it. Database sidecars (*.sqlite-wal / *.sqlite-shm) belong to SQLite, not checkpoint.journal. Stop all servers and back up the whole Registry folder when moving machines or Windows accounts. Match recovery remains independently build-bound.

SQLite uses transactions, WAL, synchronous FULL, a busy timeout and a 4 MiB retained journal size limit. It survives clean server/browser/process restarts and replacement of the runnable directory. Actual Windows reboot/update testing remains a physical check. No storage system can guarantee survival of disk loss; a backup is still needed when replacing the machine/disk.

## Account foundation

- UUID playerId is immutable identity; username/display name are never primary keys.
- NFC Unicode letters/numbers, 3–14 characters, no surrounding whitespace; case-insensitive uniqueness uses Unicode upper/lower normalization. Icelandic names are tested. Display name initially equals username.
- One free display-name change, then a server-enforced qualifying-game threshold of +100. Phase 1 does not accumulate games, import Guest history, or award statistics. Case-only changes also consume a change.
- Required ISO 3166-1 alpha-2 country, one confirmed later change. Bio is plain text, up to 280 code points; HTML markup rejected. Optional email remains unverified; no recovery service is claimed or implemented.
- Prepared fields: account status/moderation role, shared registered-default avatar ID, selected/unlocked avatar state and unlock list. No new artwork, selection UI or awards. Future unlock: Finish Story OR win 5 games.
- Passwords: asynchronous Node scrypt, N=32768, r=8, p=3, random 128-bit salt, 64-byte hash, timing-safe verification. Minimum 8 characters with Unicode uppercase/lowercase/number; maximum 256 UTF-16 code units. Confirm Password is checked on server. No plaintext/reversible password storage.
- Session: separate 256-bit opaque cookie, HttpOnly, SameSite=Strict, 30-day lifetime, only SHA-256 token digest in SQLite. Server validates expiry/status. Logout revokes that token; other logged-in devices remain signed in. HTTPS/public-origin configuration adds Secure cookies. Current LAN HTTP is for trusted local testing; production TLS/email recovery are later work.
- Registry mutation requires same-origin JSON POST. Independent account routes never invoke gameplay save/commands, advance RNG, or replace match/seat cookies. Profile responses are self-only; an explicit public projection excludes hashes, email and session/moderation data. No account list or private-data download route exists.
- Registration: one-time, ten-minute server arithmetic challenge bound to an HttpOnly browser nonce, honeypot, persistent per-IP limits (20 registrations/hour, 100 challenges/hour). Multiple accounts per IP are allowed. Login limits: 80 attempts/IP/15 minutes and 20/username/15 minutes. Hash concurrency capped at two. Limits are independent of gameplay queues and clocks.
- Login days use server UTC. First authenticated arrival/login on a new day qualifies once; a missed day resets current streak; record remains. Refresh on the same day does not add a day. Browser clocks are never used. Profile and new-day notice show current/record counts.

## UI and scope

Main Menu has REGISTER / LOGIN; signed-in accounts have PROFILE / LOGOUT. Guest Story bypasses registration. First Guest Single Player/Online attempt shows equal REGISTER / LOGIN / SKIP actions. SKIP persists in localStorage for that browser/origin; account options remain in Main Menu. Closing a registration form never forces registration or alters gameplay. Account/session credentials are not match seat credentials. Phase 1 does not silently attach existing or Guest matches to an account and now resolves LAN names from server account/Guest identities; see REGISTRY-MULTIPLAYER-IDENTITY.md.

Chain Siege is used for the new account UI/data location. Existing Stone Throw game filenames, branding artwork, rules and compatibility identifiers are retained. No broad rename or Demon/Cultist rename.

## Verification

- tools/registry-check.mjs: 59 focused assertions/cases; creation, duplicate username/display-name, Icelandic/case handling, password/confirmation rules, hashing, optional email, correct/incorrect login, logout/expiry/forged cookie, profile rules/bio, nationality limit, challenge/honeypot/rate limiting, three SQLite reopen cycles, real HTTP restart, copied replacement runnable using the same account DB, UTC streaks, same authoritative game checkpoint before/after account operations, origin denial, private DB not served.
- tools/registry-browser-check.mjs: eight grouped browser flows; Guest Story bypass; Single Player notice/SKIP; persistent SKIP into Online; registration then original Online flow; profile name lock/country/bio; browser and server restart; distinct desktop/390px phone accounts; login/logout; no JS errors.
- Existing Story deployment/rejoin suite: first map, streamed deployment, reload, malformed-request rejection and unchanged non-Story REJOIN snapshot PASS.
- Existing Group Random suite: four seats, two Humans/two AI; desktop/phone deployment, all full rosters, validation PASS. Only added the real Guest SKIP interaction in the copied test.
- Existing Game Log suite: OFF default/persistence, bounded 22,000 rows, no private capture when OFF, no checkpoint journal PASS. Only added Guest SKIP to copied test.
- Plague continuation: 22 cases PASS. Snapshot-only recovery: 500 writes / three restarts, exact host/RNG/LAN recovery, no new journal and old journal untouched PASS.
- Final manifest verification is run after all changes. Original accepted 503-file payload reverified separately; no canonical engine, combat, assets, narration, Group policy or existing presentation code was changed.

## Files changed from accepted payload

Modified: .gitignore; server/main.mjs; client-v13/bootstrap-production.js; client-v13/bootstrap-development.js; tools/playtest.mjs; tools/group-random-stream-check.mjs; tools/game-log-setting-check.mjs; build-manifest.json.
Added: server/registry.mjs; client-v13/registry.js; styles-registry.css; tools/registry-check.mjs; tools/registry-browser-check.mjs; REGISTRY-PHASE1.md.

## Physical test plan

1. Launch this candidate with PLAYTEST-LAN.cmd. In a fresh browser, confirm Story has no Registry popup; Single Player/Online offers all three choices. SKIP, close/reopen and confirm it stays skipped.
2. Register an Icelandic-named account on PC without email; register a different account on phone on the same LAN. Confirm identical passwords on different accounts are allowed, duplicate username/display name is rejected, and each device sees only its own profile.
3. Edit bio; use the free display-name change and check the 100-game lock. Change country with confirmation; check that a second change is locked. Username stays permanent.
4. Log out; check bad and correct passwords. Play normal Single Player/Story and create/join a multiplayer lobby as Guest or signed-in; verify existing flows and Game Log preference.
5. Close browsers, stop server, restart (optionally reboot Windows); log back in. Profiles must persist. Next UTC day, verify a single streak increment. Replacing the runnable folder must leave the printed Registry folder intact.

Stop for user testing. No Phase 2, Hall of Fame, career accumulation, telemetry, moderation UI, avatars, email delivery or multiplayer redesign.

## Final multiplayer identity integration

The Phase 1 foundation passed physical testing. The subsequent requested identity integration is documented in REGISTRY-MULTIPLAYER-IDENTITY.md, including its exact changed files and focused tests. Read-only account/Guest names, private playerId/guestId binding, Goblin fallback and future-session name updates are now implemented. No acceptance/promotion or Phase 2 work was performed.
