# Routine deployment contract

After owner-approved local testing and commit/push, use `chainsiege-deploy <full-sha>`.
The tool fetches and verifies the explicit commit while production runs. It stops
only CHAIN SIEGE, switches Git, starts it, and verifies direct and HTTPS health,
canonical/foreign Origins, foreign Host rejection and exclusive loopback binding.
nginx stays running. On normal versioned deployments, the Registry, checkpoint and journal are never
opened, backed up, copied, compacted or migrated by this deployment tool.

`--verify` checks the running installation. `--dry-run <full-sha>` also fetches,
stages and validates the target without stopping production. `--recover` retries
an interrupted rollback. A tiny fsynced transaction record precedes shutdown.
Failed verification rolls back Git, preserving state written by the attempted
build. This is safe only while the persistence contract remains unchanged.

## Version discipline

`persistence-contract.json` is the compatibility authority, not a build hash.
Bump `state` for incompatible checkpoint/journal data representation; `registry`
for incompatible Registry schema; `semantics` when persisted values change meaning
or rollback would no longer be safe. Every persistence change must be reviewed
against these rules. A changed contract blocks normal deployment before shutdown
and requires a reviewed migration. Gameplay/AI/HTTP/client changes that preserve
these representations and semantics are normal deployments. Filename heuristics
and commit-specific exceptions are intentionally absent.

The runtime checks explicit state versions. Legacy `controlled-playtest-v1`
records are v1. The legacy `build` field remains pinned to the store's original
build for first-upgrade rollback; `producerBuild` records the actual writer.
Production `/health` identifies the running manifest and persistence contract.
First adoption from an unversioned reader checks unchanged legacy serializer and
Registry implementations. It does not rewrite any old record.

## Restart acceleration

A checksum-verified derivative recovery cache is produced in a background worker
while the server runs (at most one writer, on 32 records/16 MiB or 30 seconds).
The journal is still fsynced before acknowledging commands. Cache publication is
atomic and never required for command success or shutdown. Its journal inode,
byte range, sequence and checksum anchor must match; otherwise startup streams
the journal normally. A valid cache loads the current state/archive dictionary
plus the journal tail. No journal records are removed or rewritten. A missing or
invalid cache affects speed, not match recovery. Backup restoration to a different
journal inode safely falls back to streaming replay.

First adoption may replay the existing journal once before a cache is available.
It receives a 120-second health window; normal versioned deploys retain 20 seconds.
These are failure deadlines, not imposed waits. Live read-only measurement of the
legacy 2.7 GB journal took 35 seconds.
Normal cached restart time depends on live state size and host storage; under ten
seconds is a target, not an unconditional guarantee. Health reports cache use and
replayed record/byte counts. Scheduled backups remain disaster recovery.

## One-time installation (after local testing and approved commit/push)

Root fetches the approved installer commit with Git as steinerinn, then pipes
`git show <full-sha>:playtest/ops/install-deploy.py` to `python3 - <full-sha>`.
No separate file transfer or game deployment occurs. The installer preserves the
old tool under `/var/lib/chainsiege-deploy-v2`, atomically installs the replacement,
and verifies current HTTPS production. It restores the old tool if verification
fails. Existing old tools/recovery evidence remain intact but are superseded;
unresolved old transactions prevent installation. After this one-time operation,
all routine deployments use the single standard command above.

## Initial legacy rollback safeguard

The unversioned reader reads the entire journal into a single string. It cannot
restart with the present multi-gigabyte journal. Only when a first-adoption deploy
FAILS and must return to that unversioned reader, the tool invokes its verified
legacy recovery helper. The helper reads the latest authoritative state using the
staged streaming/cache reader, writes a checksummed legacy-compatible snapshot,
and atomically retains the original checkpoint and journal in
`state/.deploy-legacy-rollback-<transaction>`. It never copies/restores Registry.
All original evidence remains available. Rename interruptions are resumable;
rerunning recovery does not replace newer state after successful recovery.
The pending record and staged reader are retained until recovery succeeds.

This fallback is not run on successful deployment, and is never used between
versioned builds. It is necessary solely to recover the old reader's large-file
limitation. No commit-specific exception or build-hash migration is involved.
