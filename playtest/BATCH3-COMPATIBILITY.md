# Batch 3 — unaccepted playtest candidate

Parent: presentation-parity/batch-2-usability. Accepted Stage 14 and all earlier checkpoints are unchanged.

## Explicitly authorized Castle correction

Golden v1.427 reveals Castle artwork after two hits on the same Castle, including separated hits. The user explicitly authorized a post-migration privacy/presentation correction: separated hits with unhit gaps remain generic Unknown. Two touching hit cells establish identification; existing adjacent Scout disclosure, explicit Catapult wall disclosure, destruction and already-identified rendering remain intact. Unidentified observations contain no Castle type or tile mask. This changes disclosure, not damage, shots, placement or RNG.

The original golden source, frozen expectations and the separated-hit runtime diagnostic are preserved outside this candidate. This is intentionally different from that historical oracle, not a claim of exact golden parity.

## Settled-root terminal boundary

Normal PvAI and Story now finish queued root work before committing terminal outcome. Their execution adapter defers intermediate terminal checks; the exhausted-root boundary evaluates the result once. Already-triggered Archer retaliation can therefore produce Draw. Completed hosts reject ordinary commands, and the renderer ignores stale/repeated updates after the committed result. Multiplayer elimination and Auto Match use their existing execution options.

## Public resurrection feedback

Two public event kinds, resurrection-rejected and resurrection-found, carry only the publicly resolved board/cell fact. They restore the existing “Not this” and “Found!” callouts without exposing the private selected candidate or changing search costs, selection, damage or RNG.

## Performance and playback

Repeated updates are serialized and deduplicated. Event Log rows are appended rather than rebuilt. Removed animation elements are released from cleanup bookkeeping; visual functions/timing remain unchanged. Observer projections are reused within a response/capture, presentation capture clones mutable state rather than the whole journal, and identical private checkpoints avoid redundant serialization/writes. Schema validation skips an impossible null alternative instead of constructing an exception; validation requirements are unchanged. Histories are retained, not truncated.

Focused tests demonstrate improvements, not constant-time processing or complete elimination of long-game lag. User playtesting is still required. No acceptance tag is created.
