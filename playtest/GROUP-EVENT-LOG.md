# Group Event Log — post-phase2-batch1

UNACCEPTED / UNPROMOTED. Based on Registry Phase 2 commit 0d2c6b35f9b39692e65f1a2c8be61b927a686055.

Group (3/4-player) special activations now use ordered named narrative: for example “Your Goblins attack Guest124.” and “Guest124's Wizard attacks VondurDEV.” Ordinary shot/hit/miss prose is unchanged. The feed covers executed Wizard, Dragon, Demon, Goblin, Archer and Monk attacks and Catapult launches. It is not a dump of ordinary contacts, private decisions or queued benefits.

The server projects only public activation type and authoritative owner/target seat IDs, with current display names resolved separately. It does not copy unit IDs, coordinates, impact results, planned cells, counts derived from unseen boards, RNG or decision data. The activation itself discloses the special type; unrelated hit units remain unidentified where required. The bounded recent feed is rebuilt from existing authoritative history on recovery, and incrementally updated in live play without changing that history.

Eliminations are appended only at the authoritative settled elimination boundary. The actor is the recorded causal rootActorId, not the final damaging special owner. Unknown attribution produces “Player was eliminated.” No guessing from turn order or current target. Every observer, including eliminated players, uses the same narrative feed.

The shared Event Log renderer consumes this feed alongside the existing visible-board damage prose. Group activation wording replaces the legacy ambiguous two-sided activation line. The narrow “another enemy battlefield” Goblin log workaround is removed; its existing off-screen newsflash is retained independently. Off-screen geometry is never drawn on the wrong board. The old raw eliminated-observer log renderer is removed so it cannot overwrite narrative rows.

Runtime changes:
- server/group-narrative.mjs (new public projection)
- server/ring-pvp.mjs (Group snapshot integration)
- client-v13/battle-log.js (naming, ordering, deduplication and causal elimination text)
- client-v13/combat-feedback.js (eliminated observers consume global narrative)
- client-v13/group-lan.js (remove conflicting raw observer-log renderer)

Supporting changes: tools/group-narrative-check.mjs; tools/local-recovery-contract.json (reviewed accepted predecessor, engine unchanged); this report; build-manifest.json. No canonical engine, RNG, combat, targeting, Registry/statistics or battlefield styling changes.

Focused results:
- Real legal 3- and 4-seat service fixtures: Wizard → Goblin → further Wizards across at least 3 seats; every observer receives the same named routing events.
- Complete authoritative host/history/counters/RNG deep-equal to accepted Phase 2, both in-process and real worker paths.
- Causal elimination fixture: nested special owner differs from root originator; correct originator credited.
- Browser rendering with real service payloads and native animations: 3-player, 4-player and eliminated observer PASS; correct ordered lines, no old Goblin duplication, repeat delivery adds no rows.
- 13 focused contract checks: ordinary prose/Duel parity, allowed specials, separate Catapult launches versus bounce deduplication, unknown attribution, ignored hidden facts, mutable names/stable IDs, reconstruction and rematch reset.
- Hidden-coordinate/unit-ID/planned-target/RNG mutations do not change the narrative payload.

Run: PLAYTEST-LAN.cmd. Lightweight regression: node tools/group-narrative-check.mjs. Detailed service/browser evidence and harnesses are in the Codex workspace outputs/post-phase2-batch1/; no runtime-private files are packaged here.

Physical test: create a 3- or 4-player battle, enable Game Log if desired, and check a nested chain from multiple clients. Confirm named special routes on both visible and off-screen boards, ordinary prose, one Goblin announcement, and global elimination text. Check an eliminated player's Event Log too. Full physical LAN delivery/comprehension remains for user acceptance. No commit, push, promotion or deployment performed.

## Physical failure follow-up — 2026-09-20

Still UNACCEPTED / UNPROMOTED. No authority, combat, RNG, persistence or reconnect-validation code changed.

The live port-3212 /health build was a4c2d46d53d0cd8332a56866351569dfedc4ee256728e580827398effb8ca2a7 (accepted Phase 2), and its served battle-log.js contained the old off-screen wording and no groupNarrative consumer. The raw eliminated-observer renderer was therefore still running. It is absent from this branch. The physical test did not exercise the new Group Event Log build.

There was nevertheless a genuine existing Demon playback bug. Group projection filters rune reservations to the two visible boards, then numbers that filtered array from 1. The renderer retained a room-wide consumed sequence. In the physical match, the observer consumed opponent reservation 1 and own reservation 2. After the opponent was eliminated, a new target's reservation was renumbered 2. The renderer could not find a sequence greater than 2 and threw Missing reserved Demon presentation. Its unfinished playback group remained pending; retries ran the old Event Log begin hook again, appending the same activation sentence. The error propagated through the existing client error/recovery path, explaining the misleading REJOIN prompt. Validation has not been suppressed.

Direct physical-state evidence: the saved match B1DBA6 was still available. Its four Demon roots (38, 442, 503, 587) each processed 29 cells and each has resolution-completed. Their new impacts were 28, 8, 8, 10 respectively; the remainder were already-shot repeat-ignored contacts. No Demon root was pending in the recovered checkpoint. Thus the reportedly absent attack was present authoritatively, despite broken playback. Read-only extraction left the running server/save untouched; private host evidence stays outside the distributed build.

Correction: server/demon-presentation.mjs binds each visible Demon cue to its exact existing reserved glyph/rotation array using private causal metadata. server/group-presentation.mjs attaches only that already-public decorative array to the visible cue. client-v13/combat-playback.js uses it directly instead of consuming the unstable filtered counter in Group mode. Duel's existing path remains unchanged. No private IDs, archive counters, unseen targets or RNG are added to the public cue. Lookup is cached per activation within a command; ordinary shots do not scan Demon history.

Focused verification:
- Native browser reproduction using the physical reservation sequence: old code throws Missing reserved Demon presentation and repeats the legacy activation line; corrected code completes all three sequences, emits three distinct named activations, and repeated final delivery adds no rows.
- Real 2 Human + 2 AI service, real workers: Demon -> Human Hero decision -> Wizard -> Archer/Wizard -> Dragon/Archer/Goblin. Disconnect at the unresolved decision, write/read a room snapshot, restore and REJOIN, then answer the same decisions. Complete authoritative host (including history, pending state, counters and RNG) deep-equals uninterrupted execution and accepted Phase 2; reserved presentation memory also deep-equals. Demon executes 29 contacts, once.
- Additional real 4-seat Demon -> Wizard -> Demon -> Wizard chain: complete host/RNG parity with accepted Phase 2; all visible Demon cues carry their correct reserved data.
- Existing 3/4-seat narrative, root-attributed elimination, privacy, ordinary/Duel prose and active/eliminated browser tests remain passing.
- Portable focused checks: node tools/group-narrative-check.mjs and node tools/demon-presentation-check.mjs.

Runtime files added/changed in this follow-up only: server/demon-presentation.mjs, server/group-presentation.mjs, client-v13/combat-playback.js. Supporting files: tools/demon-presentation-check.mjs, this report, build-manifest.json and root handoff/current-state metadata. The original five Group narrative runtime changes above remain in the branch.

Retest the exact Git working-tree launcher C:/Users/Notandi/Documents/GitHub/Stone-Throw/playtest/PLAYTEST-LAN.cmd. Close the old playtest console first if you want port 3212; otherwise the launcher prints a different free port, which BOTH devices must use. Do not relaunch the old outputs/registry-phase2/candidate launcher. Preserve old saved data. Test a Demon after target elimination, a nested special plus decision/rejoin, and an eliminated observer's Event Log. Await physical acceptance; no commit/push/promotion/deployment.
