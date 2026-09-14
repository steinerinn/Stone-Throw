# Multiplayer UX / 1v1 Batch 2 — unaccepted playtest candidate

Derived from the unaccepted Multiplayer UX Batch 1 candidate. Accepted presentation-parity-batch6-v1, Batch 5, Stage 14 and the golden prototype remain protected and unchanged.

Double-click PLAYTEST-LAN.cmd on the Windows PC. Node must already be installed; no build or install step. It verifies all packaged files, starts production LAN mode on port 3212 (or an available fallback), opens the PC browser and prints the URL for your phone on the same network. Keep the console open; Ctrl+C stops it. Windows firewall/network access still applies. PLAYTEST.cmd is loopback-only.

Choose the Create or Join tab. Create has one CREATE GAME action. Join accepts a game code or a JOIN button from the automatically refreshed Open LAN Games list. Enter your display name. Place armies and press READY, or use the creator's Quick Start proposal and the opponent's ACCEPT/DECLINE. Batch 1 consent and Ready rules are unchanged.

Return using the same browser profile and exact server URL. Player-facing recovery is REJOIN. Credentials remain HttpOnly, SameSite and server-bound, retained across browser closure for one day. Returning to an active duel opens Main Menu with REJOIN or I GIVE UP. REJOIN preserves the exact existing seat/match and clears pending takeover. I GIVE UP immediately hands the existing seat to AI and frees the user at Main Menu. A kicked player receives the cannot-rejoin popup and OH WELL THEN returns normal Main Menu freedom.

Disconnect grace is now 60 seconds, configured once in server/disconnect-policy.mjs after the existing 7-second missed-heartbeat threshold. The opponent sees a DISCONNECTED newsflash and popup with a live timer and AUTO KICK / WAIT. No choice is imposed if neither button is selected. AUTO KICK removes the choices and allows X to dismiss the popup without cancelling the server policy; the server transfers the seat at zero unless the player successfully rejoins first. WAIT keeps the popup open, counts below zero indefinitely, and offers immediate KICK at any time. Policy, start time, revocation and takeover wording survive server recovery. Each takeover stores one shared decorative character variant selected outside gameplay RNG. No AFK warnings or reliability statistics are added.


Leave returns to the Multiplayer menu. Independent Single Player and Story sessions remain preserved. Castle attacker disclosure now keeps isolated hits Unknown even when a different connected hit pair is identified; 8-neighbour connections reveal only the connected hits.

The launcher uses a new build-specific private state directory outside this candidate, separate from Batch 1 and accepted builds. Earlier saves are neither migrated nor removed. Persistence/rejoin applies within this build and server origin.

See ../correction/REPORT.md for this current correction and focused verification. Earlier follow-up reports are historical. Physical PC/phone browser closure, REJOIN, Wait and Auto Kick still deserve manual playtesting. No promotion, push, deployment, 3+/4-player UX, accounts, ratings, audio changes or Batch 6 polish work.

Disconnect isolation correction: request-body intake no longer holds the shared server mutation queue. Takeover detaches the former Human session and leaves only an immutable, consumable notice with the already-selected character. The late-return popup does not poll the abandoned match, display a LEFT newsflash, or gate the survivor. OH WELL THEN consumes the notice persistently. Newsflashes are free-floating battlefield text that slides in and fades, never popup boxes. AUTO KICK's X sits in the popup's top-right corner.

Running authoritative roots complete before disconnect policy is processed. As explicitly authorized, an awaiting-Human-decision boundary may show disconnect UI while preserving that exact decision/root for REJOIN or the existing AI controller. Renderer playback completes before live disconnect presentation appears; no renderer acknowledgement controls gameplay.
