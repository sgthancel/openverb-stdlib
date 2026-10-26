# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-10-25

### Added

- **`ui.focus` — pointing at things.** `element`, `clear`. Draws attention
  to one element without activating it: the verb a guided tour, an
  onboarding walkthrough or a "where do I do that?" answer is mostly made
  of. Until now the library could operate an interface but not show one.
  - Resolves a target by `selector`, `elementId` or visible `label`, in
    that order of precision — so whoever writes a walkthrough can name
    the button by what it says.
  - Names the element rather than a coordinate, which is what lets the
    same instruction survive a redesign, a breakpoint or a theme change.
  - Measures position at call time and returns a `rect`, rather than
    recording one in advance.
  - Marks the element with `data-openverb-focus` for the host's own CSS;
    pass `focusElement` to the hook to use a highlight you already have.
- **`ui.wait` — letting the app catch up.** `for_element`, `for_route`.
  `ui.nav.go` asks a router to move and returns immediately; a step that
  acts on what it expects to find next is racing the application, and
  that race is lost on a slower machine than the one it was written on.
  Both report a timeout rather than throwing — the caller decides whether
  a missing element means stop or carry on, and a wait that cannot fail
  is a hang.
- `FOCUS_VERBS` and `WAIT_VERBS` id constants.
- `src/dom.ts`, exported from the package root: `findElement`,
  `elementPresent`, `mark`, `clearMarks`, `until`, `pathMatches`, and the
  `FOCUS_ATTR` / `LABEL_ATTR` / `DEFAULT_WAIT_MS` constants. The DOM work
  behind the two new families, with an injectable document — usable
  directly by a host that supplies its own highlight but wants the
  element resolution.
- Tests: 27 for the DOM helpers (against a stub document, so no browser
  in devDependencies), and a handler-coverage check that fails if a
  manifest declares a verb the hook cannot answer, or the other way
  round. 64 tests in total.

### Changed

- Unlike most verbs in this library, `ui.focus.*` and `ui.wait.*` work
  with no host wiring at all: they fall back to `querySelector`,
  `getBoundingClientRect` and `window.location`. `focusElement`,
  `clearFocus` and `currentPath` on `OpenVerbConfig` override those
  defaults and are all optional.
- Level 0 is now 9 families, 23 verbs (was 7 and 19).

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
