# Core Multiplayer / Presentation Stabilization — unaccepted playtest candidate

Derived from accepted `multiplayer-ux-1v1-batch2-v1`. The accepted checkpoint, Batch 6, Stage 14 and golden prototype are unchanged.

Double-click `PLAYTEST-LAN.cmd` on the Windows PC. It verifies the package, starts the production LAN server, opens the PC browser and prints the phone URL. Use that URL on the same Wi-Fi. Node 24 must be installed; no build/install step is required. `PLAYTEST.cmd` is the loopback-only alternative. Port 3212 is preferred, with an available fallback if occupied.

This candidate has its own build-specific private recovery directory outside the served tree. Existing accepted saves are not migrated, erased or reused. Keep the console open while playing.

This batch reduces redundant observer projection before response delivery, adds the original core-style 0.775-second YOUR TURN!!! newsflash, captures board input during noninteractive playback, and anchors special-effect overlays through scroll/resize without changing their animation clocks. Authoritative rules, RNG, privacy, 60-second disconnect policy, assets and CSS remain unchanged. Active-match LEAVE now preserves the Human seat for REJOIN; I GIVE UP remains the explicit surrender action.

See `../REPORT.md` for measurements, focused verification and limitations. The animation-input correction reproduced the pre-trigger suppression for Wizard, Dragon and Demon: out-of-turn rejections advanced the presentation cursor without their omitted frames. Out-of-turn shots are now blocked, rejections cannot acknowledge playback, and rejected commands resynchronize from the last displayed cursor. See ../animation-input/REPORT.md. The exact original five-second pause still needs physical retesting; the measured projection bottleneck was repaired. Repeat the pre-trigger spam cases on physical PC/phone before acceptance.

Disconnect correction: same-battle animation frames retain LAN presence and in-flight heartbeat validity; a server-confirmed disconnect episode shows its newsflash/countdown/controls even while local playback locks board input. See ../disconnect-correction/REPORT.md for exact before/after evidence and remaining physical verification.

Not promoted, pushed or deployed. No 3+/4-player work, UI polish, audio redesign or deferred Batch 6 polish is included.
