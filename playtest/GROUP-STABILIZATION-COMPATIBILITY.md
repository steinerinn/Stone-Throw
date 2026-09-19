# Unaccepted Group stabilization compatibility ledger

This trial does not replace core-multiplayer-stabilization-v1. Golden fixtures remain historical evidence.

## Authorized Group AI Plague priority
The golden unfinished Castle/Cavalry chase runs before Plague avoidance. The user explicitly authorized changing that priority for Group play. Protected cells are now excluded from that chase unless they belong to the opponent's sole surviving required core and no activated Hero survives. This may deliberately change the chosen target and subsequent gameplay RNG trajectory; the legacy oracle is not rewritten. Unprotected unfinished targets retain their existing preference. Duel and the separate existing Hero-hunt branches are unchanged. No other Plague algorithm/rule changed.

Local beta execution retains at most 64 private betaAiPlagueDiagnostics records per room in operator recovery state: selected target, protected cells, final-core eligibility, remaining core and activated-Hero survival. These are not included in observer payloads, GAME LOG, HTTP timing headers or served files. No diagnostic consumes gameplay RNG.

## Authorized Group strength display
The Group graph uses separate public-data, dataset and renderer modules. Raw unknown samples remain null. The renderer holds the last public-known value through unknowns; it does not read private strength or backfill raw history. No value is invented before the first known sample. Publicly committed elimination is displayed as zero. This replaces the earlier Group unknown-gap presentation policy. Duel/Story graphs retain their prior implementation.

## Public Scout footprint
Group observers may see coordinates of completed Scout observations on their currently visible boards. Footprints contain only side and cell, not Scout classifications, hidden identities or private geometry.

## Presentation boundary
Changing the displayed Group target clears leftover effects before the replacement board is painted. The room-wide Demon entropy sequence is retained, and a genuinely queued attack on the replacement board still plays. No renderer callback enters authoritative resolution.

## Performance boundaries
Group workers are reused and released after idle timeout/shutdown. Every transferred host remains fully validated at the receiving boundary, and durable export/recovery validation remains intact; duplicate sender-side transfer validation was removed. Public animation frames request only new events and omit unrelated historical journals from their disposable projection view. Authoritative histories, replay, RNG and checkpoint contents are retained. Age-dependent copying/serialization still exists; this trial is faster, not constant-cost, and needs physical long-match verification.
