# Monk public deduction correction — Phase 2, UNACCEPTED

## Confirmed cause
The production disclosure adapter copied `CombatSeat.monkCandidates` directly into the client. That compatibility list mixes search/AI behavior with display history: it filters shot neighbours but restores the old list when a negative clue leaves one candidate; Scout results and public placement constraints do not consistently narrow it. This explains the impossible/no-touch and Scout EMPTY markers. The historical implementation is retained as a test oracle, not edited.

The production client already guarded ordinary shots by phase/active player, and the authoritative host rejects wrong-actor commands before applying them. The supplied still images do not establish a server-side out-of-turn probe. The reported click leak could not be reproduced against that existing guarded route; it is not claimed as a confirmed server exploit. The correction nevertheless enforces eligibility at both the capture-phase grid boundary and cell selection, before any handler can submit or alter a local selection. There is no Monk-specific probe action.

## Separation
- Combat/AI compatibility candidates, activation, deflections, targets, damage and RNG remain unchanged.
- `monk-clue` diagnostic metadata now records the public triggering attack cell rather than the attack source origin. This changes only clue evidence metadata; it does not move an attack or change its target/geometry.
- Public board knowledge stores proximity evidence derived from observed positive/negative Monk responses. It no longer copies the private compatibility candidate list on refresh.
- A pure public-only deduction module intersects/subtracts neighbourhood evidence and filters using the already-disclosed opponent cell observations. It accepts no host, hidden unit, private coordinate, private shot set or AI memory.
- Misses, public impacts, Scout EMPTY and occupied cells remove the cell. Publicly identified stationary units and unidentified multi-cell cores also exclude their no-touch neighbours. Public identification of the Monk removes question markers. Hidden geometry is never expanded. Hero observations conservatively do not create a no-touch ring because relocation can violate original spacing.
- Both local Single Player/Story authority and server Duel/Group projection call this same module after existing public disclosure/privacy masking. Group evidence is observer/target scoped. The renderer receives only final public candidate cells.
- Scout/shot updates, remount and serialization use the same projection. No polling, history rescans, new persistence format or journal is introduced.

## Input policy
Grid capture and selection both reject non-interactive phases, opponent turns, exhausted ordinary shots, outstanding requests/playback locks, and unrelated-board decisions. Legal Hero relocation, Catapult, Scout and Cleric inputs remain allowed. Mouse and touch-generated clicks use the same gates. No rejected click changes public evidence or tests the hidden Monk location. Existing obsolete shell helper text mentions legacy variable names, but those private board globals are not present in the production browser and no live candidate handler calls it; unrelated legacy cleanup is out of scope.

## Checks
`monk-candidates-check.mjs`: historical impossible/EMPTY reproductions; known/no-touch cells; actual Scout EMPTY and found-Monk decision lifecycle; ordinary miss and Monk-hit updates; paired hidden worlds; wrong-turn denial with byte-identical serialized host; persistence; Group pairing; exact Monk combat state and RNG across direct, Archer, Goblin and Monk-deflection paths.

`monk-browser-check.mjs`: real production shell/renderer with a counted test transport fed real server projections, desktop and phone-sized touch; every question marker clicked in enemy/guarded/finished/unrelated-decision phases; zero commands and unchanged DOM; paired entire public payload/DOM equivalence; remount; immediate Scout EMPTY marker removal; legal four decision types and ordinary shot routing. This is an instrumented renderer integration check, not a claim of physical LAN testing.

Inherited statistics/chain/combat parity, Registry multiplayer, Game Log and Plague checks are recorded in sibling evidence. The physically passed Biggest Chain implementation is unchanged. Journal remains disabled. No accepted checkpoint, Git branch or deployment is modified.

## Physical retest
1. Start normal PLAYTEST-LAN.cmd and play Single Player or LAN Duel/Group. Trigger a Monk near-miss. Candidates next to publicly identified stationary units should be absent.
2. During Scout, inspect a question-mark cell: EMPTY must remove it immediately. A revealed Monk must remove the remaining search questions.
3. During the opponent turn, repeatedly click/tap every visible question mark. No shot, marker removal or hidden-location-dependent response should occur. Repeat on a phone.
4. On your own legal turn, shooting a candidate is a normal authoritative shot. Confirm Monk deflection/duel behavior and subsequent clues remain normal.
5. Reload/rejoin after obtaining clues and verify the same candidates remain. Retest Hero, Catapult, Scout and Cleric choices normally.

Stop for physical testing. Do not accept/promote/commit/push/deploy.
