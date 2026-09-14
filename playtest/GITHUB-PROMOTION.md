# Recommended promotion (not performed)

1. Preserve the existing GitHub repository and golden prototype. Create a new branch and add this accepted tree under a new directory such as `playtest/` in a separate worktree or clean clone.
2. Copy the complete accepted directory, including assets, canonical source/compiled files, public browser code, Node server, docs and manifest. Historical filename/version labels are intentional. Do not publish a generic static directory listing.
3. Include the Stage 14 completion report and compact sanitized evidence separately if desired. Keep the golden and Stage 0–13 audit/checkpoint history intact; link them instead of copying private test saves.
4. Never add `checkpoint.json`, `server.lock`, temporary checkpoints, browser profiles, cookies or the evidence recovery-state directories. Keep runtime state outside the repository. Ignore node_modules and local state paths.
5. Run `node tools/verify.mjs`, review the diff, and open a PR describing controlled-playtest hardening. Review licensing/artwork provenance already applicable to the project before any public distribution.
6. Merge/push/deploy only with separate authorization. No repository replacement, GitHub push or deployment was performed in Stage 14.
