# Archive-performance trial (unaccepted)

This performance-only build continues physical-group-stabilization-v1. Gameplay, RNG, privacy, public presentation and assets retain the previous contract. See ../archive-performance/REPORT.md for measurements and evidence. No promotion or deployment is authorized.

Private durable state now consists of **checkpoint.json plus checkpoint.journal** in the existing build-specific state directory. Back up or move the entire state directory while the server is stopped; never copy just checkpoint.json. Never put either file in the served tree or Git. The base file records that the journal is required, so a missing journal fails closed.

Each acknowledged changed state appends a checksummed, sequence-linked journal record and completes fsync before the HTTP success response. Completed immutable archive records are included once per writer lifetime, followed by deltas. Current mutable state is still persisted at each required write. There is no delayed durability, background checkpoint window, lost history, or gameplay RNG change. A write/fsync failure makes the server unavailable; it cannot acknowledge subsequent actions.

Restart verifies the base and the entire journal, applies the archive deltas, then validates recovered authority before serving. Only a torn, non-newline-terminated final record is discarded; corruption of a complete record fails closed. Legacy single-file checkpoints remain readable under their existing build/mode compatibility checks. No earlier build's state is relabeled or deleted.

Full archive export, first transfer after worker replacement, and cold recovery remain proportional to retained history. The append journal also grows with committed working-state snapshots. Automatic compaction is not implemented in this trial; do not truncate it manually. A later safe compaction implementation must retain the same crash/acknowledgement guarantees.

The worker retains its last validated authority only when the parent names the acknowledged private job version and the committed host/seat identities still match. Replacement, new worker, placement changes or changed seat bindings take the full validated restore path. This private cache is not a browser capability.
