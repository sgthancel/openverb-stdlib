# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-02-15

### Added

- **Level 0: Website UI Starter** — 7 families, 19 verbs
  - `ui.theme` — get, set (light/dark/system)
  - `ui.nav` — list_pages, go, back (route registry pattern)
  - `ui.search` — query, open_result
  - `ui.toast` — show, dismiss
  - `ui.modal` — open, close, list (modal registry pattern)
  - `ui.form` — list, fill, submit, reset (form registry + fill-then-submit pattern)
  - `user.session` — get, logout, get_preferences
- JSON Schema manifests for all 7 verb families
- Documentation: full verb specs, example conversation flows, registry designs
- Navigation patterns guide (static, dynamic, role-based, deep linking)
- Reference implementations:
  - Vanilla JS (`reference/vanilla/verbs.js`)
  - React hook (`reference/react/useOpenVerb.ts`)
  - Next.js App Router (`reference/nextjs/verbs.ts`, `reference/nextjs/routeRegistry.ts`)
- Manifest validation script
- GitHub issue templates (bug report, feature request, new verb proposal)
- CI workflow for manifest validation
