# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-10-25

### Fixed

- **The four `ui.form.*` verbs did nothing.** They returned
  `{ success: true }` and never touched a form. That is the worst shape a
  stub can take: a walkthrough calls fill, is told it worked, and submits
  an empty form a beat later with nothing anywhere saying why. Every
  other unconfigured verb in this library says so plainly. They now do
  the work, against `[data-openverb-id]`, and report which fields were
  actually set.

### Added

- `forms`, `fillField`, `submitForm` and `resetForm` on `OpenVerbConfig`,
  all optional, for an app that would rather fill its own fields.
- `ui.form.fill` accepts a single `field`/`value` pair as well as a
  `values` map. A walkthrough usually fills one field per beat so there
  is something to say between them.
- `ui.form.fill` output now carries `filled` and `missing`.
- `findForm`, `findField`, `setFieldValue` and `FORM_ATTR` exported.

### Notes

Filling a React field correctly took three attempts, and only a real
browser caught the first two.

- Assigning `.value` is invisible to React, which shadows the prototype
  accessor with its own value tracker and treats the write as already
  seen. Text fields go through the prototype descriptor instead.
- The same trick does not work for checkboxes. React wires a checkbox
  `onChange` to the CLICK event, so setting `checked` and firing
  input/change ticks the box and tells the application nothing. A
  checkbox is clicked, and only when it is not already in the state
  being asked for, because a click toggles.

The unit tests passed both broken versions, because the stub they ran
against was easier to satisfy than a real input. They now model React's
value tracker as an own property shadowing the prototype, and the
checkbox as something that toggles on click. Verified against React
18.3.1 in a browser: 10 assertions on live state, plus 84 unit tests.

## [0.2.1] - 2026-10-25

### Fixed

- `reference/react/useOpenVerb.ts` was a second, hand-maintained copy of
  the hook, and 0.2.0 shipped it still answering nineteen verbs — so
  anyone who pasted it got a walkthrough that could operate an app but
  not point at it. Its `executeVerb` was also synchronous, which returns
  a pending Promise for the two waiting verbs instead of a result. It now
  re-exports the package hook: one implementation, nothing to drift.
  Copy-paste without a build step is what `reference/vanilla/verbs.js` is
  for, and that one is standalone and up to date.
- `reference/nextjs/verbs.ts` imported `usePathname` and never used it.
  It now wires it to `currentPath`, which is what `ui.wait.for_route`
  needs: `router.push` resolves before the route has rendered, and
  `usePathname` re-renders on arrival.

### Added

- The handler-coverage check now runs against every implementation that
  claims to answer the whole verb set, not just the package hook, and
  asserts that the React reference stays a re-export. Verified by
  breaking it on purpose: it names the missing verb.

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
