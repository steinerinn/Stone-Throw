# Two targeted fixes — UNACCEPTED / UNPROMOTED

Scout root cause: server/ring-pvp.mjs built scoutFootprints by unioning the scouted cells from every actor for a board. Although the main knowledge view was already observer/target scoped, this extra visual-footprint field reintroduced another player's observations after a target switch. It now reads only ring.knowledge[currentObserver + ':' + targetPlayer]. No scouting decision, knowledge mutation, attack, AI or RNG changed. Incoming observations belonging to another player are no longer published as one's own Scout footprints either.

Plague music root cause: music.js used plagueCells.length, which describes historical painted marks and remains nonzero after an outbreak ends. A minimal public boolean, plagueActive, now describes an actually spreading outbreak on visible boards. The projection checks outbreak lifecycle/frontier state, not historical cells. It supports multiple outbreaks and an in-flight detached outbreak; terminal/cleared/contained/completed outbreaks do not keep sound active. It exposes no owner, coordinates, frontier, private RNG or other-board details. Group limits it to the observer's visible boards. Single Player/Story/Duel use their two visible boards.

Music uses that boolean for its existing Plague gate. Both ambience and intensity stop through the existing fade once no visible spread remains active; Eye of the Storm continues. Tracks, gains, intensity pulse behavior while active, fades and all other routing are unchanged. Hero contact/source elimination/target elimination/five-step gameplay rules are untouched. A scheduled, not-yet-spreading outbreak still begins ambience with its first actual infection, as before.

Runtime files changed:
- server/ring-pvp.mjs: observer-scoped footprints; visible-board Plague boolean.
- server/projection.mjs: shared Duel projection boolean.
- client-v13/music.js: boolean replaces historical-cell test.
- canonical/shared/local-host/plague-presentation.ts (new pure public projection helper).
- canonical/compiled/local-host/plague-presentation.js and .d.ts (generated).
- canonical/shared/local-host/authority.ts and canonical/compiled/local-host/authority.js: local public snapshot boolean only.
- canonical/shared/client-contract/public.ts and canonical/compiled/client-contract/public.d.ts: optional public boolean declaration.

Metadata: this report, SCOUT-PLAGUE-EVIDENCE.json, tools/local-recovery-contract.json compatible predecessor/digest, build-manifest.json; root CURRENT-STATE/HANDOFF updated. Projection-only canonical changes are listed above; combat/host lifecycle/RNG/AI and all audio/art assets remain byte-identical to the pre-fix manifest. Serialization schema is unchanged.

Verification PASS:
- TypeScript compilation.
- Actual four-Human worker-backed Group Scout activation, five answers, legitimate observer markers; actual elimination switches another player onto that board. No foreign footprint/scout metadata; original knowledge retained; read leaves host/RNG byte-identical. Repeated read also clean.
- Existing real Group Scout test: a subsequent public shot still removes both Scout marker paths.
- Real five-step Plague resolver: active after steps 1–4, inactive after step 5 despite retained impact history. Blocked frontier, multiple outbreaks, visible-board restriction, detached active frame and terminal checks pass.
- Desktop 1440px and phone-sized 390px browser: production renderer consumes actual Group public samples; discoverer markers present, other observer before/after target switch clean. Controlled public music updates with old trails retained stop both Plague files while battle music continues.
- Existing Plague continuation suite (22 scenarios, including Hero, source elimination, target elimination and recovery parity), 23 Batch 2 rule checks and seven music-controller checks pass.

Evidence: SCOUT-PLAGUE-EVIDENCE.json. Focused harnesses remain in workspace outputs/post-phase2-batch2/scout-private-check.mjs, plague-lifetime-check.mjs, scout-plague-browser.mjs. No broad audit or unrelated fixes.

Physical retest: in Group, let A Scout C, then eliminate the intervening board so B targets C. A's discoveries must not appear for B. Trigger Plague and listen through its five-step completion or genuine containment: the existing Plague layers should fade out while normal battle music continues, even though infected-cell marks remain. If another visible outbreak is still active, ambience remains. Startup splash/audio continuity and identity fixes remain in place.

No acceptance, commit, push, promotion or deployment.
