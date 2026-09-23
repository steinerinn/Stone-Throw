> Follow-up: the approved local Single Player integration is now implemented, UNACCEPTED / UNPROMOTED. See SINGLE-PLAYER-LOCAL-GROUP.md for current scope and verification. The audit/entry-only statements below describe the earlier stage.

# Single Player multi-participant architecture audit

Status: AUDIT ONLY — authority implementation stopped pending review.
Branch: online-game-ui-phase1. Candidate remains UNACCEPTED / UNPROMOTED.

## Terminology
“Four-card rule” is not a combat rule. Per user clarification it means reusing existing 3/4-participant battlefield presentation: boards, unit strips, target routes and elimination updates.

## Findings
1. Existing canonical Group combat and AI execution can run one Human plus two/three AI without another Human client. An isolated service probe created each configuration, issued real random-placement/start commands, and confirmed non-placement state, one joined Human binding, AI opponents and existing public multi-board projection. No combat source change was needed. This is not yet a local Single Player lifecycle.
2. The current Group service wrapper cannot be used unchanged as a true local session. It requires room/seat binding and its AI drain pauses when no live Human heartbeat exists. Return may create an absence episode; leave closes the last-Human room; rematch uses consent and the coordinator creates another room. These are correct Online behaviors and must remain untouched for Online.
3. Existing Single Player uses createLocalSession/createLocalAuthority with a two-participant configuration, local single/story recovery slots, local rematch and Single Player statistics classification. Routing an AI-only Group through pvp/make would still make it an Online room and misclassify persistence/lifecycle/statistics. That shortcut is unsuitable.
4. Multi-board presentation can be reused substantially as-is. online-overview.js consumes snapshot.online (board views, ring, target, names and completion); overview-board.js paints public cells/strips. Group projection already supplies that data. The adjacent group-lan.js controller is NOT a neutral renderer: it owns heartbeat, Ready, room status, disconnect UI and pvp/rematch requests. A local controller/adapter must supply the same public rendering data without installing those Online behaviors.

## Recommended bounded integration
Keep the existing two-player local host for one AI. Add a local Group session facade for two/three AI that delegates to shared existing Group combat/projection/AI operations, with an explicit local lifecycle. Do not duplicate combat or hide an Online room behind a Single Player label.

The facade should provide the same server-owned read/dispatch/configure/private-checkpoint/statistics interfaces as local slots. It owns one Human identity and selected NPC identities, enforces the AI-only opponent roster, and exposes no public listing, join code, seat credential or disconnect policy. Pause/resume follows the existing local Main Menu/recovery contract. A fresh rematch retains active AI count and accepted identity behavior, resets through the canonical setup path, and enters deployment directly.

Persistence needs a versioned slot discriminator for legacy local 1v1 versus local Group snapshots, preserving old saves and keeping Story independent. Host/RNG/pending decisions remain private. Statistics must continue to classify the match as Single Player rather than Duel/3 Players/4 Players; no HOF or score policy change is implied.

## Files / authority boundaries requiring adaptation (proposal, not edits)
- server/main.mjs: local session creation/routing, save/restore slots and correct statistics descriptor; no Online endpoint rerouting.
- new server/local-group-session.mjs (proposed): local session facade and lifecycle.
- server/ring-pvp.mjs and possibly ring worker/export helpers: make existing combat/AI/projection operations reusable with explicit local lifecycle rather than duplicating the resolver. Exact extraction boundary needs implementation review.
- canonical local-host/session.js interface: preserve the current 1v1 implementation; use a facade at server selection rather than forcing it to pretend it supports multiple opponents. Canonical combat/resolver/RNG need no design changes.
- client-v13/bootstrap-production.js, story-browser.js and transport.js: select/mount a local Group session and stream the existing progress format without invoking Online rejoin; Story behavior unchanged.
- a new local Group UI controller plus shared setup-card module/styles: local Start, pause/resume and direct rematch actions; use current Registry/NPC identity mappings.
- client-v13/online-overview.js / overview-board.js: reuse public battlefield rendering. Minimal mount integration may be required; no geometry or disclosure redesign.
- result action integration: connect existing results to local rematch/menu handlers, preserving result rendering/timing and awards. Current Group result buttons delegate to group-lan actions, so this boundary must be explicitly handled.
- tools: focused 2/3/4-participant start/rematch/resume tests, authority/RNG parity, statistics mode separation, browser layouts and existing Online regressions.

This is a bounded cross-layer architecture change, larger than a small UI adapter. It does not require a new combat model. It should be reviewed and implemented separately from the already-working Online room lifecycle.

## Work performed before the requested architecture stop
Online-only cleanup: consistent AVAILABLE GAMES headings, consistent game-code helper text, explicit card/control ordering, tighter empty status spacing, narrow-screen reflow and opaque entry backdrop to prevent underlying menu bleed-through. Runtime changes this turn: client-v13/online-entry.js and styles-online-entry.css only. No Single Player setup, authority, save format, rematch, renderer or statistics implementation changed.

Verification: existing Online browser suite 14 PASS at desktop/phone widths; private discovery/join suite 14 PASS. Isolated existing Group service startup probes PASS for 3 and 4 participants. Screenshots: workspace outputs/online-game-ui-phase1/cleanup/create-1440.png and create-390.png (and Join equivalents). These are Online evidence, not Single Player screenshots. Physical testing and all proposed local Group integration remain outstanding.

No commit, push, merge or deployment.
