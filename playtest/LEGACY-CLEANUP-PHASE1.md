# Legacy cleanup phase 1 — review candidate

Branch: `cleanup-optimization-phase1`  
Accepted base: `a914f6cfb4296a512004158147a10abbf5f07cb1`

Legacy cleanup only. No optimization, gameplay changes, UI redesign, commits, push, merge or deployment. Runtime files were not rewritten beyond removal of unreachable widgets, their listeners and their styles.

## Removal evidence

| System | Reference trace and removal decision |
| --- | --- |
| Stage 5 browser engine/generator | `build.mjs` only produced Stage 5 HTML from `source/document.json` and the old engine/shell fragments. The current package builds TypeScript via `canonical/tsconfig.json`; current server serves Stage 13. Removed the obsolete generator and engine, including the old browser Automatch/demo/report controls. |
| Stage 5/10/11/12 HTML and client-v10/11/12 | Current `server/main.mjs` allowlist names Stage 13 and client-v13; no retained runtime/test imports these local old client directories or HTML files. Removed eight HTML bundles and 38 old client modules, including duplicated renderers, controllers, listeners and developer adapters. External `stage10/development-harness` imports in some tests refer to the browser harness, not these retired game bundles; those were retained. |
| `client/shell.js` | Current HTML loads `client-v13/shell.js`; the old module was referenced only by the retired build presentation inventory. Removed that obsolete inventory entry with the file. |
| `client-v13/development-adapter.js` | Not imported by either current bootstrap and not in server static allowlist. Its F6/F8 reveal, takeover, legacy-tool button and MutationObserver belonged to the superseded in-browser adapter. Current explicit development entry uses `node-development.js` instead. |
| Hidden Automatch / Story Auto Resolve UI | Both current HTML files contained Automatch toggle/panel/results and a temporary Story Auto Resolve button, but no current adapter implements the corresponding old actions. Removed those exact four DOM subtrees per HTML, the dead Story Auto Resolve click listener/timer and view synchronizer, and CSS rules restricted entirely to retired selectors. Current Story dialog/Unit Lore content is unchanged. |
| Test Statistics UI | `showStatistics()` had no caller and no menu button. Removed only its unreachable renderer and unused `statisticsEnabled` variable. Inspector backend retained because current Result regression tools use it. |
| One-time narration installers | `tools/story-narration/integrate.py` and `finalize.mjs` were one-time migration scripts for retired HTML and an old absolute Downloads handoff. They have no runtime/test callers. Removed them rather than leaving broken rewrite tools. The current narration code, audio, tests and historical comparison fixtures remain. |

A literal-reference scan of retained executable code (client-v13, client, server, canonical/shared, canonical/compiled and tools) found no references to deleted file paths. Current production/development HTML entry points and retained JS imports were also checked. Historical Markdown and frozen evidence may still name retired files; they are not runtime entry points.

## Protected systems and retention

No files under `server/`, `canonical/` or `assets/` were modified or deleted. `source/legacy/story.js`, Game Log, Feedback, Profile, Hall of Fame, Spectator, Replay, Result, AFK, reliability, Match Score and current Event Log implementation files are unchanged. Registry UI changes only remove the uncalled inspector renderer.

Consequently the SQL/migration/guard implementation and all `review_retention`, `review_metrics`, `review_signals`, `review_accounts`, `review_decisions`, `review_pending`, `review_career_hold`, authoritative `stat_matches`, `stat_facts`/command journals, `stat_participants` and `shotAudit` paths are byte-for-byte identical to the accepted checkpoint. No real Registry was opened for cleanup or testing, and no historical data was deleted. Tests used isolated temporary storage.

## Routes/endpoints

No API endpoints were removed. Retired HTML/module files were already outside the current server allowlist. `/api/registry/statistics` is intentionally retained for current Result regression tooling. `/api/dev/inspect`, `/api/dev/takeover`, `/api/dev/shoot` remain gated behind the existing explicit development launcher. The protected authenticated anomaly/feedback developer APIs are untouched.

## Deliberately retained

- `canonical/shared/host/auto-match.ts`, `policy/auto-target.ts`, their compiled forms and normal legacy AI helpers: current normal AI decisions and replay still call them. The names do not make them obsolete.
- `client-v13/legacy-animations.js`: current battle animation renderer, including the lower battlefield routes.
- `PLAYTEST-DEV.cmd`, `tools/playtest-dev.mjs`, Stage 13 development HTML/bootstrap, `node-development.js`, internal dev capability and gated dev endpoints: an explicit current launcher still references them. Removing the whole working development mode would require a separate scope decision.
- Statistics inspector endpoint/store read model and its tests: used by retained Result/career regression tooling. The old Statistics UI browser test itself predates the accepted UI, but its data checks are not assumed disposable.
- Current Story Path history, retained Result/replay history, Game Log and authoritative statistical history: protected current systems. No standalone live History Generation system was found. Historical snapshots needed by narration parity tests are retained.
- Shared artwork, audio, flags, atlases, CSS for current widgets, compatibility/session migration logic and checkpoint recovery: dynamic/shared use makes aggressive removal unsafe. No assets were deleted.

## Exact runtime files modified

- `StoneThrow-v1.427-stage13-development.html`
- `StoneThrow-v1.427-stage13-production.html`
- `client-v13/registry.js`
- `client-v13/shell.js`
- `styles-13.css`
- `styles-14.css`
- `styles-15.css`
- `styles-16.css`
- `styles-18.css`

## Exact files deleted

The complete list below includes retired runtime modules/HTML, source-authoring fragments and obsolete tools; nothing else was deleted.

- `StoneThrow-v1.427-stage10-development.html`
- `StoneThrow-v1.427-stage10-production.html`
- `StoneThrow-v1.427-stage11-development.html`
- `StoneThrow-v1.427-stage11-production.html`
- `StoneThrow-v1.427-stage12-development.html`
- `StoneThrow-v1.427-stage12-production.html`
- `StoneThrow-v1.427-stage5-development.html`
- `StoneThrow-v1.427-stage5-production.html`
- `build.mjs`
- `client-v10/action-instructions.js`
- `client-v10/bootstrap-development.js`
- `client-v10/bootstrap-production.js`
- `client-v10/combat-feedback.js`
- `client-v10/development-adapter.js`
- `client-v10/presentation.js`
- `client-v10/resurrection-sparks.js`
- `client-v10/shell.js`
- `client-v10/story-browser.js`
- `client-v10/story-policy.js`
- `client-v10/story-tutorials.js`
- `client-v11/action-instructions.js`
- `client-v11/bootstrap-development.js`
- `client-v11/bootstrap-production.js`
- `client-v11/combat-feedback.js`
- `client-v11/development-adapter.js`
- `client-v11/node-development.js`
- `client-v11/presentation.js`
- `client-v11/resurrection-sparks.js`
- `client-v11/shell.js`
- `client-v11/story-browser.js`
- `client-v11/story-policy.js`
- `client-v11/story-tutorials.js`
- `client-v11/transport.js`
- `client-v12/action-instructions.js`
- `client-v12/bootstrap-development.js`
- `client-v12/bootstrap-production.js`
- `client-v12/combat-feedback.js`
- `client-v12/development-adapter.js`
- `client-v12/lan.js`
- `client-v12/node-development.js`
- `client-v12/presentation.js`
- `client-v12/resurrection-sparks.js`
- `client-v12/shell.js`
- `client-v12/story-browser.js`
- `client-v12/story-policy.js`
- `client-v12/story-tutorials.js`
- `client-v12/transport.js`
- `client-v13/development-adapter.js`
- `client/shell.js`
- `source/document.json`
- `source/html/document-end.html`
- `source/html/scaffold-overlays.html`
- `source/html/shell.html`
- `source/legacy/engine.js`
- `tools/story-narration/finalize.mjs`
- `tools/story-narration/integrate.py`

## Metadata and audit files

- `build-manifest.json`: removed deleted files and refreshed hashes for changed files/audit artifacts.
- `presentation-manifest.json`: removed retired `client/shell.js`; refreshed only changed CSS entries.
- `tools/cleanup-phase1-removals.json`: deleted-path and byte-count audit.
- `LEGACY-CLEANUP-PHASE1.md`: this report.

## Approximate removal size

56 deleted files; 2,174,940 bytes (2.07 MiB) in deleted files, plus 5,787 characters of obsolete CSS and the removed active-shell DOM/JS. No image/audio assets or databases removed.

## Passing regression checks

TypeScript no-emit check, build-manifest verification and whitespace check passed.

| Test | Result / coverage |
| --- | --- |
| `tools/main-menu-check.mjs` | PASS — 95; desktop/phone destinations, About/Credits, global stats and Human vs AI |
| `tools/register-ui-browser-check.mjs` | PASS — 46; registration, validation, avatar/country, session |
| `tools/options-ui-check.mjs` | PASS — 42; settings/audio, Feedback, Game Log, Main Menu |
| `tools/feedback-browser-check.mjs` | PASS — 31; desktop/phone, snapshots, uploads, HTTP restart |
| `tools/feedback-check.mjs` | PASS — 22; persistent statuses and developer authorization |
| `tools/profile-data-check.mjs` | PASS — 17; profile read model and data safety |
| `tools/saved-battles-check.mjs` | PASS — 26; current Profile, retained Results and saved replay flows |
| `tools/account-settings-ui-check.mjs` | PASS — 24; Edit Profile on desktop/phone |
| `tools/global-hof-browser-check.mjs` | PASS — 75; four format tabs and public UI |
| `tools/global-hof-data-check.mjs` | PASS — 75; authoritative eligibility and ranking |
| `tools/local-group-browser-check.mjs` | PASS — 24; Single Player with 1/2/3 AI, desktop/phone, resume/rematch |
| `tools/online-entry-check.mjs` | PASS — 8 service groups; online lobby, formats, identity, restrictions and restore |
| `tools/spectator-check.mjs` | PASS — 30; public-only spectating |
| `tools/result-screen-browser-check.mjs` | PASS — 25 browser checks plus 9 imported result-fixture checks |
| `tools/replay-browser-check.mjs` | PASS — 20; retained replay rendering |
| `tools/afk-lifecycle-check.mjs` | PASS — 35; 2/3/4-player worker and inline lifecycle |
| `tools/eliminated-leave-check.mjs` | PASS — 152; leave/timeout after defeat does not penalize |
| `tools/anomaly-review-check.mjs` | PASS — 41; retention, manual review, pending scores and audit persistence |
| `tools/group-narrative-check.mjs` | PASS — 23; global Event Log attribution, privacy, restore/rematch |
| `tools/group-sound-check.mjs` | PASS — 45; public hit/miss sounds in 3P/4P, chain and duplicate protection |
| `tools/group-sound-browser-check.mjs` | PASS — browser AudioContext, master/SFX mute, no page errors |
| `tools/game-log-history-check.mjs` | PASS — retained history, chronological export, reload, clear/continue |
| `tools/story-causal-check.mjs` | PASS — 5; real Story causal fixtures and durable resume |
| `tools/story-scout-check.mjs` | PASS — 8; actual Story scouting and disclosure |
| `tools/unit-lore-review-check.mjs` | PASS — 20; Story ending reveal and current Unit Lore |

## Pre-existing test failures — reproduced on accepted base

An isolated detached worktree at the accepted checkpoint was used to rerun the same unchanged tests. All three failures below reproduce before cleanup; they are not reported as passing or repaired in this cleanup-only pass.

- `tools/precommit-story-browser-check.mjs`: waits for `#stStartupEnter` after restoring an already-authenticated Story session; times out at line 7/14 on both base and candidate. Independent Main Menu/Story UI, causal Story, scouting and ending Unit Lore checks pass.
- `tools/online-entry-browser-check.mjs`: its synthetic-clock Registry setup returns 503 during registration at line 11 on both base and candidate. Register browser flow, Online entry service, actual group play, Spectator and AFK checks pass separately.
- `tools/profile-browser-check.mjs`: waits for the obsolete exact `BATTLES` tab at line 10 on both base and candidate. Current UI uses Saved Battles; the newer Saved Battles and Edit Profile suites pass.

## Working tree

Intentionally uncommitted changes on `cleanup-optimization-phase1`, ready for review. No push, merge, deployment or optimization. Accepted checkpoint remains available unchanged.
