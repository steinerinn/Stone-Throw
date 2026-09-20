# Registered Story progression (Phase 2 trial)

This candidate remains unaccepted and unpromoted.

Registered Story progression is stored in the private Registry's additive `story_progress` table, keyed by immutable `player_id`. There is no client-writable progress endpoint. The server records the completed Story board's configuration, authoritative outcome, public Plague-target handoff and continuation branch context. It does not store battlefield cells, shots, damage, pending choices, RNG or a mid-battle save in this account record.

An authenticated account is bound when the Story battle starts. Guest play is never attached retroactively after login. Draws, Give Up and a lost final battle do not advance the account record. The furthest completed board is retained; replaying earlier boards cannot erase it. Continue reconstructs the existing next-chapter narration/deployment with the same result and conditional Cleric routing. A live in-page Story session can still be resumed normally. After reload, the Main Menu first offers an unfinished battle from this browser’s existing local Story recovery slot. If none exists, account continuation uses the completed checkpoint. Another device receives completed progression only.

The account record survives browser/server restart and Display Name changes. Story remains excluded from career/Hall-of-Fame statistics. Existing Guest Story history remains local. Registered browser history/lore caches are namespaced by Player ID; old Guest progress is not migrated. The account record is not a cross-device copy of the full browser narrative-history cache.

Start Over starts a new run without lowering the account's furthest completed checkpoint. There is no new progress-reset service in this task.

## Physical checks

1. Log in, complete a Story battle, then open Main Menu and Continue Story. Check the next narration and deployment.
2. Close/restart the launcher/browser and log in to the same account. Continue must resume the existing unfinished local Story battle if present; on another browser/device without that local battle, it must offer the completed checkpoint’s next chapter.
3. On a second browser/device, log in to that account and Continue. Check the same chapter, including the Cleric branch if reached.
4. Log out and use another account or Guest. Neither should inherit the first account's progression; Guest local progression should still work.
5. Discover adjoining Castle cells. Existing wall art should remain present until replacement tile decoding completes. Exact physical flicker still requires visual confirmation.

Focused automated checks: `node tools/castle-swap-check.mjs`, `node tools/story-account-check.mjs`, `node tools/story-storage-check.mjs`.
