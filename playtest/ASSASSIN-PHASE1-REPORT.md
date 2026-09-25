# Assassin candidate — UNACCEPTED / UNPROMOTED

Implemented on pacing-chaos-scout-phase1. No commit, push, merge or deployment.

## Rules
One 1x1 Assassin per full-game roster. It may occupy any empty in-bounds cell, including cells next to other units. No new Story unlock chapter was introduced; the full-game roster also used by the existing final Story battle includes it.

A non-Plague hit queues its response in the same causal resolution. After existing frames, reactions and decisions settle, skip it if the original attacker has no surviving core. Otherwise select uniformly among the owner's living, unhit Demon/Dragon/Wizard/Goblin units with canonical RNG. Apply a real hit to that unit, including marker/damage, and run its unchanged reaction against its normal reaction target. After that chain settles, recheck the original attacker and choose uniformly among their remaining unhit core cells. Dormant Hero is excluded; activated Hero and resurrected core cells are eligible. With no eligible chain unit, select up to three distinct valid unshot cells; use spacing evidence, not secret occupancy, to exclude impossible cells. Plague grants no response. Existing Cleric candidate taxonomy excludes Assassin.

Deferred work is serialized, stays in the original root/action, and contributes to the same chain statistics. No extra ordinary shot is charged. Synthetic activation does not receive an enemy-kill Score bonus for destroying an owned unit. Existing special-hit penalty/ability-kill taxonomy includes Assassin without changing Score formulas.

Unrestricted Assassin placement means an unhit Assassin may occupy spacing gaps. Aim-assist therefore does not mark those gaps ruled out while it remains; a destroyed Assassin itself creates no spacing exclusion.

## Presentation
The replacement assassin2.png was copied byte-for-byte to the existing runtime assassin.png path. Grey special-unit background, icon appended after Dragon. The extra slot is out of flow: left existing icons shift exactly 22 pixels left, right existing icons stay fixed, map bounds are unchanged. Primary and secondary bars use this arrangement. Actual impact flashes and narrative use Assassin identity; selected chain units retain their usual effects and animations.

## Runtime files (this addition)
- canonical/shared/model.ts, schema.ts, invariants.ts, client-contract/public.ts
- canonical/shared/host/initialization.ts, host/refresh.ts
- canonical/shared/policy/placement-legacy.ts
- canonical/shared/combat/contracts.ts, impact.ts, resolver.ts, serialization.ts, units/assassin.ts
- canonical/shared/local-host/animation-cue.ts, resurrection-disclosure.ts
- generated canonical/compiled counterparts
- client-v13/presentation.js, overview-board.js, placement-feedback.js, shell.js, story-policy.js, battle-log.js, combat-playback.js
- server/main.mjs, group-narrative.mjs, match-score.mjs, score-tactics.mjs
- styles-22.css
- assets/units/assassin/assassin.png

## Verification
- assassin-check.mjs: 28 deterministic groups, 2P/3P/4P, all four activation types, canonical random selection, original and secondary-chain elimination, duplicate contact, Plague, no resurrection, dormant/active Hero, revived Cavalry, fallback spacing, random placement, serialization after every resolver step.
- assassin-group-check.mjs: four service integrations, local/Online state and RNG equality, 3P/4P, worker off/on, public Assassin cue and disclosure, restore.
- assassin-browser-check.mjs: four browser groups at 1440px/390px; exact strip offsets, unchanged map bounds, real palette placement adjacent to Infantry, sprite served and grey background. Screenshots outside Git in C:/Users/Notandi/Documents/Codex/assassin-evidence.
- deployment-placement-check.mjs: 240 checks, historical roster/RNG parity and canonical partial completion for historical/new rosters.
- Existing pacing canonical 71; pacing group 10; pacing browser 8; Monk pair 15; Monk retaliation 16; Archer/Catapult eight worker/format paths and 66 source cases; Score tactics 41; Match Score 79; Result Score all six HTTP/UI paths with reopen; replay 34; Story Scout 8 plus browser; Story causal 5: PASS.

Physical retest: start a fresh full game on this checkout; trigger Assassin in a multi-player chain and inspect selected unit marker/normal-target playback followed by the original-attacker strike. All screenshots, test databases and logs remain outside Git. checkpoint.journal remains disabled. No private Registry writes.

## Placement follow-up
Assassin spacing exemption now works in both placement orders. Other units may touch Assassin but cannot overlap it. Canonical Infantry/Cavalry/Castle cases PASS; desktop/narrow browser reverse-order placement PASS. Shared optional spacing exemption leaves historical rules unchanged. Assassin checks: 31; placement checks: 240; Group parity checks: 4.

## Assassin AI policy follow-up
Random placement now draws a 50/50 style: ordinary spacing or an empty orthogonally adjacent Castle cell. If unavailable, use the other style, then any empty cell as last resort. First-hit Hero bait policy includes Assassin using existing category probabilities/priority. Normal and Auto Match direct targeting exclude scouted Assassin cells, including Hero hunt/clue/fallback pools; no unscouted knowledge is granted and triggered attacks remain unchanged. Canonical checks: 38 PASS; historical/new placement: 240 PASS; local/Online worker parity: 4 PASS. No commit/push/merge/deploy.

## Hit marker follow-up
Assassin icon CSS suppressed its hit pseudo-element. Added the existing player-shot marker for Assassin hit cells without changing authority. Browser checks: 6 PASS at desktop/narrow widths, including absent-before/present-after hit marker. Physical log local-97f04d61: round 16 current seat 1 (Cruns), direct self impact 464, Assassin activation impact 465, Demon group 4, Assassin group 5, Archer group 6. Screenshot names Assassin target Cruns. Generic own Demon activation wording remains misleading; no authority change.

## Aim Assist follow-up
Removed the blanket Aim Assist suppression while an unhit Assassin exists. Normal-unit spacing shading remains active and clickable; Assassin locations are never subtracted using private state. Destroyed Assassin still creates no exclusion halo. Existing activated-Hero behavior unchanged. Canonical Assassin checks: 39 PASS; browser checks cover shaded cells remaining legal.
