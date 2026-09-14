# Accepted 1v1 multiplayer

multiplayer-ux-1v1-batch2-v1 is copied byte-for-byte into playtest/. All 444 payload files and the original manifest are preserved. The embedded historical unaccepted labels remain unchanged to retain the tested manifest and recovery identity; multiplayer-1v1-verification.json records formal acceptance.

Manifest SHA-256: 1cc9b8e65896dba8412949ae33ca543b5bd656fd57bcd229017e369edb934c34

Run: double-click playtest/PLAYTEST-LAN.cmd with Node installed. Verify: node playtest/tools/verify.mjs. Private state is excluded from Git.

Non-blocking deferred items: multiplayer UI, room-list alignment, popup/newsflash visuals, online result presentation, and future edge cases during broader testing. No gameplay/presentation changes, deployment, merge to main UI polish or 3-player work are part of this promotion. Earlier checkpoint branches and original prototype/audit files are preserved.
