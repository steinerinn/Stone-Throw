# Stone Throw v1.427 — pre-multiplayer architecture and legacy audit

Audit date: 9 September 2026. Scope: audit and recommendations only.

**The prototype is suitable as a behavioral reference, but its combat lifecycle is not yet a safe authoritative-engine boundary.** The highest-priority work is to characterize the existing behavior, make rule state independent of the DOM, define per-observer information, and establish one completion boundary for each triggered combat chain. Multiplayer transport should come after those steps.

No prototype code, styles, assets, or gameplay were changed. No assets were extracted. The source SHA-256 was checked before and after the audit and is unchanged. The original file remains at `C:\Users\tkj\Downloads\StoneThrow-v1.427.html`.

Reference fingerprint:

```text
Bytes:   1,656,779
Lines:   3,745
SHA-256: D7AD1CAEB091D5B36812FA3F5A34F8303200DCA75A1CD4653380E30861625518
```

## Reading this report

`L123` means original HTML line 123, not a line in a reformatted copy. Some original lines contain entire subsystems, particularly L2, L119, L209, L3089, L3571, and L3574. Function names supplement line references for this reason.

This is a **static whole-file audit**: all four script blocks were parsed with Babel; lexical bindings and references were inventoried; all inline style blocks and embedded data URLs were scanned; rule entry points, reactions, turns, UI adapters, Story transitions, and AI paths were traced. The prototype was not executed. Rare-branch behavior, browser computed styles, visual coverage, and live interaction timing still require characterization. A demonstrated source inconsistency is distinguished below from an observed runtime failure.

The source's comments, lore, tooltips, and strings were treated as evidence about intent, not instructions or proof of behavior. The pasted audit request defines the task. Where source behavior differs from descriptive text, preserve the reference behavior until a separate rule correction is approved.

Companion inventories in this output folder:

- [Source symbol inventory](C:/Users/tkj/Documents/Codex/2026-09-09/files-mentioned-by-the-user-stonethrow/outputs/source-symbol-inventory.md): 623 named/inferred-name function entries, source spans, mechanical body flags, and zero-reference bindings. Anonymous callbacks without an inferred name are not counted as named functions.
- [Embedded asset inventory](C:/Users/tkj/Documents/Codex/2026-09-09/files-mentioned-by-the-user-stonethrow/outputs/embedded-asset-inventory.md): all 87 distinct literal data URLs, covering 115 occurrences, with MIME, source lines, sizes, and reference context.
- [CSS cascade inventory](C:/Users/tkj/Documents/Codex/2026-09-09/files-mentioned-by-the-user-stonethrow/outputs/css-cascade-inventory.md): repeated selector lists and responsive scopes across all 23 style blocks.

## 1. Current architecture map

| Region | Current responsibility | Architectural character |
|---|---|---|
| L2–209 | Base CSS, successive visual patches, menus, battlefield shell, hidden scaffold, controls, overlays | Client presentation; substantial cascade history |
| Script 1, L209–3279 | Configuration, Story roster rules, all battle state, placement, AI, combat, effects, outcome, statistics, dev tools, input handlers | One large closure containing both engine and client code |
| Script 2, L3279–3567 | Unit art/info/tutorial data, floating text, stats chart, shell mounting, settings, hover information, layout, polling | Presentation adapter over the first closure and DOM |
| Script 3, L3567–3741 | Main Menu, Story dialogue/art/history/lore, battle-transition dispatch, continuation and final completion | Campaign orchestration mixed with presentation and persistence |
| Script 4, L3741–3745 | Loading-screen dismissal on load and timeout | Client-only startup presentation |

Most “globals” are closure-wide variables, not properties of `window`. Cross-closure integration uses many `window.__stoneThrow*` exports. This protects names from accidental global collision; it does **not** establish a module or network security boundary.

The visible shell mounts the original grids and unit strips out of `#engineScaffold` (`initStoneThrowShell`, L3321–3338). It proxies original controls and reads a `__stoneThrowViewState` bridge (L3248–3266), but also reads hidden controls and status DOM. `MutationObserver` plus 500 ms polling keeps the shell synchronized (L3563–3564). A separate 250 ms loop removes residual Archer text (L3565–3566).

Conceptually, current execution is:

```text
DOM input / AI driver
  -> closure state + DOM mutations
  -> direct hit handler or special attack
  -> reaction waves / immediate Monk interrupts / pending effects
  -> several possible outcome checks
  -> result overlay + Story flags
  -> shell observer / polling / exported callbacks
```

There is no standalone match object, serializable command queue, shared package, network protocol, or headless game engine. Auto Match still operates the live DOM-backed game.

## 2. Major global state inventory

Ownership below describes the eventual architecture. “Authoritative” means the server owns it in multiplayer; the shared engine can own the same state in an offline host.

| State family and important names | Location | Current meaning / duplication | Future owner |
|---|---|---|---|
| `SIZE`, all `*_COUNT`, `CASTLE_SIZE`, `ARCHER_WEIGHTS`, `PLAGUE_*`, base shots, `ELF_SPY_COUNT` | L211–217, 315 | Mutable player counts coexist with complete per-side rosters. Board dimensions also exist in CSS and DOM | Immutable match configuration / authoritative rules |
| `FULL_GAME_CONFIG`, `STORY_BATTLE_1_CONFIG`, `STORY_PHASE*_BASE`, `CURRENT_PLAYER_ROSTER`, `CURRENT_ENEMY_ROSTER` | L211–310 | Configuration templates and current roster copies | Shared scenario definitions; authoritative selected configuration |
| `playerUnits`, `enemyUnits`, `enemyInfKeys` | L346–354 | Occupied-cell Sets; player Infantry is often inferred by excluding every other type, enemy Infantry has an explicit Set | Authoritative units/occupancy index |
| `cavMap`, `cellToCav`, `enemyCavMap`, `enemyCellToCav`, ID sequences | L350–354 | Player Cavalry stores anchor/orientation; enemy additionally stores cells. Reverse indices require synchronized edits | Authoritative unit geometry; derived indices |
| `playerCastles`, `enemyCastles`, Castle ID sequences | L347–356 | Maps of linked-cell Sets, completion flags | Authoritative geometry and placement completion |
| Archer/Catapult/Necromancer key arrays; single keys such as `monkKey`, `dwarfKey`, `clericKey`, `heroKey` and enemy equivalents | L349–356 | Mixed support for multiple units and one unit per type | Authoritative collection of unit instances, all with stable IDs |
| `playerShots`, `enemyShots`, `playerHits`, `enemyHits` | L347 | Shot Sets also encode damage, repeat-shot eligibility, and death; resurrection deletes entries. Direct-hit counters are not total special damage | Separate authoritative damage/impact history; derived metrics |
| `phase`, `playerShotsLeft`, `playerNextShots`, `enemyNextShots`, local `shots` in `enemyTurn`, `roundNumber`, `roundStarter` | L346–358, 2776–2822 | Turn ownership is partly inferred from player shot count; gameplay phases include UI decisions | Authoritative turn/action state; explicit active player |
| `chainResolving`, `resolutionDepth`, `chainQueue`, `pendingHeroRelocations` | L356, 360 | Actual wave queues are usually local; `chainQueue` is only cleared, not the working resolver queue | Authoritative resolution context |
| `pendingPlayer/EnemyDwarfNow`, `pendingPlayer/EnemyCatapultNow`, `player/EnemyCatapultPending`, `enemyCurrentTurnChainBonus` | L360 | Same-turn versus later-turn benefits represented by different counters | Authoritative scheduled effects with timing |
| `pendingPlayer/EnemyElfNow`, `player/EnemySpyPending`, `playerSpyRemaining` | L360 | Boolean and numeric representations of pending scouting | Authoritative effects / pending choice |
| `pendingPlayer/EnemyClericNow`, `pendingPlayer/EnemyClericPlagueReleaseNow`, resurrection pending flags | L359–360 | Resurrection and release-of-held-Plague are independently scheduled | Authoritative effects with explicit ordering |
| `player/EnemyArcherAbilityUsed`, `player/EnemyMonkAbilitySpent` | L349–360 | Ability lifecycle persists independently of shot history; relevant after resurrection | Authoritative unit state |
| Hero keys, original keys, activation flags, hit counts, relocation allowed/candidate/previous phase | L356 | Current identity, past location, phase, and UI confirmation all intertwined | Hero lifecycle authoritative; tentative cursor candidate client-only |
| `playerPlaguePending`, `enemyPlaguePending` | L356, 2331–2340 | Target-indexed outbreak structures: origin, turn metadata, frontier, infected Set, round, stats | Authoritative outbreak state |
| `player/EnemyPlagueKilledCoreCells` | L359 | Resurrection exclusion history; cannot be replaced by visual trail alone | Authoritative death cause / eligibility |
| Resurrection search flags, suspect Sets, suspect-unit arrays, `player/EnemyResurrectedUnit`, `playerResurrectionChoices` | L359 | Real revived unit and observer uncertainty coexist. Choice Map is also used by UI | Real identity authoritative/private; observer beliefs separately projected |
| `playerScoutedEnemyCells`, `enemyScoutedPlayerCells`, `enemyScoutKnowledge`, `enemyKnownHits` | L360, 371 | Player's knowledge is partly represented by DOM; enemy gets explicit knowledge structures | Authoritative disclosure facts; permitted client knowledge cache |
| Monk candidate Sets, `enemyHeroHuntCandidates`, `enemyCastleKnownHits`, `enemyCastleCatapultReveals`, `autoMatchBrains` | L356–375 | Overlapping AI/observation memories | Per-observer knowledge and AI memory, never unrestricted opposing state |
| `monkDuelActive`, `monkDuelHasHappened`, `monkFightPopupShown` | L360–371 | Duel rules and presentation-history flags overlap | Duel context authoritative; announcement history client-only |
| `infRemain`, `cavRemain`, other `*Remain`; `activeCastleId`, `castleEditSnapshot`, `castlePlacementWasNew` | L347–349 | Placement inventory duplicates placed-unit counts; editable Castle is temporarily incomplete | Server validates final placement; client draft/edit transaction |
| `activeTool`, strip selection/cursor/image/color, `hoverOrient`, `hoverKey`, `draggingFrom`, `cavDrag`, `infDrag`, `castleDrag`, `suppressCastleClick` | L360–371 | Interaction state; dragging temporarily removes units from occupied-cell Sets | Client-only draft/preview state |
| `playerCombatInputLockDepth`, `enemyTurnTimer`, `enemyTurnInProgress`, `battleAsyncEpoch`, Promise resolvers | L319–343, 356–360 | Browser concurrency, cancellation, input blocking | Client scheduler separated from authoritative action serialization |
| `battleStats`, `battleEventAttack`, `battleEvent*` merge counters, row Maps and announcement flags | L1202–1332 | Statistics, structured-ish attack summaries, and actual DOM row handles | Rule events/approved stats authoritative; prose and row handles client-only |
| `gameStartTime`, `gameElapsedMs` | L358 | Wall-clock display duration, not a turn authority | Client display; server timestamps if required |
| `SOUND_ON`, `audioCtx`, `POPUPS_ON`, tutorial preferences/open/resolver/type, `tutorialShownThisBattle`, `aimAssistOn` | L316–346 | Presentation preferences plus awaited tutorial flow | Client-only |
| `player/EnemyPlagueVisualCells`, visual timers, `stSalesBlastTimers`, floating-text state, DOM references | L358, 2181 onward, 3301 onward | Retained presentation memory and effects | Client-only derived from permitted events |
| Story mode/result/battle flags, Cleric unlock flags, suspended Story record | L217–232 | Campaign rules, current scenario and continuation | Campaign service/model, separate from match rules |
| `storyPhase4*`, `storyPhase5OpeningBattle`, `storyPhase6*`, `storyFinalBattle`, next-action callbacks, `storyLiveResumeAvailable` | L3571–3689 | Branch-dependent campaign position mixed with dialogue closures | Serializable campaign state; callbacks stay client-only |
| `AUTO_MATCH_MODE`, `STORY_AUTO_RESOLVE_MODE`, `autoMatchRunning`, outcome/starter, dev reveal/takeover/manual-shot state | L317–344, 2599 onward | Test driver state modifies live execution | Dev-only tools / AI driver |
| `storyState`, `STORY_UNLOCK_ORDER`, `STORY_START_UNITS`, old Story DOM handles | L2907–3064 | Separate legacy narrative/test model | Candidate legacy island; see section 9 |

**Important duplication:** occupancy, unit-type keys, multi-cell maps, damage Sets, DOM classes, palette counts, and strip pips must agree. `refreshCavalryCombatState`, `refreshCastleCombatState`, `tutorialRevealed`, event labels, and hover code read some of those representations differently. `startBtn.disabled` is both UI state and the shell's readiness source (L3546). Result continuation reads button `dataset` fields (L3184–3187) in addition to Story result variables.

Do not serialize this closure wholesale. It contains hidden enemy data, DOM nodes, Maps/Sets, timers, AudioContext, callbacks, and pending Promise resolvers.

## 3. Gameplay-system map

### Placement and board rules

`key`, `parseKey`, `inBounds`, `neighbors8` (L371), `neighbors4` (L506–509), `ring3x3CellsOf`, `cavCellsAt`, conflict checks, `canPlaceInf`, and `canPlaceCav` (L642–649) define basic geometry. Separate units normally cannot touch, including diagonally. Cavalry occupies two orthogonal cells. Castle placement uses five orthogonally connected cells and maintains separation from other units (`castleCellsConnected`, `validCastleExpansionCells`, L582–641).

Manual placement lives in `placeInf` through `placeNecro` and `placeCav` (L858–871), Castle-specific editing/movement (L529–641), and the drag/rotation/removal handlers (L652–664, 872–890, 3090–3128, 3191–3246). `checkReady` uses remaining counts plus complete Castles, not a fresh independent validation of the entire board.

Random placement is duplicated for player/enemy and Story/Full Game (`placeEnemyStoryCoreRoster`, `placeEnemyRandom`, `randomPlayerStoryCoreRoster`, `randomPlayerPlacement`, L891–1174; exact spans in symbol inventory). Archer interior placement, Monk central preference, Cleric distance, and near-Monk placement heuristics must be classified as **AI deployment policy**, not silently imposed as human placement legality. Manual `placeArcher`, for example, only uses the common single-cell placement validator.

### Unit-by-unit rules

All units also participate in placement, strips, lore/tutorial data, side lookup, direct-shot dispatch, and reset. The table maps the specialized rule locations rather than repeating those common dependencies.

| Unit | Current rule behavior | Principal rule locations / boundaries |
|---|---|---|
| Infantry | One-cell core, destroyed by a hit; eligible for Cleric resurrection except intended Plague exclusion | `placeInf` L858; player Infantry inferred by exclusions; direct handlers L2776–2822/L3129–3181; living-core L2500–2523; resurrection L1474–1481. **Type-alias defect risk below** |
| Cavalry | Two-cell core; both cells required for normal destruction. Resurrected Cavalry is killed upon discovery by one subsequent hit, marking its other cell too | Geometry L643/649; placement L871–877; `refreshCavalryCombatState` L1417 onward; resurrection L1500–1528; living-core L2508–2520 |
| Archer | One-cell core; once-per-ability lifecycle retaliation of 0–9 arrows. Weighted roll; targets picked in expanding rings around corresponding origin on opposing board. Nested reactions and Monk interrupts; Plague suppresses retaliation | `ARCHER_WEIGHTS` L211; `rollArcherShots` L1973; `resolveArcherUnit` L1987–2030; direct handlers; `resolvePlagueCell` L2403–2451. Ability-used Sets are not reset by resurrection |
| Monk | One-cell core; nearby qualifying impacts produce random opposing-board deflection and clues. Certain attacks can cause immediate nested deflections and a duel. Death spends ability; revived Monk remains spent | L469–508; `resolveImmediateMonkInterrupt`/`runMonkInterruptChain` L2031–2044; `resolveMonkDeflect` L2109–2134; resurrection L1531/L1553; Plague L2426 |
| Castle | Five connected cells; all must be hit. Stops Catapult on first wall impact. Partial hits/scouting initially conceal identity/shape; selected known portions are revealed | Placement L529–641; `castleDestroyed`/`refreshCastleCombatState` L1774–1816; Catapult L2225–2242; known-hit targeting L2658–2688. Not in resurrection candidate lists |
| Dwarf | Special; grants owner +5 ordinary shots, same-turn or next-turn depending on chain ownership. Direct-hit branches assign next shots to 7; other paths add 5 | L2007/2016–2018, 2091–2094, 2307–2310, 2533–2542, 2808–2809, 3166–3167. Plague kills without bonus |
| Catapult | Special; hit schedules rolling attack, up to five successive unshot cells; stops on Castle or lack of continuation. Human and AI roll continuation policies differ | `resolveCatapultRoll`/`resolveCatapultShotsForSide` L2225–2253; target helpers L2137–2179; pending/turn handling L2534–2542, 2555–2556, 2778–2779. Archer next-turn branch differs at L2019–2021 |
| Elf | Special; owner scouts five unshot/unscouted enemy cells. Same-turn or next-turn scheduling; observation reveals unit information with special handling for incomplete multi-cell units | L1452–1473; `beginPlayerSpyPhase` L2550–2553; `continuePlayerTurnSpecialPhases` L1558–1563; direct input L3134–3137; AI scout L457–464. Plague suppresses ability |
| Goblin | Special; random unique bomb targets selected from unshot cells. Count is `min(available, max(5, ceil(available*0.044)))`, not a fixed 5–10 constant for arbitrary board sizes | `resolveGoblinUnit` L2254–2263; shared hit resolution L2045–2108; wave ordering L2549. Goblins run last within each reaction wave. Plague suppresses bombs |
| Necromancer | Special; once all fielded Necromancers are hit, opposing Plague can be scheduled. A living opposing Cleric holds it back. Plague may itself hit Necromancers and release further effects | `necrosHit`, `handleNecroHit`, `schedulePlagueFromNecros`, `maybeReleaseHeldPlague` L2327–2365; L2447–2448. Threshold uses roster count, although prose often says “two” |
| Cleric | Special; living Cleric suppresses opposing Necromancers' Plague. Death schedules one eligible core resurrection and can release held Plague. Eligible types: Infantry, Cavalry, Archer, Monk; not Castle or Hero | Candidate and resurrection routines L1474–1557; `clericDead` L2327; release L2359–2365; same-turn handling L2528–2546. Player choice and enemy random choice follow different paths |
| Dragon | Special; retaliates along two diagonals on opposing board, using its origin coordinate. Flight path controls impact order. Plague invokes retaliation rather than suppressing it | `dragonFlightPathsFrom` L1568–1575; `resolveDragonUnit` L2272–2280; Plague L2441–2447. Preserve diagonal/path order and clipping |
| Demon | Special; retaliates across row and column on opposing board. Separate pattern enumeration and presentation order | `demonPatternFrom` L1564–1567; `resolveDemonUnit` L2264–2271; Plague L2435–2441. Deferred floating callouts do not define damage timing |
| Wizard | Special; meteor with layered, board-clipped footprint and its own damage dispatcher. Shape depends on board size | `wizardBlastLayersFrom` L1714–1771; `resolveWizardUnit` L2281–2326. It is not simply a universal 5×5 square. Plague suppresses retaliation |
| Hero | Initially optional special; first hit activates core status and relocation, then +1 ordinary shot on subsequent turns while alive. Second hit permits adjacent escape; trapped Hero dies; third hit kills. Plague kills immediately | `legalHeroRelocation`, helpers, death/movement L1830–1914; relocation queue L1915–1940; `registerHeroHit` L1943–1962; direct player confirmation L3090–3096; turn bonuses L2555/L2780; Plague L2419–2425 |

`ARCHER_WEIGHTS=[5,15,40,15,7,6,5,4,2,1]` sums to 100 and corresponds to 0 through 9 arrows. Do not replace it with a uniform roll. The Wizard footprint has maximum unclipped sizes of 5 cells for boards up to 5, 13 for boards up to 10, and 21 for boards up to 15; the larger-board fallback uses 45 cells. Each layer is clipped to board bounds (L1714–1771). Likewise preserve the Goblin count formula, random-call order, nested interrupt timing, and the size-specific Wizard pattern.

### Shots, turns, and outcomes

The base allowance is two shots. Human direct misses consume one; successful direct hits retain the shot. Enemy code achieves the corresponding effect by incrementing on hit and decrementing after each attempt. Wrong resurrection probes consume a shot. Chain impacts do not automatically earn ordinary direct-hit bonuses: special benefits are explicitly scheduled.

The main entry points are `onEnemyGridLeft` (L3129–3181), `enemyTurn` (L2776–2822), `autoResolvePlayerTurn` (L2772–2775), and `startPlayPhase`/`beginPlayerTurn` (L2830–2834, L2554–2557). Round advancement depends on the original starter. `scheduleEnemyTurn` uses a browser timer guarded by `battleAsyncEpoch` (L343).

Core elimination currently means no living Infantry, Cavalry, Archer, Monk, Castle, or activated Hero. A real resurrected unit keeps its side alive while the resurrection search is active. `requiredCoreUnitCount` excludes Hero, while living-core functions explicitly add activated Hero semantics. Special units remaining alone do not prevent defeat. `resolveEndAfterChain` checks both sides before choosing draw/player/enemy (L2547); `finishCoreVictory` sets `phase='over'`, invalidates async work, and displays the result (L1438–1439).

### Combat-chain invariant: current implementation

`runChainReaction` (L2548–2549) is the main mechanism:

1. Capture battle epoch; acquire input lock; increment resolution depth.
2. Process a `currentWave`, collecting `nextWave`. Non-Goblin entries precede Goblins within each wave.
3. Dispatch Monk, Goblin, Archer, Demon, Dragon, and Wizard resolvers.
4. Resolve pending Hero relocations after entries and again after the waves.
5. Resolve same-turn effect flags, which may launch Catapults, scouting, or resurrection.
6. Decrement depth; when outermost, conditionally check outcome. A side-selected `plagueWaiting` flag can postpone that check.

This is a meaningful foundation. However, it is **not one universal chain transaction**:

- Archer/Goblin/Monk proximity effects can recurse immediately through `runMonkInterruptChain` (L2031–2044), which does not itself increment resolution depth.
- Archer and Wizard each contain a separate hit dispatcher and effect scheduler rather than using `resolveChainCell` uniformly.
- Catapult gathers reactions into a local `generated` array, then calls `runChainReaction` separately for each (L2240–2242).
- Plague iterates outbreaks/frontiers/cells separately and can invoke `runChainReaction` inside `resolvePlagueCell` (L2449–2451).
- Human resurrection changes `phase` and returns; it is not awaited to completion like Hero relocation. Scouting also becomes an interactive phase.
- Direct handlers and Catapult handlers call `endIfOver`; its only deferral guard is chain flag/depth (L2657). It does not inspect every pending effect, choice, outbreak, or locally held reaction.

### Specific chain risks requiring characterization

| Finding | Source evidence | Why it matters |
|---|---|---|
| **Catapult sibling reactions can be cut short** | L2240–2242 runs each generated reaction as a separate chain; L2549 can finish after the first | On a top-level Catapult, a reaction that eliminates core units may terminate before later reactions generated by the same rolling attack. Input lock is not resolution depth |
| **Outcome check precedes due Plague** | Human path calls `endIfOver` at L3180 before `resolvePendingPlagueForTurn` at L3181; enemy loop checks at L2781 | A final core hit can finish before the turn-end Plague step, even if the requirement treats that due step as part of the pending chain |
| **Plague parent work is outside the depth guard** | L2452–2466 loops remaining outbreak work; nested reaction can finish in L2449–2450 | No single resolver scope demonstrably protects all remaining outbreak siblings. Side-indexed Plague flags sometimes delay outcome, but are not a complete completion test |
| **Pending player resurrection can lose the race** | L2536–2539 begins interactive resurrection, then caller can reach L2547 | `playerHasLivingCoreUnit` recognizes an already revived unit, not an outstanding selection. Auto control revives synchronously at L1543–1546, so fast/manual outcomes may differ in this branch |
| **Same-turn effects are not drained to a fixed point** | L2528–2546 processes flags in one ordered pass, with nested Catapult calls | Nested work may set a flag already passed; outer code has no general “no more due work” proof |
| **Hero queue can return early** | Death/trapped branches return from L1927/L1930/L1932/L1934 | Remaining entries can survive that pass. Later callers may drain again, but completion relies on caller knowledge |
| **First Hero relocation has no general no-destination resolution** | L1917–1923 | AI can return without moving; manual path can await a choice with no legal square. Contrast explicit trapped handling on second hit |
| **Cancellation protection is uneven** | Epoch checks throughout specialized attacks; direct human handler L3129–3181 lacks a captured epoch | Reset/menu/surrender during awaited interaction may leave stale direct-handler continuation. Needs targeted timing tests |

These are source-level risks, not claims that every listed case currently fails in normal play. None was fixed in this audit. Next-turn benefits are not automatically due now; tests must establish their current timing independently of the desired full-chain invariant.

### Pure logic versus mixed execution

**Good extraction candidates:** `key`, `parseKey`, `cavCellsAt`, `rotateCastleOffset`, connectivity, board-clipped pattern generation, neighborhood/ring calculations, counting/formatting helpers where appropriate. Geometry currently reading `SIZE` should accept board dimensions explicitly. Placement checks and unit lookup are mostly state readers but still close over mutable globals. Random selection is not deterministic pure logic until given an explicit RNG.

**Shared mechanisms worth extracting:** occupancy lookup; coordinate validation; multi-cell destruction; weighted choice/shuffle; effect timing; unit-death records; observation updates; resurrection eligibility; turn-budget arithmetic. Shared helpers should accept explicit state and return values/events rather than reach into grids.

**Keep specialized:** Archer ring selection and deferred volley reactions; Monk source-sensitive interrupts/duels; Castle shape and reveal behavior; Catapult rolling/stop behavior; Wizard layers; Dragon paths; Demon cross; Plague exclusions and growth; Hero lifecycle; resurrection mystery rules. Their sequencing is part of the game, not boilerplate to erase.

The following are separation hotspots. “Via calls” means the function invokes the effect through helpers; it does not necessarily contain the primitive operation itself.

| Function(s) | Rule calculation / mutation | DOM / animation / floating text / audio | Log and outcome |
|---|---|---|---|
| `onEnemyGridLeft`, `enemyTurn` | Legal phase, shots, hits, bonuses, specials, turns | Direct classes plus animations, callouts, sound, tutorials via calls | Direct hit log and multiple final-outcome paths |
| `resolveChainCell` | Repeat handling, damage, unit reactions, same-turn scheduling | Direct grid/class mutation, impact animation, callout, sound, tutorials | Attack records; parent decides outcome |
| `resolveArcherUnit`, `resolveWizardUnit` | Target geometry, hits, dedicated reaction dispatch | Projectile/blast waits, direct classes, floating text, sound | Attack log; parent decides outcome |
| `resolveCatapultRoll` | Path selection, stopping, damage, generated reactions | Rock animation, shake, grid effects via hit resolver | Attack log and final-outcome check |
| `resolvePlagueCell` / `resolvePlagueStep` | Infection, death, exclusions, spread, nested reactions | Trails, pulses, classes, callouts, sound via calls | Toll log; nested resolver can end game |
| `runChainReaction` | Wave ordering, depth, pending effects, final outcome | Indirectly orchestrates all presentation waits | Chain stats and result |
| `resolvePendingHeroRelocations`, `moveHeroTo`, `kill*Hero` | Relocation/death and knowledge | DOM, prompt/animation/callouts | Hero log; final outcome belongs to callers |
| `startEnemyResurrection`, `revivePlayerUnit` | Revived identity, shot deletion, suspects, ability status | DOM and roster rebuild; player callout | Resurrection log, but no direct victory check |
| `place*`, Castle edit/move, `checkReady` | Legality, inventory, occupancy, phase | Placement visuals, sound, readiness button | No combat victory check; still engine/UI mixed |
| `finishCoreVictory` / `showResultOverlay` | Terminal state, cancellation, Story result flags | Result DOM, artwork, focus, sound | Outcome log and campaign continuation data |

Do not claim every function performs every category. The direct-shot drivers are the broadest combined examples; specialized handlers divide outcome responsibility unevenly among themselves and their callers.

## 4. UI-system map

| System | Source anchors | Future treatment |
|---|---|---|
| Battlefield grids/headers | L650–668, `initStoneThrowShell` L3321–3338 | Render permitted board projections, with no rule ownership |
| Multi-cell/unit rendering | `refreshCavalryCombatState` L1417; `refreshCastleCombatState` L1780; Castle art L511–528 | Engine supplies permitted identity/shape facts; client draws them |
| Unit strips and hidden palettes | `unitStripOrder`, `stripRemaining`, `updateUnitStrips`, `buildPalettes` L669–808 | Derive inventory/alive/damaged presentation from view model |
| Battlefield Markers | HTML L209; Monk L469–492; scouting L1452–1461; resurrection L1494–1557; Plague L2368–2387; legend L3534–3540 | Marker drawing client-only; disclosure and clue facts come from authoritative projection |
| Event Log | `addBattleEvent`, merge routines, attack contexts L1202–1389 | Structured permitted events -> localized prose; remove dependence on DOM rows as event memory |
| Aim Assist | `enemyKnownDestroyedCellsForAimAssist`, `refreshAimAssist` L1185–1205 | Client inference from permitted destroyed-unit facts; disabled while an enemy activated Hero remains alive. It currently reads actual enemy unit structures |
| Floating combat text | `__stoneThrowCombatCallout` L3301–3314; call sites throughout combat | Pure presentation, cancellable and independently paced |
| Action/impact overlays | L2181–2222 | Client timelines; must not block authoritative computation except genuine player decisions |
| Tutorials | L316–317, L1400–1411; tutorial data near L3390 onward | Client preference/discovery UI; visibility facts supplied explicitly |
| Popups/dialogs | Retired generic notifications L1390–1399; active Hero confirmation L1817–1825; Story/menu L3575 onward; result L1432–1439 | Separate decision, result, tutorial, and narrative layers |
| Main Menu/settings | L209; shell settings handlers; L3571–3741 | Client route/state; online tile currently a placeholder dialogue |
| Unit Lore | Art/info L3281–3400; discovery/history L3571; display L3706–3709 | Client content and progression library, not executable combat rules |
| Story Path | `recordStoryScene`, `recordStoryDialog`, `showStoryProgression` L3571/L3705 | Campaign history presentation; currently stores HTML in localStorage |
| Stats ribbon/strength graph | Metric functions L1265–1305; `renderBattleStats` L3314–3320 | Render only permitted statistics; hidden-state-sensitive values need server filtering |
| Responsive layout | CSS L2–209; `updateStoryMapGeometry` L233–266; `updateCommandLayoutFit` L3501–3533 | Client-only layout controller |
| Animations | Dragon/Archer/Goblin/Wizard/Demon/Catapult L1578–1773; CSS keyframes | Client effect timeline, independent RNG and cancellation |
| Sound | `ensureAudioCtx`, `beep`, hit/miss/error/result tones L344–346 | Client Web Audio; no embedded audio file dependency found |

The existing shell is reusable presentation work. It is not yet a network client: it accesses engine closure exports, original buttons, and locally rendered full-state effects. Replacing only `__stoneThrowViewState` would leave other couplings intact.

## 5. Story-system map

### Live progression

Actual rosters are selected by the functions at L267–310 and applied through the `__stoneThrowStartStory*` bridges at L3270–3279. Narrative transitions and conditional routing are in L3580–3689.

| Campaign segment | Configuration and progression |
|---|---|
| Battle 1 | 5×5; one Infantry, Cavalry, Archer per side (L214–216) |
| Battles 2–3 | 8×8; first loser receives Castle, winner receives Infantry/Cavalry reinforcements; Battle 3 gives Catapult force to the side without Castle (`storyBattle2Rosters`, `storyBattle3Rosters`) |
| Battles 4–7 | 9×9 then 10×10; shared early expanded roster, then Dwarf, Elf, Goblin introduced to previous loser, with preceding additions synchronized |
| Battles 8–9 | 11×11; equal advanced roster, then loser receives two Necromancers and other side extra Infantry |
| Conditional Cleric branch | Battle 9's recorded Plague targets can insert a Cleric battle. Cleric first appearance replaces Infantry; phase/battle numbering thereafter is conditional |
| Monk phase | 11×11 baseline; possible Cleric interruption before Monk introduction. Stores the earlier winner for later Monk assignment |
| Dragon/Demon/Wizard phase | 12×12 then 13×13; losing side gains next special, earlier specials spread to both sides; Cleric unlock synchronization continues |
| Hero/final phase | 14×14 equal large forces, then loser gains Hero and winner +1 Infantry; final 15×15 uses Full Game roster |

Do not hardcode a fixed final battle number. `storyPhase4OpeningBattle`, Cleric interruption state, `storyPhase5OpeningBattle`, `storyPhase6OpeningBattle`, `storyPhase6HeroBattle`, and `storyFinalBattle` track the route (L3580 onward; dispatch L3668–3689).

### Engine versus campaign versus presentation

- **Game engine:** selected board dimensions/rosters, valid placement, unit mechanics, battle outcome, and factual Plague/discovery events.
- **Campaign model:** next battle, loser-based introductions, Cleric unlock state, prerequisites, roster changes, final-win requirement, completed scenes, retries.
- **Client presentation:** narration/art, “NEW UNIT” reveal, map-size note, transition animations, tutorial preferences, Story Path and Lore rendering.

`storyPlagueTargetsThisBattle` is populated when Plague is **scheduled** (L2332), not only when visible infection succeeds. Preserve that distinction for conditional Cleric introduction. A map with no successful spread can still have a recorded target.

Tutorials normalize type names and reveal only eligible identities; they record discoveries before checking whether the popup is disabled (L1406–1409). Story markers depend on current rosters, not simply on every unit known in the campaign (L3249–3253). These are separate concepts.

### Continuation, final battle, completion

`__stoneThrowPauseStoryForMenu` refuses to pause during active enemy/chain resolution, otherwise retains live closure state (L346). Returning directly from the menu can resume the current phase and scheduled enemy turn.

`SUSPENDED_STORY_FOR_OTHER_MODE`, however, contains only battle number and both rosters (L224–231). Returning from Full Game calls `applyBattleConfig` and `setup`, restarting placement. It is not a live match snapshot. Persistent localStorage records at L3571 store Story history/lore/completion; they do not persist a complete battle or full campaign route state.

Normal Story wins and losses can advance, while draws generally retry. Final defeat/draw is special: the campaign requires a win, offers retry/menu, and only `playerWon===true` reaches `showStoryComplete` (L1433–1437, L3664–3665, L3688). Give-up has additional handling (L3266–3268). Preserve separate outcomes for elimination, draw, surrender, reset, and menu abort rather than collapsing them all into `phase='over'`.

The legacy `storyState` narrative/test island at L2907–3064 is not the live roster progression. Shared introductory copy and `__stoneThrowStoryBattle1Narrative` in the same region remain referenced; do not remove the region wholesale.

## 6. AI-system map

| AI component | Behavior / source | Reuse potential |
|---|---|---|
| Deployment | Random Castle generation; side-specific and Story/full roster placement; Monk/Archer/Cleric/Hero heuristics, L891–1174 | Shared legal placement primitives plus separate policy; preserve retries and random ordering during comparison |
| Normal enemy targeting | `enemyChooseTarget` L2742–2771; resurrection suspects, known Hero, Hero hunt, unfinished multi-cell units, Monk clues, known core scouting, endgame parity, weighted search zones | Server AI policy consuming its allowed view |
| Plague-aware targeting | `enemyChoosePlagueSafeSearchTarget` L2703–2723; protected-cell expansion L2689–2702 | Shared threat-map calculation; retain policy differences deliberately |
| Multi-cell hunting | `enemyOldestUnfinishedMultiHitTarget` L2672; Castle hit tracking L2658; endgame elimination L2724 | Knowledge-based target helpers, once dependence on real identities is removed |
| Auto Match targeting | `autoMatchBrains` and helpers L372–468 | Reusable simulation policy, currently distinct from normal enemy AI |
| Catapult decisions | Enemy-specific and side-parameterized variants L2145–2179; roll continuation L2234 | Shared scoring and rule-safe action generation, policy still separate from random human roll behavior |
| Hero escape | `chooseEnemyHeroRelocation` L1893–1914; `autoMatchChooseHeroRelocation` L465–468; local escape helpers | Server AI choice over legal destinations on its own board |
| Auto Resolve | L2772–2775 and L2823–2829; seeds brains from current state, resolves pending choices, drives remaining battle | Future test/AI driver calling shared commands; currently invokes DOM-backed handlers |
| Auto Match batch | L2873–2906; random new battle, limits, result aggregation, reset | Keep as development balance/smoke testing, not proof of rule correctness |

The normal enemy, Plague-aware enemy, and Auto Match policy are not interchangeable. Examples: ordering of unfinished-unit versus resurrection search; different fallback behavior when filtered candidates are empty; different scouting/Hero rules; AI-directed versus random Catapult continuation. Auto Match uses live mechanics but does not exactly simulate a human player's decision policy.

**Knowledge boundary risk:** policies call `sideUnitAt`, access actual multi-cell objects, inspect real Hero keys/activation, and use actual remaining units. Some reads concern already disclosed locations or their own board and are legitimate. Others require an explicit public-information justification. For example, `autoMatchUnfinishedMultiTarget` derives actual type from a hit key (L402–404), while the human UI may still show an unidentified core unit. Do not label the current AI “non-cheating” based only on the existence of knowledge Maps.

A future `AiPolicy.chooseAction(observerView, memory, rng)` should never receive the opponent's full board. Own-board relocation/deployment can receive own private state. If retaining a privileged prototype bot for comparison, identify it explicitly as a development policy.

## 7. Dev/test-system map

| Tool / shortcut | Evidence | Recommendation |
|---|---|---|
| F6 | L3066; toggles enemy reveal through L2599–2656 | Retain in offline dev build; exclude full-state reveal access from production client |
| F8 | L3067; opens Auto Match only with reveal enabled | Dev-only panel and keyboard binding |
| Enemy takeover | Button created L2599, controls/manual-shot Promise L2620–2655 | Dev-only command driver; useful to reproduce rare branches |
| Auto Match | Up to 10,000 requested matches; 500-round/loop safety guards; aggregate failures, L2847–2906 | Retain, move to headless development simulation after engine parity |
| Story Auto Resolve | L2823–2829; visible only with dev tools in `syncShell` L3542 | Dev-only by default; any future player-facing automation is a separate product decision |
| Quick Start | `stQuickStart` HTML L209; shell handler in L3479 region | Convenience random placement/start, not a combat cheat; can remain if desired |
| Global test/control bridges | `__stoneThrowGiveUp`, `AbortBattleAsync`, `StartStory*`, toggles, mode flags | Replace with typed host APIs; production must not trust client-side calls as authorization |
| Old Story test handles | L2914; old narrative functions L2936–3064 | Candidate legacy island; confidence below |
| Old save-defaults compatibility | `AB_DEFAULTS_KEY`, `collectABDefaults`, `eventPopupsEnabled`, nonexistent `eventPopupsToggle`, L3074–3086 | Isolate/review as legacy preferences; current popup toggle is different |
| Debug/error logging | Loss reveal L1439, Auto Resolve L2828, Auto Match L2900; swallowed catches across reset/cancellation | Keep actionable dev diagnostics, add structured server errors; never log secret boards into shared client channels |
| Prototype placeholders | Online dialogue L3705; music/effects “coming later” strings L209; window-close fallback L3729 onward | Client-only placeholders, not implemented multiplayer/audio systems |

The executable F-key handler binds **F6 and F8**. Coordinate comments containing F1/F10 are not keyboard tools. No assertion-based automated rule suite was found inside this file; simulation guards and outcome aggregates are not a substitute.

## 8. Asset inventory

| Embedded form | Occurrences | Notes |
|---|---:|---|
| PNG data URLs | 77 | Small unit/marker/cursor sprites, Castle tiles, flight sprites, unit-information art |
| WebP data URLs | 28 | Menu/banners/logo and Story artwork |
| SVG data URLs | 10 | Cursor/decorative and result imagery, including generated draw image |
| Total data URLs | **115** | **87 distinct literal URL strings**; 995,339 encoded characters, about 60% of file byte size |
| Literal inline SVG elements | 6 | Stats icons and chart container; distinct from data-URL images |
| Embedded audio URLs/files | 0 found | Audio is synthesized with Web Audio oscillators/gain nodes |

Counts cover literals in the entire source, including CSS and strings. Distinct URL strings do not prove distinct decoded pixels. Asset IDs, source lines, repeated occurrences and hashes are in `embedded-asset-inventory.md`.

### Reference map

- **Board/strip/marker/cursor assets:** CSS at L2/L119 and generated UI styles reference them directly through `url(...)`. This demonstrates a static reference, not that every old selector is visible. Repeated resurrection cursor/cross and unit art URLs are consolidation candidates.
- **Castle tile array:** `CASTLE_TILE_ART`, L510–526, contains 16 masks. Placement, preview, partial enemy reveal, and dev overlay functions reference it dynamically by neighbor bitmask. Do not remove apparently rare masks based on a sample game.
- **Result images:** `RESULT_WIN_ART`, `RESULT_LOSE_ART`, `RESULT_DRAW_ART`, L1432, all selected by `showResultOverlay`.
- **Dragon flight sprites:** `DRAGON_FLIGHT_RIGHT/LEFT`, L1564, used by `createDragonFlightOverlay`.
- **Unit information artwork:** 15 entries in `ST_UNIT_INFO_ART`, L3281–3297, accessed by unit key for info, tutorials, Lore, Story reveals, and fallback combat callouts. All unit keys participate in the current data/UI registry.
- **Story artwork:** `STORY_NARRATION_ART`, L3574, contains 21 named entries after assignments: `border`, `castle`, `catapult`, `phase2_equal`, `phase2_dwarf`, `phase2_elf`, `phase2_goblin`, `phase2_sync`, `phase3_open`, `phase3_necro`, `phase3_cleric`, `phase3_complete`, `phase4_open`, `phase4_monk`, `phase5_dragon`, `phase5_demon`, `phase5_wizard`, `phase5_complete`, `phase6_final`, `hero_intro`, `story_complete`.
- **Story dynamic lookup:** `storyVignette`, `openStoryTransition`, and stored-history rendering select art by string. Some entries share identical URLs: `phase2_equal`/`phase3_open`, and `phase3_complete`/`phase4_open`. No deletion should assume an entry is unnecessary just because its bytes duplicate another entry. A stable scene-to-asset alias can preserve intent.
- **Menu/UI images:** L209 directly references menu icons, game logo and battlefield banners. CSS decoration and generated icons remain client assets.

Recommended eventual structure:

```text
client/assets/
  images/
    units/       # battlefield sprites, state variants, Castle masks
    unit-info/   # larger tutorial/Lore portraits
    story/       # stable scene IDs and aliases
    ui/          # logos, banners, result art, cursors, marker icons
    effects/     # Dragon flight and other effect sprites
  audio/         # only if actual sound files are added later
  manifest.json  # stable asset ID -> path, role, provenance, checksum
```

Keep synthesized sound definitions in `client/src/audio/`, not fake audio files. Preserve original encoded references until asset extraction is separately authorized and visual equivalence checked. No new graphics are needed for architecture migration.

## 9. Suspected dead/legacy code with confidence levels

**HIGH** means demonstrably unreferenced/unreachable within the supplied application; **MEDIUM** means apparently obsolete but needs runtime verification; **LOW** means suspicious with possible dynamic use. These labels are not deletion authorization.

Babel binding analysis found the following private function declarations with zero lexical references. No `eval`, `new Function`, or string-timer dispatch was found in the scanned source to call these private bindings dynamically. Browser console manipulation is outside normal application reachability.

| Candidate | Confidence | Evidence / caution |
|---|---|---|
| `selectCastleForClickMove` L574 | HIGH | Zero references; current click-move is implemented in mouse handlers. Preserve other Castle edit paths |
| `isAdjacent8` L927 | HIGH | Zero references; other adjacency helpers are live |
| `tryPlaceEnemyMonkBait` L935; `tryPlacePlayerMonkBait` L1057 | HIGH | Entry helpers unreferenced. Their helper-only dependency island can be reviewed separately; don't infer that all near-Monk placement is dead |
| `playerHeroPreferredStart` L1038; `enemyHeroPreferredStart` L1042 | HIGH | Zero references; other Hero placement/escape policy is active |
| `countWords` L1257 | HIGH | Zero references |
| `markResurrectionVisual` L1494 | HIGH | Zero references; active resurrection functions paint classes directly |
| `dragonPatternFrom` L1576 | HIGH | Unreferenced wrapper; live code calls `dragonFlightPathsFrom` |
| `paintDragonBreathWake` L1596 | HIGH | Zero references; `startDragonBreathTimeline` remains live |
| `heroPopupText` L1826 | HIGH | Zero references; active Hero feedback/decisions are elsewhere |
| `queueSpecialFromChain` L1971 | HIGH | Unreferenced stub; merely calculates unused `currentOwner` |
| `catapultOriginFarFromCells` L2141 | HIGH | Zero references; other origin-scoring helpers are live |
| `devRevealImageFor` L2603 | HIGH | Zero references; active overlay builder uses a styled probe |
| `enemyCastleHuntTarget` L2664 | HIGH | Zero references; generalized unfinished-multi targeting is used |
| `storySideName` L2917; `storyResultReaction` L2936; `storyUnlockNarrative` L2948; `storyClosingLine` L3063 | HIGH | Private entry points have zero references. Old Story model/helpers form a candidate island, but shared introductory copy/export is live |
| `unitInfoPunchHtml` L3370 | HIGH | Zero references; other punch/Lore renderers remain active |
| `enemyCellRevealsType` L3430 | HIGH | Zero references; do not delete adjacent active hover/type logic |
| `chainQueue` L360 | HIGH for unused queue role | Declared and cleared during invalidation/start; never populated or drained as a queue. Actual waves are local variables |
| Repeated Necromancer exclusion | HIGH for redundant statement | `playerUnitsDestroyedForWin` L2565 repeats the same `if(playerNecroKeys.includes(k)) continue;` consecutively |
| Generic combat popup display | HIGH for retired display role | `showEventPopup` explicitly hides overlay and returns resolved Promise (L1390–1397). Calls remain live; removal changes async boundaries and cleanup unless carefully preserved |
| `#eventOverlay` styling/markup and old disable-popup button | MEDIUM | Notification display retired; cleanup/listeners remain. Shared `.event-overlay` also styles active Hero confirmation |
| Old Story test DOM handles `stStoryTestPanel`, `stStoryNarrative*` | HIGH for missing static elements / MEDIUM for whole island cleanup | IDs appear as lookup targets, not live markup in this file; review dependency island, not just declarations |
| Save-defaults installation and `eventPopupsToggle` | MEDIUM | L3086 cannot find the old toggle in current markup, so no button is installed. `setup` still executes related functions and old localStorage can matter |
| `#stActionInstruction` | MEDIUM | Always hidden by L123; current action overlays use separate IDs, but clearing helpers still touch it |
| `#stHoverCard` | MEDIUM | Mounted HTML but explicitly hidden at L3338; active Unit Information card replaces its visible role |
| `stripPlacementCursor`, stale compatibility flags/locals | MEDIUM | Comments indicate compatibility at L362; assignment/reference inventory identifies candidates, but preview/drag recovery still needs runtime checking |
| `setSpyCursor?.(false)` cleanup | MEDIUM | No implementation found; call is inside caught compatibility block L3087. Optional call on an undeclared identifier still throws before catch |
| Dormant Plague triple-growth branch | LOW | Weight currently zero, but explicitly retained for edited tests. Configuration branch, not proven obsolete logic |
| `#playerBoard` / old `necromancer-*` style aliases | LOW | No current canonical board ID/type spelling uses these names, but legacy/dynamic styles need reachability checking |
| Apparent unused Story art names | LOW | Dynamic scene lookup and persisted history can still select entries |

**Explicitly not dead:** hidden `#engineScaffold`, original buttons, live grids/strips, Story tutorial overlay, Hero confirmation, result overlay, `STORY_SHARED_COPY`, and `__stoneThrowStoryBattle1Narrative`. The hidden scaffold is essential to initialization and proxy-control behavior today.

## 10. Duplication and maintenance-risk findings

### Gameplay duplication and mismatches

1. **Five damage-dispatch families:** human direct, enemy direct, shared chain, Archer volley, Wizard layers; Plague is an additional deliberately specialized path. They repeat type dispatch, visuals, logs, state mutation, reaction scheduling and observer knowledge. Consolidate common damage bookkeeping eventually, while keeping source-specific reaction timing.
2. **Catapult branch mismatch:** Archer next-turn handling adds `playerNextShots`/`enemyNextShots` at L2021; shared/Wizard paths add `playerCatapultPending`/`enemyCatapultPending` at L2098/L2314. This is a demonstrated code difference, not merely naming style.
3. **Infantry alias mismatch:** `sideUnitAt` returns `infantry` (L1965–1966). Plague resurrection-exclusion bookkeeping tests `['inf','archer','monk','cavalry']` (L2428), so ordinary Infantry bypasses that specific recording branch. `playerDestroyedCoreUnits`/`enemyDestroyedCoreUnits` use the exclusion Sets. This suggests Plague-killed Infantry can remain eligible despite the intended exclusion. Capture a regression fixture before any correction.
4. **Archer resurrection handling differs:** `resolveArcherUnit` lacks the explicit revived-unit discovery calls present in shared chain and Wizard dispatch (compare L1999–2029 with L2076–2079/L2294–2296). Verify whether resurrection-search state can remain active after an Archer hit on the real revived unit.
5. **Direct Dwarf assignment versus additive bonus:** direct handlers assign `nextShots=7`; chain paths add 5. Multiple outstanding effects can make those different. Do not normalize by assumption.
6. **Cleric scheduling differs by attack source and side:** Archer calls `maybeReleaseHeldPlague` directly; shared/Wizard set deferred release flags. Same-turn enemy release can resurrect before destruction (`startEnemyResurrection(true)`, L2532), while player path becomes interactive.
7. **Zero-Necromancer edge:** `maybeReleaseHeldPlague` compares hit count to roster count without a positive-count guard (L2360). In Story rosters with Cleric but no opposing Necromancers, `0===0` can pass and origin can be undefined. Verify the reachable conditional Cleric branch rather than assuming Full Game's two Necromancers always exist.
8. **Shot history is damage state:** deletion on resurrection reopens cells and changes counters/inference. A conventional immutable shot log cannot replace these Sets without modeling the separate current damage semantics.
9. **Hero pending queue and transient occupancy:** first relocation removes occupancy before waiting; player confirmation tentatively changes authoritative-style state before acceptance. A server version needs a pending-choice transaction, not a DOM confirmation that edits live state.
10. **Repeated lifecycle resets:** `invalidateBattleAsync`, `setup`, random placement, `startPlayPhase`, and Story transitions each reset overlapping subsets. Omitted/reset-twice flags are likely maintenance failures as units expand.
11. **Repeated two-side implementations:** counting, resurrection, targeting, random placement, Hero death/escape, threat maps. Unify structure around IDs, but preserve policy and presentation asymmetries intentionally.
12. **Randomness and presentation share `Math.random`:** deployment, attacks, AI, result prose and visual particles draw from ambient RNG. Replays need explicit rule RNG and separate presentation RNG; initial parity harness must record the original sequence rather than silently changing it.
13. **Simulation shortcuts are incomplete presentation bypasses:** `fastSimulationMode` handles both modes, while `beep` and combat callout suppression check only Auto Match (L345/L3302). Auto Resolve still traverses DOM effects and may have different timing. Fast-mode results need comparison with manual mode.
14. **Copy duplicates rules:** unit info, punch facts, tutorial paragraphs, Story prose, and code thresholds can disagree. Share descriptive metadata where safe, but do not parse human text to run combat.

### CSS and layout audit

The 23 style blocks contain **691 literal `!important` uses**. A balanced-block scan found **30 repeated exact selector-list/scope groups**, within 1,021 qualified-rule entries including keyframe steps. These are static counts, not 30 confirmed bugs. Grouped-selector overlap creates additional duplication beyond that count.

| Area | Evidence | Consolidation risk |
|---|---|---|
| Board frame/title decoration | `.st-board-wrap` appears five times; `.st-board-head`, `.st-board-title`, `.st-board-note` four times each across L2/L119 and later layout | Source order, specificity and image overrides matter |
| Base unit styles versus art patches | Repeated `.cell.archer-cell`, Cavalry question styles, large special-unit selector groups at L2 | Earlier letter/gradient presentation coexists with image-based presentation |
| Resurrection layering | Base choice/suspect styles at L2; repeated classes five times in selector at L119; additional shimmer/pulse blocks | Intentional specificity escalation; preserve pseudo-elements, opacity and animation before consolidation |
| Command layout | Earlier `.st-main` rules, later three-column rules L32 onward, collapsed layout L83 onward | JS adds collapse state using actual board width; cannot replace by one viewport breakpoint without comparison |
| Legend columns | L64 two-column rule; L119 replacement and max-width 980 single-column rule | Different sidebar/viewport widths can activate competing assumptions |
| Story geometry | Story board sizing CSS plus `updateStoryMapGeometry` and `updateCommandLayoutFit` | Three places influence cell/center/sidebar sizing; stale closures and resize order need testing |
| Legacy hidden UI | `.hidden-stat`, old event overlay, `#stActionInstruction`, hidden scaffold/palette styles | Hidden does not imply unused; several hidden elements are state bridges |
| Odd nested declaration | `.event-overlay{...display:none;#eventOverlay{display:none!important;}align-items:...}` at L2 | Unusual nested rule inside older flat CSS. Verify target browsers' parsing; don't assume all following properties are invalid |
| Stale aliases | `#playerBoard`, `.necromancer-*` alongside current IDs/classes at L119/L2 | Candidate compatibility residue, not safe deletion by text search alone |

Responsive conditions include 560, 570, 620, 720, 760, 800, 900, 980, 1000 and 1100 px, plus reduced-motion rules. Some are spelled with different whitespace. Test each board size (5–15), menu/dialog state, zoom and collapsed layout before regrouping rules. A rule with the same selector may add a different property rather than supersede the whole declaration.

The shell's resize callback contains a `typeof updateStoryMapGeometry` check (L3530) even though that function belongs to the other IIFE. Its fallback still works and the first IIFE has its own resize listener (L266), but the cross-closure reference is misleading maintenance code.

## 11. Server-migration risks

### Hidden enemy information

Current JavaScript necessarily contains both entire boards. CSS hiding and closure scope are not secrecy. **Do not transmit these Sets/Maps to an opposing browser and rely on rendering to conceal them.**

Projection must cover more than board tiles:

- Initial placements, unit IDs/type, multi-cell membership/shape, Hero destination and actual resurrected identity are private except for rule-defined disclosures.
- Partial Cavalry/Castle hits can remain unidentified. Sending an internal unit ID on the first hit may let a client correlate later cells before the UI would identify them.
- Scouting, Monk candidates and resurrection suspects are observer-specific. N players require `knowledge[observerId][boardOwnerId]`, not one shared reveal bit.
- Current strength graphs, kill counts, unit strips, logs, tutorial triggers, floating labels and action origins can reveal more than the board paint. Audit each projection field; public aggregate statistics also require an explicit rule.
- `eventObservedLabel`, `scoutObservedLabel`, `floatingImpactLabel`, `tutorialRevealed` and hover logic are useful evidence of current disclosure intent, but some depend on DOM classes. Move the disclosure decision to a pure observer projection before rendering prose.
- Enemy board reveal on loss is a deliberate current presentation behavior. In N-player games, an eliminated player's match may continue for others; whole-board reveal must not automatically become visible to active opponents or spectators.
- Keep private server events/replays separate from recipient-filtered events. Logs, error payloads, reconnect snapshots and dev tools must use the same visibility policy.

### Authority, lifecycle, and N players

Replace `side==='player'?'enemy':'player'` with explicit actor, owner, target and observer IDs. A reaction needs to know who triggered it, who owns the affected unit, whose turn it is, and which board it attacks. These roles are different even in current two-player chains.

Design the data model for an ordered `players` collection now. The first executable ruleset can faithfully reproduce 1v1. Before enabling 3+ players, specify target selection for retaliation/Plague, treatment of eliminated owners with queued effects, turn skipping, teams/alliances if any, and the terminal condition. **Do not invent those gameplay rules during structural extraction.**

The server must own full board state, legal actions, final placement validation, shots, damage, deaths, triggers, resurrection, Plague, Hero state, turn order/budget and final result. Client requests are intents, never accepted state replacements. Server validates actor/session, phase, pending choice ownership, coordinates, allowed target, action budget and duplicates.

Current asynchronous functions await animation and tutorials while mutating live state. Network disconnects cannot leave a match awaiting a browser Promise. Genuine choices need IDs, legal options visible only to the chooser, authoritative continuation state, and an explicit timeout/reconnect policy. Animation completion is not server permission to proceed.

Other migration risks: stale client actions after reconnect/reset; duplicated WebSocket delivery; rule-version drift between hosts; unseeded randomness; browser timer ordering; reentrant handlers; mutable configuration while a match runs; stored HTML as campaign history; and hidden-state leakage through purported convenience/debug endpoints.

## 12. Recommended future architecture

The proposed directory split is appropriate. Add explicit visibility, command/protocol, campaign, RNG/replay and test-fixture boundaries. Avoid a separate server implementation of the same rules.

```text
StoneThrow/
  prototype-reference/
    StoneThrow-v1.427.html
    checksum.txt
    audit/
  client/
    index.html
    src/
      app/                  # routing, host selection, lifecycle
      input/                # intents, placement drafts, decisions
      ui/
      rendering/
      animations/
      audio/
      menus/
      story/                # narrative, tutorials, history presentation
      networking/           # commands, projected snapshots/events
    assets/
  shared/
    game/
      state/
      rules/
      units/
      combat/               # chain scheduler + specialized resolvers
      events/
      commands/
      validation/
      visibility/           # per-observer state/event projection
      randomness/
    campaign/               # progression + scenario definitions
    protocol/               # public wire contracts, no private snapshots
    ai/                     # policies consuming allowed views
  server/
    rooms/
    sessions/
    networking/
    game-host/              # one serialized match executor per match
    persistence/            # snapshots, private replay, campaign saves
  tools/
    dev/                    # reveal/takeover adapters
    simulation/             # Auto Match + reports
  tests/
    characterization/
    fixtures/
    rules/
    chains/
    visibility/
    protocol/
    integration/
    visual/
```

This is a future layout only; no reference copy or project scaffold was created by this audit. Keep private full-state types from becoming the network response type merely because they are in a shared package. Shared code is fine; sharing secret runtime data is not.

### Canonical state model

A match should contain a versioned immutable configuration, player IDs/order, boards, unit instances, damage state, explicit turn budget, scheduled effects, pending decisions, resolver context, RNG state and committed result. Unit instances need IDs, owner, type, occupied cells, damage/lifecycle and specialized ability state. Use board-qualified coordinates throughout.

Keep current damage, historical impacts, and observer knowledge distinct. Resurrection restores lifecycle/damage without erasing the historical event stream. Derived occupancy/reverse indices must have one owner and invariant checks. No DOM nodes, callbacks, style names, timer handles or HTML strings belong in authoritative state.

Use an engine interface conceptually equivalent to “validate and apply a command, then resolve due effects, returning state plus events or a pending choice.” The exact TypeScript shape can be decided later. Outcome records should distinguish reason and tied/eliminated/winning participants; don't encode draw by matching result text with `/draw/i` as L1433 does.

### Centralized event/chain resolver

The centralization should preserve **ordering**, not flatten everything into a generic FIFO:

1. Start one root resolution context for the accepted triggering action. Assign chain ID and source/actor/owner/target metadata.
2. Apply direct impact and enqueue triggered work using explicit timing: immediate interrupt, after current volley/attack, next wave, same-turn follow-up, turn boundary, or future turn.
3. Retain specialized schedulers for Archer/Wizard impact batches, Monk nested interrupts, Goblin-last waves, Hero relocation barriers, Catapult roll and Plague steps. Record their current order in fixtures first.
4. Drain all due work, including effects generated by follow-ups. One local sibling reaction must never commit the final result while its parent still has queued work.
5. If a legal player choice is required, pause the authoritative context as a serializable pending decision. Resume with a validated command. Do not finalize merely because the effect queue is temporarily empty while a decision is outstanding.
6. At the appropriate turn boundary, resolve effects due at that boundary. Do not prematurely execute all five future Plague rounds or all next-turn bonuses simply to empty every scheduled-effect list.
7. Commit outcome once the root context has no unfinished work, due effects or required choices. Calculate all participants' elimination together under the selected ruleset.
8. Emit recipient-filtered events and a projected state version. The client plays animations and prose from these events. Presentation failure must not alter the result.

An implementation must not silently “correct” the golden prototype while introducing this scheduler. For ambiguous/mismatched branches, maintain characterization behavior and a separate proposed-rules ledger. The desired invariant can expose reference bugs; correcting those is a separately reviewable behavior change.

### Essential future test matrix

- Every unit: direct human hit, direct AI hit, shared chain, Archer, Wizard, Plague, both ownership directions, and absent-unit Story roster.
- Both final cores lost in one nested reaction; final core lost then restored by due resurrection; inactive Hero activated after ordinary cores die; queued Hero death plus another pending Hero event.
- One Catapult producing two different reactive units; multiple due Catapult shots; Catapult-triggered Dwarf/Cleric/Elf; zero remaining ordinary shots.
- Archer finds resurrected Cavalry; resurrected Archer does not reuse spent retaliation; resurrected Monk stays spent; Plague-killed Infantry eligibility.
- Cleric/last Necromancer in either order, same volley and nested chain; no opposing Necromancers; new Plague during another outbreak; multiple due frontier cells.
- Monk interrupts within Archer/Goblin, Monk duel restart, Monk death before another queued deflection; source types that deliberately do not trigger proximity.
- All Story phase routes, Cleric interruption, retry/draw/give-up, final-win completion; menu live resume versus Full Game return.
- Fixed rule RNG across visible and fast drivers; resets during awaited effects; no-destination Hero; board exhaustion and safety guards.
- Projection tests: opponents cannot infer secret placements from snapshots, IDs, events, logs, counts, reconnection, or spectator output. Add N-player model tests before transport.

## 13. Safe cleanup sequence

1. Preserve the original fingerprint and record a baseline run catalog before editing any working copy. Retain reference screenshots, scenarios, action traces and rare-branch outcomes.
2. Put cleanup changes in a separate working version. Add characterization support before removing code; don't begin with a broad minifier/dead-code sweep.
3. Review the HIGH private-function candidates one dependency island at a time. Preserve the live shared Story copy/export and hidden scaffold. Verify behavior after each small change.
4. Isolate dev controls and legacy preference hooks. Avoid changing normal execution timing as a side effect of removing retired `await showEventPopup(...)` calls.
5. Extract literal assets without changing dimensions, cursor hotspots, mask selection or aliases; compare rendered output.
6. Separate CSS while preserving source order and specificity exactly. Consolidate only afterward, with computed-style and screenshot comparisons across Story sizes and overlays.
7. Replace hidden-DOM state bridges with an explicit client view model in small steps. Keep presentation changes separate from rule extraction.
8. Normalize type aliases/state ownership only with recorded behavior tests and an explicit decision about existing inconsistencies.

No cleanup item in this sequence is authorized for implementation by this audit task.

## 14. Safe migration sequence and implementation stages

Build the engine for player IDs and an N-player-capable state model before WebSockets. Deliver 1v1 first using the original behavior; enable additional-player rules only after those semantics are specified. Place characterization and visibility tests early, not after the combat rewrite.

| Stage | Small implementation scope | Exit condition |
|---|---|---|
| **Stage 0 — Freeze the golden prototype** | Store a separately approved reference copy, checksum, audit and scenario catalog | Original unchanged and reproducibly identifiable |
| **Stage 1 — Establish characterization fixtures** | Record commands, initial layouts, random draws, outcomes, observations and critical timing branches | Known baseline for every special unit and listed chain risk |
| **Stage 2 — Remove only proven dead islands** | Private unreferenced functions and verified redundant statements, one small change at a time | No change to recorded behavior or live UI; ambiguous items retained |
| **Stage 3 — Isolate development tools** | F6/F8, reveal, takeover, Auto Match and temporary Story Auto Resolve | Production entry points do not contain privileged board access |
| **Stage 4 — Extract existing assets** | Stable asset manifest and folders; preserve bytes/aliases | Visual comparison passes; no new artwork |
| **Stage 5 — Separate HTML, CSS and presentation modules** | Preserve DOM behavior and cascade; replace hidden-control bridges incrementally | Same UI and flow across board sizes |
| **Stage 6 — Establish canonical N-player-capable state and visibility** | Unit/player/board IDs, explicit turns, pending effects/choices, per-observer projections | State round-trip and secrecy tests pass; 1v1 behavior retained |
| **Stage 7 — Extract geometry, validation and rule helpers** | Explicit parameters and rule RNG; distinguish legal rules from AI policy | Characterization tests pass without DOM dependencies in extracted helpers |
| **Stage 8 — Extract unit rules and centralized chain resolver** | One root completion boundary; preserve specialized timing; document any separately approved corrections | Nested reaction, resurrection, Hero, Plague and draw fixtures pass |
| **Stage 9 — Complete headless rule/AI regression harness** | Move Auto Match to engine commands; seed/replay; compare visible and fast execution | Reproducible results and failures; no DOM required for simulation |
| **Stage 10 — Build browser client around projected engine output** | Local/offline host adapter, intents, animations, logs and decisions | Client cannot mutate engine through UI state; visuals preserved |
| **Stage 11 — Create local Node authoritative host** | Serialized match executor, sessions, command validation, versioned protocol, decisions and reconnect | Same engine outcomes as offline fixtures; filtered snapshots/events |
| **Stage 12 — LAN 1v1** | Two clients, private placement, idempotency, disconnect/reconnect, duplicate/stale command tests | No hidden-board leakage; exact 1v1 rules and full-chain outcome behavior |
| **Stage 13 — Enable specified N-player rules** | Explicit reaction targeting, turn/elimination and visibility policies using the existing N-player model | 3+ participant tests cover nested chains, simultaneous elimination and reconnect |
| **Stage 14 — Production hardening** | Deployment, persistence, observability, abuse limits and packaging of dev-only code | Operational checks pass without changing game rules |
