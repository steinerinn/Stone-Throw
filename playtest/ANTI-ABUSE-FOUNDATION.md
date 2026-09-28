# Anti-abuse / anomaly foundation — physical review candidate

The latest semi-automatic policy supersedes the earlier automatic REVIEW proposal.
Hidden account-level signals never change gameplay, scores, Reliability, access, or public rankings. Only an authenticated developer/admin can manually REVIEW an account. CLEAR releases held contributions; KEEP UNDER REVIEW preserves the hold. There are no ban/suspend actions.

## Retention and cleanup contract

Existing authoritative `stat_matches` descriptors, ordered `stat_facts` event/command journals, and `stat_participants` summaries/results/score components remain the source of truth. They contain stable participant IDs, modes/counts, timestamps, placement, departure/cutoff/AFK information, special triggers, chain roots and Plague events. No second replay/history copy is created.

`review_retention` pins finalized registered-player matches. SQLite guards reject ordinary deletion/update of their descriptors, command/event facts and results. Existing public replay retention/pruning remains unchanged. Review signals and decisions are append-only. Any later schema migration that removes these structures must first preserve equivalent facts, demonstrate query parity, then explicitly migrate these guards. Do not drop the guards merely to make cleanup succeed.

New accepted ordinary shoot commands carry a compact private `shotAudit`: hit, unit reference/type, core state at shot time, prior cell information, prior unit information. This is computed before resolution, without RNG or state mutation, and remains only in the existing private command journal. Any knowledge, clue or prior unit damage is conservatively treated as information; another cell of a previously hit Castle is not an independent blind discovery. Missing observer knowledge is treated conservatively as known, never blind.

Review read models use accepted shoot commands before the account's takeover cutoff, not `direct-human` versus `direct-ai` labels (those labels historically reflect seat mechanics). Automatic/special/chain impacts are not counted as ordinary shots. AI accounts are excluded. Special event facts remain available in retained journals for future queries.

## Small persistent additions

- `review_retention`: match pointer, extraction version and coverage.
- `review_metrics`: compact per-account/match scalar metrics; no duplicated shot timeline.
- `review_signals`: reason/type/weight, match/time and supporting measurements.
- `review_accounts`, `review_decisions`: manual status, revision, clearing watermark and developer audit.
- `review_pending`: held match/account contribution references, PENDING REVIEW or RELEASED.
- `review_career_hold`: snapshot of existing aggregate values for legacy HOF reads during review.

Backfill runs once per unindexed finalized registered match within a Registry transaction. Future capture indexes and protects each finalized match in its existing transaction. No real private Registry was used for mutation during development tests.

## Initial hidden observations (central configuration: REVIEW_POLICY)

These values are provisional review aids, not population-calibrated probabilities or cheating conclusions:

| Observation | Initial condition | Weight |
| --- | --- | --- |
| Independent unknown core opening | First two ordinary shots hit different, previously unknown core units; complete facts and pre-shot context | 10 |
| Early blind Hero | First ordinary shot / within first three | 2 / 1 |
| High ordinary accuracy | At least 50 ordinary shots and >=80% hits | 2 |
| Hidden-unit hit streak | At least 8 consecutive blind unit hits | 1 |
| Core hit streak | At least 10; explicitly includes informed follow-ups | 1 |
| High Match Score | >=2500 | 1 |
| Large chain | >=150 cells | 1 |
| Technical rejected target | Fresh, server-rejected off-board ordinary shot from bound human Online seat | 10 |

There is deliberately NO automatic REVIEW threshold. Signals accumulate account-wide across modes. The technical hook excludes stale, malformed/unsupported, reconnect, retry, read-only and handed-over seats; repeated same-reason attempts in one match deduplicate. It currently records only objectively off-board rejected shots, not every possible rejection category. No IP data is accepted by this subsystem.

## Developer access and queries

The existing authenticated Registry POST transport and Origin protection are reused. Only accounts whose existing server-side `moderation_role` is `developer` or `admin` may use:

- `dev-review-account` `{playerId}`: combined signals/weight, match metrics, last-20-match rolling ordinary accuracy, co-player counts, wins and wins following other-player Quit, decision history.
- `dev-review-match` `{matchId}`: safe metadata, results/scores/components, exact ordinary-shot sequence, knowledge coverage, signals, result/replay availability.
- `dev-review-search` `{metric,limit}`: highest score/chain/accuracy/streaks or earliest Hero hits; allowed metrics are listed in the module. Limit 1–100.
- `dev-review-decide` `{playerId,action}`: REVIEW, CLEAR, KEEP UNDER REVIEW.

Roles cannot be granted by these endpoints; no public role-setting route or new credentials were introduced. No dashboard was added. Outputs use explicit field lists and omit password hashes, salts, emails, session tokens, seeds and hidden initial placements.

The owner-only `review-notice` endpoint returns manual REVIEW only, never hidden signals. The client checks every 15 seconds while visible; OK dismisses the notice for that account/revision in the current page. Clearing removes it on the next check. Opponents, guests and public Profile/HOF responses receive no review status.

## Leaderboard hold

REVIEW preserves previously accepted public contributions. New finalized contributions are held by account/match reference. Global HOF excludes those references before both Top 3 and six-category aggregation; legacy HOF uses the saved aggregate. Personal history, score records, global statistics and Reliability continue normally. CLEAR releases the pending references and recalculates public views on their next read, retaining all audit history. Relative rank may move when other players improve, and calendar periods still roll over; the held player's published contribution cannot improve from new results.

## Historical limitations

Older beta matches can support ordinary-shot order, hit/type, ratios, streaks, scores, chains, results and relationships when their retained command/event journals are complete. They lack the new pre-shot knowledge snapshot, so the extractor reports historical-unknown rather than claiming a hit was blind. Older Hero core status is not guessed. FirstHeroShot means first ordinary Hero hit; only firstBlindHeroShot supports the new blind-discovery classification. Incomplete journals are labeled and excluded from automatic statistical signal generation. Story matches were never retained here. Pruned public replays are not recreated. External/unreported information shared between people cannot be reconstructed.

Repeated score, cross-mode and asymmetric/co-player patterns are available for review through account metrics/relationships. They do not yet have automatic statistical conclusions. Population data is still needed to calibrate luck, accuracy, score, chain and pair-outcome thresholds, especially after conditioning on placement, known geometry and scouting. Older matches are beta-test reference data, not evidence of misconduct.

## Verification and cleanup

Isolated tests cover hidden-versus-manual status, Castle/scout/chain exclusions, repeated signals, privacy/authorization, pending HOF contributions and release, unchanged stored scores, retention guards, technical stale/retry exclusions, same-household accounts, continued login and restart persistence. Desktop (1440x800) and phone (390x844) notice tests exercise HTTP authorization and CLEAR. Existing Registry, Profile, HOF, scoring and replay checks are also run.

A narrow read-model optimization indexes events once for command lookup rather than repeatedly scanning the entire event list. No historical payload, gameplay code or unrelated UI was deleted as cleanup. Wider cleanup remains constrained by the retention contract above.

## Files changed in this pass

Runtime/source: canonical/shared/host/shot-audit.ts, contracts.ts, lifecycle.ts; corresponding canonical/compiled/host/shot-audit.js and .d.ts, contracts.d.ts, lifecycle.js; server/anomaly-review.mjs, registry.mjs, statistics-store.mjs, global-hall-of-fame.mjs, main.mjs; client-v13/registry.js; styles-registry.css.

Checks/documentation: tools/anomaly-review-check.mjs, tools/anomaly-review-browser-check.mjs, tools/profile-data-check.mjs (explicit isolated malformed-fixture overrides of retention guards), ANTI-ABUSE-FOUNDATION.md, build-manifest.json.

No commit, push, merge or deployment.
