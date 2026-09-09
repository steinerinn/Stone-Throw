# CSS cascade inventory

Balanced-block static scan of inline style elements. Exact selector-list repetitions are grouped within the same at-rule scope; this is not a browser computed-style audit. Individual selectors repeated inside different lists also need review.

23 style blocks; 1021 scanned qualified rules (including keyframe steps); 691 literal !important occurrences; 30 repeated selector-list/scope groups.

| Selector list | At-rule scope | Lines | Rule count |
|---|---|---|---|
| `:root` | base | 2, 2 | 2 |
| `body` | base | 2, 2 | 2 |
| `.cell.archer-cell` | base | 2, 2, 2 | 3 |
| `.unit-strip-item` | base | 2, 2 | 2 |
| `.st-board-wrap` | base | 2, 2, 70, 119, 119 | 5 |
| `.st-board-head` | base | 2, 2, 119, 119 | 4 |
| `.st-board-head::before,.st-board-head::after` | base | 2, 119, 119 | 3 |
| `.st-board-head::before` | base | 2, 119 | 2 |
| `.st-board-head::after` | base | 2, 119 | 2 |
| `.st-board-title` | base | 2, 2, 119, 119 | 4 |
| `.st-board-note` | base | 2, 2, 119, 119 | 4 |
| `.st-grid-host` | base | 2, 2 | 2 |
| `.cell.dwarf-cell,.cell.dwarf-hit,.cell.catapult-cell,.cell.catapult-hit,.cell.goblin-cell,.cell.goblin-hit,.cell.elf-cell,.cell.elf-hit,.cell.cleric-cell,.cell.cleric-hit,.cell.demon-cell,.cell.demon-hit,.cell.dragon-cell,.cell.dragon-hit,.cell.wizard-cell,.cell.wizard-hit,.cell.necro-cell,.cell.necro-hit,.cell.necromancer-cell,.cell.necromancer-hit` | base | 2, 2 | 2 |
| `.cell.cavalry-question` | base | 2, 2 | 2 |
| `.cell.cavalry-question::before` | base | 2, 2 | 2 |
| `.st-brand` | base | 2, 119 | 2 |
| `.st-title` | base | 2, 119 | 2 |
| `.st-main` | base | 2, 32 | 2 |
| `.st-left-stack` | base | 2, 47 | 2 |
| `.st-battle` | base | 2, 65 | 2 |
| `.st-legend-row` | base | 2, 63, 119 | 3 |
| `body.story-mode-active .st-grid-host` | base | 2, 119 | 2 |
| `.st-side-left` | base | 4, 39 | 2 |
| `.st-side-right` | base | 5, 55 | 2 |
| `.st-side-left .st-events` | base | 6, 19 | 2 |
| `.st-battle-legend` | base | 64, 119 | 2 |
| `.st-battle-legend .st-legend-row` | base | 64, 119 | 2 |
| `.st-board-title::before,.st-board-title::after` | base | 119, 119 | 2 |
| `#stMenuDialogBody` | base | 119, 122 | 2 |
| `.st-story-phase-stage.revealed #stStoryUnitReveal` | base | 121, 122 | 2 |

## Responsive conditions

- `@media (max-width:1000px)`
- `@media (max-width:560px)`
- `@media (max-width:720px)`
- `@media (max-width:900px)`
- `@media (prefers-reduced-motion:reduce)`
- `@media(max-width:1000px)`
- `@media(max-width:1100px)`
- `@media(max-width:560px)`
- `@media(max-width:570px)`
- `@media(max-width:620px)`
- `@media(max-width:720px)`
- `@media(max-width:760px)`
- `@media(max-width:800px)`
- `@media(max-width:980px)`
