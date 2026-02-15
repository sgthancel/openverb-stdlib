# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in OpenVerb Standard Library, please report it responsibly.

**Do not open a public issue.** Instead, email the maintainer directly or use GitHub's private vulnerability reporting feature.

### What to report

- Manifest definitions that could lead to unintended data exposure
- Reference implementation patterns that bypass security checks
- Verb designs that could be exploited by a malicious AI agent

### Design principles (security-relevant)

- `user.session.get` must never expose tokens, passwords, or session secrets
- `user.session.logout` requires `{ confirmed: true }` — the AI must confirm with the user first
- Form verbs separate `fill` from `submit` so the user can review before submission
- Route registries should filter by user role/permissions before returning results

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |
