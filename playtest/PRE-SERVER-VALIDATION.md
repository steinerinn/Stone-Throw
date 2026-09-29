# Pre-server final validation — 29 September 2026

Candidate build: `c4fb8aae1ff1970d2c5f25284f4aa1faa8c5ee9a341ab390737e4ff14165481a`.
No commit, push, deployment, UI redesign or performance tuning.

## 1–3. Active recovery and reliability

PASS: 3P (two registered humans + one AI) and 4P (two registered humans + two AIs).

Tests used real child Node processes, forcibly terminated without graceful shutdown after 26 commands, then restarted on the same port with the same external storage. A test clock added 90 seconds of downtime; a separate variant staggered the last human heartbeats by four seconds. Tests covered playtest snapshot persistence and production journal persistence. The 90-second gap was simulated; process termination/restart was real.

The serialized authoritative host was identical before termination and after restore/rejoin: placements, unit lifecycle/special state, hits/misses, pending decisions, turn/round, remaining actions, history and RNG. Room code and human seat credentials were preserved. Recovery rotates transport epoch/revision intentionally; it does not start a new gameplay match. Reading from the recovered event cursor returned no duplicate events or presentation frames.

Desktop (1440px) and phone (390px) browsers opened Welcome, selected Rejoin, and rendered the restored 225-cell boards without page errors. No human was replaced by AI. Both full matches continued to natural Result. Both human accounts in each match received Full, zero AFK/Disconnect outcomes, 100% reliability and cleanStreak=1. Existing incidents are preserved by the targeted regression test.

After natural Result, the rooms were retired from the hot set, persisted, and the process was killed/restarted again. Cold-room hydration restored the exact authoritative host and finished public Result. The separate lifecycle suite verified archive integrity rejection and durable liveness overlay recovery.

## 4–5. Full-match sanity

Final journal-backed runs, including staggered-heartbeat recovery:

| Format | Commands | Early median / p95 | Middle median / p95 | Late median / p95 |
| --- | ---: | ---: | ---: | ---: |
| 3P | 186 | 59 / 341 ms | 72 / 211 ms | 103 / 385 ms |
| 4P | 201 | 73 / 410 ms | 113 / 882 ms | 145 / 690 ms |

These measure complete HTTP command responses, including authoritative AI/reaction resolution and persistence—not animation duration or first streamed-frame latency. Occasional command peaks were 1.31 seconds (3P) and 1.99 seconds (4P). No command hung and both final-shot/Result paths completed. Some late-game latency increase is measurable; these tests do not establish a new regression or justify tuning. Keep 3P/4P performance on the watchlist.

Heap samples at the ends of each third: 3P 69→99→48 MB; 4P 219→136→63 MB. There was no monotonically growing heap in these runs. These are sanity samples, not a leak proof or physical Wi-Fi feel assessment.

Both full matches covered ordinary AI shots, Archer, Catapult, Dragon, Demon, Goblin, Wizard, Assassin and Plague presentation/event groups. Exact recovery-history comparisons and catch-up checks passed. Peasant Revolt was not reached naturally; its separate 71-check suite passed.

## 6. Production readiness

PASS: actual `node server/main.mjs --lan` entrypoint started in production without the development launcher on Node v24.19.0. Package requirement is >=24 <25, consistent with this test and use of built-in node:sqlite.

- `/` served exactly the current Stage 13 production HTML and production bootstrap.
- Normal production buttons did not expose Automatch, Test Statistics, Story Auto Resolve, Developer Mode or Demo Mode.
- Development API probes returned 403; development HTML/bootstrap, private server source returned 404.
- All 537 allowlisted assets/modules were requested successfully, including narration/music. Existing literal runtime-file references were checked against the allowlist. Production browser startup had no page errors.
- Production server/client source inspection found no required hardcoded user-machine/test-directory dependency.
- Tests used external ST_STATE_DIR and ST_REGISTRY_DIR locations. Checkpoints, journal, liveness and retired-room archives live under ST_STATE_DIR; Registry, retained statistics/replays and feedback live under ST_REGISTRY_DIR.
- Deployment must explicitly set a persistent ST_STATE_DIR: omission intentionally disables match checkpoint persistence. Registry has a user-data default, but an explicit durable deployment directory is appropriate. No deployment configuration was installed.
- `/health` and startup logs identify production mode, recovery status and full build hash. The build manifest verifies all 1,102 entries.

## 7. Actual defect fixed

Reproduced: four-second heartbeat skew prevented the existing shared-network-outage heuristic from recognizing a server restart, so recovered human seats accrued false disconnect counts.

Fix: authoritative process startup explicitly records a SERVER INCIDENT for previously connected active human seats before reconciliation. It uses the existing incident exemption mechanism. It does not clear genuine existing absences, disconnect counts, AFK history or decisions. This fixed both 3P and 4P staggered-heartbeat cases. The local recovery compatibility list includes the previous candidate because no save format changed.

Runtime changes this pass: server/main.mjs and server/shared-incidents.mjs. Recovery compatibility/build metadata updated. No gameplay, RNG, scoring or animation changes.

## 8. Checks

- pre-server-validation: full 3P/4P snapshot recovery; full journal recovery and cold-result process recovery; staggered-heartbeat recovery; desktop/phone Rejoin.
- pre-server-production-check: actual production entrypoint, UI, 537 assets, development gating and external persistence.
- server-recovery-incident-check: explicit incident, staggered timestamps and preservation of genuine prior history.
- optimization-lifecycle-check: 47 checks.
- afk-lifecycle-check: 35 checks.
- afk-policy-check: 57 checks.
- afk-registry-check: 38 checks.
- persistence-fault-check: 19 checks.
- optimization-presentation-check: canonical Catapult payload/catch-up/privacy across four viewers.
- revolt-check: 71 checks.
- build manifest and whitespace checks passed.

One old online-reliability-check fixture could not run: its hand-created SQLite schema lacks the current started_at column. This was a fixture failure; current-schema AFK/Registry tests and the full-match Registry assertions above passed. No production change was made for that obsolete fixture.

Raw full journal results: C:/Users/Notandi/AppData/Local/Temp/cs-pre-server-UWuNOa/report.json.
Browser recovery results: C:/Users/Notandi/AppData/Local/Temp/cs-pre-server-CfNn5W/report.json.

An additional result-screen-regression-check run timed out during its 3P rematch sequence after driving Leave/Rejoin directly through the API while pages remained open. It was waiting for the second Result panel, while that page showed Welcome/Main Menu. This extra regression is not green and was not established as a production defect in this pass; no rematch change was made. The requested natural-Result, exact recovery, real browser Rejoin and Registry outcome checks passed. Do not interpret this report as every historical suite passing.
