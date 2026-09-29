# Registry rate limits behind local nginx

Enable `ST_TRUST_LOOPBACK_PROXY=1` in the CHAIN SIEGE service environment only
when Node stays bound to `127.0.0.1` and the local nginx proxy overwrites this
header in **every** proxied location, including feedback:

```nginx
proxy_set_header X-Real-IP $remote_addr;
```

Do not enable nginx real-IP rewriting from untrusted incoming headers. Its
`$remote_addr` must be the actual client connection address. Keep the existing
Host/Origin configuration. Test nginx configuration before reloading it, then
restart CHAIN SIEGE cleanly to enable the environment setting.

The application defaults to not trusting forwarding headers. With the setting
enabled it accepts exactly one valid IP literal in X-Real-IP from a loopback
socket peer only. Invalid, absent or duplicate headers fall back to the socket
peer. Non-loopback callers cannot override their address. IPv6 spellings and
IPv4-mapped IPv6 are normalized so equivalent addresses use the same bucket.
X-Forwarded-For is never consulted.

Local processes able to connect directly to Node are inside this trust boundary;
a TCP connection cannot prove that a loopback process is specifically nginx.
Do not expose Node directly or give untrusted users local process access.

Registration, challenge and login use the resolved address; username-based
login protection remains unchanged. No gameplay identity or authority changes.

Run `node tools/client-ip-check.mjs` for focused tests. The proxy test models
nginx header replacement; deployment must also verify that actual nginx uses
the directive above. This repository change does not configure the remote host.

The manifest changes with this release. Existing checkpoints still require a
reviewed build-compatibility migration before restarting against this build;
do not reset or discard persistent state to bypass that check.
