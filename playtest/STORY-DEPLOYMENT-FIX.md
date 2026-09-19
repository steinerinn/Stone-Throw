# Story deployment / streamed-command correction

Unaccepted candidate; no promotion or deployment.

The narration WAV Content-Length edit accidentally also modified the NDJSON gameplay response headers in server/main.mjs. That response handler evaluated path.extname(file), but file exists only in the static asset handler. A valid command could resolve on the authoritative host and then fail while sending its response. The outer error handler reported HTTP 400 malformed-request; the client correctly displayed its reconnect banner. Retrying did not repair the broken streamed-response code.

Reproduction: normal production playtest launcher configuration, durable temporary state, fresh Story followed by Main Menu / Start Over / Chapter 1 / deployment; a valid streamed random-placement request returned 400 malformed-request. Merely checking that the 5×5 grid appeared did not exercise this failure, which explains the previous narration test's coverage gap.

Fix: remove the out-of-scope WAV header expression from the NDJSON response handler only. Keep WAV Content-Length in the static asset handler. No retry, validation, error banner, routing, reward, audio, or gameplay changes.

Checks passed:
- Production playtest configuration with persistence: Chapter 1 continuation and Start Over reach the 25-cell Story map; streamed placement returns an accepted NDJSON result; no transport banner.
- Reload restores the same Story deployment.
- Malformed read requests still return HTTP 400 malformed-request.
- Non-Story simulated connection failure still displays the server-unavailable REJOIN banner; after restoring connectivity, REJOIN recovers the identical public snapshot.
- Existing narration check: all 63 routes, all 19 WAV byte/text mappings, native browser playback/decoding, stop on close/advance, missing-file fallback, mobile controls and first Story deployment.
- Existing mode-preservation check: Single Player / Story exact state and RNG, multiplayer separation, durable restart recovery.
- Full tools/verify.mjs rerun after updating the manifest.

Files changed in this correction:
- server/main.mjs
- tools/story-narration/deployment-check.mjs (focused regression test)
- STORY-DEPLOYMENT-FIX.md
- build-manifest.json

Ready for physical Story testing using PLAYTEST.cmd. Candidate remains unaccepted. Existing build-bound saves are retained in their prior state directories; the launcher selects the corrected build's private state directory normally.
