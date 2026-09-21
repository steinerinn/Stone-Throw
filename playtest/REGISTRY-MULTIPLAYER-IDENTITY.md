# Latest Batch 2 identity binding correction — UNACCEPTED / UNPROMOTED

Root cause: the Online click handler first tries to resume an existing multiplayer seat. If that call returns unknown-seat (e.g. an expired seat credential after an old session/build), its error branch opened the setup panel without calling syncIdentity. The normal branch did call it. Thus a valid authenticated account could appear in the Main Menu while the setup field stayed empty and identityReady stayed false. The server still returned the correct current Display Name from pvp/identity. This was reproduced with real registered-account requests and an invalid old seat credential; fresh account-only entry already worked. The physical client's exact cookie/error was not captured, but this reproduces the reported blank/blocked panel.

Fix: client-v13/lan.js now uses one showSetup helper for normal entry, restored menu and non-REJOIN error entry. It fetches the existing authoritative account/Guest identity before enabling Create/Join. No hard-coded name, client account cache or display-string identity. Server validation/errors remain; rejoin-required and seat-handed-to-ai still follow their original handling. No server/Registry/music code changes.

Verification: desktop 1440 and phone-sized 390, both Duel and 3-seat Group with two Humans/one AI. Registered test account changed Display Name through the existing profile rules, entered Online, re-entered after refresh, reproduced the stale-seat error, saw the correct read-only name, created via the actual button, placed/Ready/started and explicitly left/REJOINed. Same room/seat/playerId and Display Name verified. Guest opponent joined normally. Logout before creating a room retained Guest###, playerId null, stable temporary guest identity and Goblin fallback. All four flows plus Guest test PASS. Isolated test Registry only; no real account/career data touched.

Before/after diagnosis: workspace outputs/post-phase2-batch2/name-repro.mjs and name-stale-repro.mjs. Focused browser test/evidence: name-check.mjs and name-results.json. Only runtime file changed is client-v13/lan.js; accompanying metadata: this report, tools/local-recovery-contract.json (previous compatible manifest c4c3148e2f97bde6211784ac2649ed440ab4f047ae3a90f152412e13c24bf46b), build-manifest.json and root CURRENT-STATE.md/HANDOFF.md. Full music controller, assets, canonical gameplay, statistics, Registry server and REJOIN modules verified unchanged by hashes against the previous manifest. Final normal verification follows metadata update.

Stop for physical retest using current PLAYTEST-LAN.cmd: logged in → Online → Display Name → Create Duel/Group. No commit, push, promotion or deployment; no mixer/settings work.

---

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
