# Registry Phase 1 — multiplayer identity follow-up

Physical Registry Phase 1 testing passed before this follow-up. This candidate now adds server-owned Online identity. It remains unpromoted; no Phase 2 or career collection has started.

## Behavior

- On opening Online, the client asks the server for its current multiplayer identity. The display-name input is read-only for accounts and Guests. Create/join submissions no longer send a name.
- On every create/join, the server independently resolves the authenticated account cookie again. Client-supplied name, playerId, Guest/account kind or avatar fields cannot override it. The private seat record stores account kind, immutable playerId, current display-name snapshot and avatar ID. Peers receive the existing name presentation, not another player's account ID or private Registry data.
- Display-name edits do not relabel an existing match. New rooms use the current Registry value; rematch preparation refreshes account names by immutable playerId. Guest identity remains Guest. No display-name lookup is used to identify an account.
- Guest identity is separate: playerId is null, guestId is cryptographically generated, and its generated label is Guest100–Guest999. It is saved with the existing temporary browser/game session and on its seats for REJOIN/recovery. Guest labels can repeat across independent sessions; they are not database identity.
- The Guest Goblin pool currently contains only the existing assets/units/goblin.png fallback. Selection uses Node cryptographic randomness, never gameplay RNG; the assigned fallback is shown beside the read-only lobby name. Adding real pool assets is deferred. No new artwork or randomized fake artwork variants were created.
- Account authentication does not replace seat credentials. Logout/login or a display-name edit cannot rewrite an existing seat identity or reclaim another browser's seat. Existing bound seat-token, disconnect, takeover and REJOIN checks remain authoritative. Guest history is never retroactively attached to a subsequently logged-in account; no career/Hall of Fame collection exists.
- Registry database path, Guest SKIP, Game Log, snapshot-only playtest persistence and disabled checkpoint.journal are unchanged.

## Focused verification

- tools/registry-multiplayer-check.mjs: 14 grouped checks. Real browser desktop account host + phone Guest join in Duel; desktop Guest host + phone account join in 4-seat Group with two AI. Read-only field, correct server names, fallback Goblin, both clients reload/REJOIN, exact authoritative host/RNG equality, private immutable identities, display-name change into a new session, forged name/identity ignored, foreign seat credential rejected, server restart and return with identities preserved.
- tools/registry-rematch-check.mjs: real Duel Quick Start consent, give-up, both rematch requests; updated account display name, original playerId/Guest identity and expected public response shape preserved.
- Registry API/account checks: 59 PASS. Registry desktop/mobile UI checks: eight grouped flows PASS.
- Existing Group Random deployment: desktop/phone, two Humans + two AI, complete rosters and validation PASS.
- Existing Game Log: default OFF, persistence, opt-in capture, bounded storage and no journal PASS.
- Copied deployment tests now assert the read-only name field instead of filling it; gameplay assertions are unchanged.
- Final candidate manifest regenerated and verified. Protected accepted Group Battle source separately verified unchanged.

## Exact files changed for this follow-up

Modified: server/registry.mjs; server/main.mjs; server/multiplayer.mjs; server/pvp.mjs; server/ring-pvp.mjs; client-v13/lan.js; tools/group-random-stream-check.mjs; tools/game-log-setting-check.mjs; REGISTRY-PHASE1.md; build-manifest.json.
Added: tools/registry-multiplayer-check.mjs; tools/registry-rematch-check.mjs; REGISTRY-MULTIPLAYER-IDENTITY.md.
Workspace CURRENT-STATE.md / HANDOFF.md and verification.json updated separately. No canonical engine, artwork, narration, gameplay policy or Registry database schema changes.

## Physical sanity test

1. Launch this candidate's PLAYTEST-LAN.cmd. Logged in on PC, open Online: your current display name must be automatic and uneditable. Create a Duel.
2. On a phone as Guest, SKIP if prompted, open Online: expect Guest### and the Goblin fallback, with no editable name. Join the Duel. Reload each device and REJOIN; verify the same names/seats.
3. Reverse roles in Group: Guest creator, logged-in phone joiner, plus AI seats. Verify placement/READY still work.
4. Through Profile, use an available display-name change. A new room must use it automatically; an existing room keeps its original name snapshot. Check a Duel rematch as convenient.

Stop for user testing. No promotion, push, deployment, Phase 2, Hall of Fame, telemetry, friends, avatar generation or multiplayer UI redesign.
