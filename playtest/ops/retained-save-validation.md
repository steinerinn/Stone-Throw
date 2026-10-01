# Retained-session save latency regression (2026-10-01)

The supplied production log reports 119 commands, median command response 687 ms,
median server persistence 487 ms, median disk-write/fsync scope 73.9 ms, and
median post-render paint opportunity 5 ms. The running production build was
`e723ec5fa57d7aea72eb07c8db5db4e75952a900`; the pending deployment/cache changes
were not installed. Read-only inspection found 44 sessions and a 2 GiB journal.
The base checkpoint retained 36 two-board slots plus two group slots; two-board
checkpoint strings alone accounted for approximately 5.7 MB before duplication
into active/slot fields and further JSON escaping.

`tools/retained-save-check.mjs` generates its own seven retained two-board games
(~6.8 MB of checkpoint strings) plus an active four-player game. It does not copy
production data. Before this fix, median command response was 667 ms and measured
persistence 638 ms. With cached UTF-8 JSON fragments/vector writes, two runs gave
158/135 ms response and 141/82 ms persistence. Disk timings vary with OS caching;
these are local comparisons, not promised production latency.

The writer no longer repeatedly escapes and creates huge contiguous nested JSON
strings for unchanged checkpoints. A bounded 64 MiB cache reuses their exact
encoded fragments. SHA256 hashes cover the same payload bytes; vectored appends
handle partial writes, and fsync still completes before acknowledging commands.
There is no checkpoint version/format change, retention change, data deletion,
Registry change or reduction in bytes retained on disk. Existing readers can
restore the new journal records. This reduces blocking during saves; separate
browser/network causes of image/profile loading delay are not ruled out.

Validation:
- 580 byte-for-byte JSON/checksum, Unicode, eviction and partial-write checks.
- Retained and active host/history/RNG snapshots survive restart unchanged.
- Read-only reads do not append gameplay journal records.
- 537 MB streamed journal, cache/tail recovery and legacy-reader rollback pass.
- Persistence fault injection: 19 checks pass.
- 55-command local gameplay/recovery regression passes.
- Three/four-player exact recovery and continued play pass.
- Local/online three/four-player pacing/state/RNG parity: 10 checks pass.
- Deployment-tool state-machine/rollback tests: 7 pass.

Not committed, pushed, installed or deployed. Owner physical review remains next.
