# Feedback system — physical review candidate

Options now opens Feedback with Report a Bug and Share an Idea. Both require a description and support an optional screenshot. Bug reports can attach a copied snapshot of the newest recorded Game Log. Sending no longer uses email. Game Log recording, history and export remain supported.

## Exact runtime files changed for feedback

- StoneThrow-v1.427-stage13-production.html
- StoneThrow-v1.427-stage13-development.html
- client-v13/options-ui.js
- client-v13/feedback.js
- client-v13/game-log.js
- styles-feedback.css
- server/main.mjs
- server/registry.mjs
- server/feedback.mjs

Other existing working-tree changes belong to earlier review tasks.

## Storage and limits

Feedback is stored in the existing external Registry SQLite database, registry.sqlite, in tables feedback and feedback_actions. Screenshots are BLOBs with server-generated UUID references; logs are copied TEXT. No uploaded filename is used as a filesystem path. The configured ST_REGISTRY_DIR controls location; the Windows default is %LOCALAPPDATA%/ChainSiege/Registry. Deployment must retain or migrate this external database, just as it must retain account data. No deployment was performed.

Screenshot: PNG, JPG/JPEG or WEBP, maximum 3 MiB, maximum 8192 pixels per dimension and 24 million pixels total. Server checks MIME, encoded size, signatures and container structure/dimensions; it does not fully decode/re-encode images. SVG is rejected. Description: 8,000 characters. Game Log: 8 MiB. Submissions are limited to 10 per hour per account/browser. Feedback contents are private to authenticated developers/admins.

Stored metadata includes UUID, BUG/IDEA, NEW/REVIEWED/RESOLVED, server timestamp, account or existing guest identity, build, available mode/match context, screen, description, screenshot reference and log snapshot. Account/session credentials are not copied into metadata. Player-written text and attachments remain untrusted content.

## Developer API foundation

All routes use POST /api/registry/ and the existing authenticated developer/admin role and same-origin checks. No dashboard was added.

- dev-feedback-list: optional type ALL/BUG/IDEA, status ALL/NEW/REVIEWED/RESOLVED, offset; 50 summaries per page.
- dev-feedback-get: id; returns description, context, screenshot MIME/base64 and copied log.
- dev-feedback-status: id and status REVIEWED or RESOLVED; persists status and an audit action.

Normal players and unauthenticated callers cannot read or change reports. Public submission returns only the new report ID and confirmation.

## Verification

- tools/feedback-check.mjs: 22 checks passed, isolated Registry; validation, authorization, filters, status updates and restart persistence.
- tools/feedback-browser-check.mjs: 31 checks passed; desktop 1440x900 and phone 390x844, actual submissions, PNG/JPEG/WEBP, invalid uploads, stable log snapshot, server restart and no page errors.
- tools/options-ui-check.mjs: 42 checks passed; Options controls, Feedback entry/back, audio, Game Log and Main Menu.
- tools/game-log-history-check.mjs: passed; retained history, chronological export, reload, read-only viewing and clear/continue.
- All six screenshots visually inspected: Feedback, Bug and Idea at desktop and phone sizes.

Screenshots: C:/Users/Notandi/Documents/Codex/feedback-review-evidence/ (feedback, bug, idea; suffixes -1440.png and -390.png).

Only physical review remains: wording, spacing, phone keyboard comfort and selecting a screenshot on the player's device. Restart the existing fixed-port playtest launcher to load server changes. Nothing committed, pushed, merged or deployed.
