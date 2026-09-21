<!-- Physical acceptance below supersedes historical development/testing-pending wording. -->
# Avatar / Profile Phase 1

Status: ACCEPTED — user physical testing passed. Branch avatar-profile-phase1; direct accepted base b7ca2917303e91610c9512c68438e25b72c628e2. No commit, push, merge or deployment.

## Storage and authority
No schema version or table change. Existing accounts.avatar_id and accounts.avatar_unlocked columns are used, keyed by immutable account ID. Existing unset/empty/registered-default values receive the stable peasant-human-male-01 fallback; no other account fields are reset. Explicit existing selections remain untouched. New UI registration starts with that Peasant selected and permits any Peasant choice. Omitted avatarId remains compatible with older registration callers; explicit invalid/null IDs are rejected.

The avatar update endpoint accepts exactly avatarId, requires a valid account session, and saves immediately. There is no cooldown, cost or change limit. Profile data and future multiplayer identity read the same stored avatar ID. Guest identities do not become registered profile data.

Hero access is permanently latched when authoritative career wins across Single Player, Duel, 3 Players and 4 Players total at least five, OR the existing authoritative Story progress has finished=true. The All aggregate is excluded to prevent double-counting. Finalization invokes the latch inside the existing statistics transaction; Story completion invokes it inside its progress transaction. Account reads/profile selection also reconcile existing qualifying data. No new statistics system, metrics, score formula, historical backfill or client-authoritative unlock exists. Duplicate finalizations, unfinished matches, Guest/AI wins and ordinary Story statistics cannot grant wins. Unlock is never reset.

## Catalog and untouched assets
assets/avatars/catalog.mjs is the shared server/client catalog, including stable ID, asset path, category, race, sex/group, access class and SHA-256. Exactly 63 PNGs were copied byte-for-byte from the supplied OneDrive folder; runtime has no OneDrive dependency. All hashes were compared to source bytes. No generated, cropped, resized, recolored or otherwise edited artwork. Display uses CSS object-fit:contain; the original files are unchanged. The unnamed image, ZIP and non-required files were not copied.

| Access | Stable IDs | Source stems | Count |
| --- | --- | --- | --- |
| Peasant | peasant-human-male-01–05; peasant-human-female-01–05 | basic_male_01–05; basic_female_01–05 | 10 |
| Hero Human | hero-human-male-01–10; hero-human-female-01–10 | human_male_01–10; human_female_01–10 | 20 |
| Hero Dwarf | hero-dwarf-male-01–05; hero-dwarf-female-01–05 | dwarf_male_01–05; dwarf_female_01–05 | 10 |
| Hero Elf | hero-elf-male-01–05; hero-elf-female-01–05 | elf_male_01–05; elf_female_01–05 | 10 |
| Guest | guest-goblin-goblin-01–10 | goblin_01–10 | 10 |
| Special AI | ai-cruns; ai-snurk; ai-rackler | cruns_a; snurk_a; rackler_a | 3 |

Cruns/Snurk/Rackler A mappings are reserved through AI_AVATARS. No existing named-AI identity mapping was present to extend; no multiplayer UI or AI behavior was added. No B variants are used.

## Registration and Profile
Registration and Profile show a current-avatar control opening the same picker. Profile saves a choice immediately, independently of the profile form SAVE. Reopening Profile refreshes authoritative account data, including unlocks and changes made from another device.

Picker order: PEASANTS male/female rows; HEROS Human male two rows/female two rows; Dwarf male/female rows; Elf male/female rows. Exactly five slots per row on desktop and phone. Locked Heroes remain visible, desaturated, disabled, with the specified unlock message. Current selection has an outline and aria-pressed state. Goblins and special AI are absent from the registered picker. Server rejects all forbidden/unknown selections regardless of HTML state. Registration failure leaves no account/avatar record.

No avatar display was added to HOF, lobby, seats, battlefield, results or other gameplay UI. HOF visual design remains unchanged.

## Guests
New temporary Guest identity receives a random Goblin from the ten-entry pool using Node crypto randomness, never gameplay RNG. It is stored with existing guestId/name and durable temporary/rejoin state, not accounts or careers. Rendering/polling does not select again. Rejoin and server restart preserve it. Legacy guest-goblin-fallback identities are upgraded deterministically from their already-random immutable guestId, consistently for saved browser identity and room seat; no identity or credentials are replaced. Logging into an account selects the registered avatar, never the Guest Goblin. No Guest picker.

## Exact runtime changes
Modified:
- server/registry.mjs — reserved-field fallback, authoritative validation/storage, permanent unlock reconciliation.
- server/statistics-store.mjs — optional finalization callback, used for transactional unlock only; statistics calculations unchanged.
- server/main.mjs — catalog static allowlist/MIME, Guest pool and legacy placeholder compatibility.
- client-v13/registry.js — registration/Profile controls and fresh account reads.

Added:
- assets/avatars/catalog.mjs and 63 mapped PNGs.
- client-v13/avatar-picker.js.
- styles-avatars.css.

Verification/metadata: tools/avatar-check.mjs; tools/local-recovery-contract.json accepted-parent compatibility entry; AVATAR-PROFILE-REPORT.md; AVATAR-PROFILE-EVIDENCE.json; build-manifest.json; root CURRENT-STATE.md and HANDOFF.md. Previous accepted checkpoints and original assets remain unchanged.

## Verification
Isolated test accounts/databases only; no real/private Registry data used.
- Avatar server/storage test PASS: 63 source-byte checks; forbidden Hero/Goblin/three AI/unknown IDs denied at registration and update; failed registration atomic; 15 repeated changes; four wins locked/five wins unlocked across four modes; duplicate/unfinished/Guest/AI/Story win exclusions; Story completion path; restart, logout/login, independent accounts, multiple sessions and legacy fallback.
- Real Chromium browser PASS at 1440 and 390 pixels: actual registration, Profile immediate save, refresh, account switching, locked/unlocked picker, exact group order, five columns, no overflow, no page errors. Phone picker screenshot visually inspected.
- Real Guest service/browser flow PASS: no picker, stable repeated identity, create/join/leave/Rejoin, server restart, account switch and legacy fallback upgrade. checkpoint.journal remains absent.
- Inherited focused HOF read-model suite PASS.
- Inherited desktop/phone HOF/audio browser suite PASS.
- Inherited live finalization/account/Story exclusion/Rejoin/rematch suite PASS.
- Music checks 7/7 PASS; statistics reliability checks 8/8 PASS.
- Portable server regression: node tools/avatar-check.mjs (writes isolated temporary database outside served tree). Optional ST_AVATAR_SOURCE enables source-folder byte comparison.

Browser automation uses Chromium and a phone-sized viewport; physical phone/PC use and other browser engines remain user verification. Guest and AI avatars are intentionally identity-only now; there is no visible gameplay avatar test until the later Multiplayer UI phase.

## Physical test
1. Run PLAYTEST.cmd or PLAYTEST-LAN.cmd normally. Register a new test account, open Choose avatar, select a Peasant and register.
2. Open Profile and click the avatar. Confirm all groups and five columns; Heroes greyed out below five wins/uncompleted Story; no Goblin/AI options.
3. Change Peasants several times. Close Profile without pressing its general SAVE; reopen, refresh, log out/in and confirm the chosen avatar persists.
4. Log into the same account on another device and open Profile; then switch accounts and confirm independent selection.
5. With an account having completed Story or five finalized career wins, open Profile and select a Hero. Peasants remain available. This feature does not need unrelated combat retesting.
6. Guest SKIP remains available without an avatar picker. Guest Goblin identity is established for future UI and was tested through Rejoin automatically.

Stop for physical testing. HOF polish, Multiplayer UI avatars and all unrelated work remain deferred.

## Pre-checkpoint recovery warning correction

The production bootstrap previously manufactured a local-recovery-unavailable alert merely because startup retained a pending old recovery reference. That stale/default status is no longer announced on a successfully loaded Main Menu. An actual local-session-in-use startup error and all explicit resume errors still reach the existing error UI. No recovery request, pending flag, fallback, save, host, RNG, mode or Online/Rejoin logic changed. Only runtime file changed: client-v13/bootstrap-production.js.

Focused phone-sized real-service regression PASS: no stale startup notice; explicit blocked-resume error visible; Online create usable; local retry after recovery becomes available restores exact saved host; restart retains reference; original checkpoint unchanged; journal absent. Avatar server checks and desktop/phone browser checks rerun PASS. Historical tests expecting the old warning were preserved; new regression is outputs/avatar-profile-phase1/recovery-warning-check.mjs in the development workspace. Candidate remains UNACCEPTED / UNPROMOTED.

## Final physical acceptance

User accepted Avatar/Profile Phase 1 and the targeted recovery-warning cleanup. Registration/Peasant restrictions, locked Heroes, Profile/unlimited changes, persistence, Story/five-win unlocks, Guest identity and special AI A mappings PASS. HOF/statistics/rematch/audio remain working. Stale Main Menu warning is physically gone; actionable errors and saved-battle/recovery semantics preserved. No runtime changes during acceptance. No merge/deployment or next-phase work. Git records the acceptance commit/publication.
