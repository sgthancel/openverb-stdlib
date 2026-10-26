# OpenVerb Standard Library

[![CI](https://github.com/sgthancel/openverb-stdlib/actions/workflows/ci.yml/badge.svg)](https://github.com/sgthancel/openverb-stdlib/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Verbs](https://img.shields.io/badge/verbs-23-blue.svg)](docs/website-starter-verbs.md)
[![Families](https://img.shields.io/badge/families-9-blue.svg)](docs/website-starter-verbs.md)

A starter set of verb definitions that every app should have — theme, navigation, search, modals, toasts, forms, sessions, pointing, and waiting. These are the common baseline. Your app defines its own verb libraries for domain-specific actions on top of these.

> **The verbs every app needs. Your app adds the rest.**

## What This Is

This is **not** a complete list of all possible verbs — OpenVerb is designed so developers create their own verb libraries for their own domains. This stdlib gives you the **starter verbs** that virtually every app needs, so an AI agent can immediately:

- Switch themes
- Navigate pages
- Search content
- Show notifications
- Open modals
- Fill and submit forms
- Check who's logged in
- Point at something without pressing it
- Wait for the app to catch up before acting again

## Verb Families

### Level 0: Website UI Starter

| Family         | Verbs                              | Purpose                      |
| -------------- | ---------------------------------- | ---------------------------- |
| `ui.theme`     | `get`, `set`                       | Theme (light/dark/system)    |
| `ui.nav`       | `list_pages`, `go`, `back`         | Navigation & route discovery |
| `ui.search`    | `query`, `open_result`             | On-site search               |
| `ui.toast`     | `show`, `dismiss`                  | Notifications & feedback     |
| `ui.modal`     | `open`, `close`, `list`            | Modal dialogs                |
| `ui.form`      | `list`, `fill`, `submit`, `reset`  | Form interaction             |
| `ui.focus`     | `element`, `clear`                 | Drawing attention            |
| `ui.wait`      | `for_element`, `for_route`         | Letting the app catch up     |
| `user.session` | `get`, `logout`, `get_preferences` | User session & preferences   |

**9 starter families, 23 starter verbs.** Your app adds its own verb libraries on top of these.

### Future Levels

| Level | Name                   | Examples                              |
| ----- | ---------------------- | ------------------------------------- |
| 1     | App Operations Starter | CRUD, table filters, export, settings |
| 2     | Domain Packs           | GIS, Pantry, CAD, etc.                |

## Part of the OpenVerb Ecosystem

This is the **standard library** for the [OpenVerb](https://github.com/sgthancel/openverb) framework — an open, text-first standard for describing what actions an AI is allowed to perform inside an application.

| Package            | Registry                                                                                   | Description                                        |
| ------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `openverb`         | [npm](https://www.npmjs.com/package/openverb) / [PyPI](https://pypi.org/project/openverb/) | Core framework — load & validate verb libraries    |
| `@openverb/stdlib` | npm (this repo)                                                                            | Standard verb definitions for common UI operations |

## Quick Start

### 1. Install

```bash
# Install the core framework + standard library
npm install openverb @openverb/stdlib
```

Or with Python:

```bash
pip install openverb
# Then copy manifests/ from this repo into your project
```

### 2. Use the manifests

The JSON verb definitions live in `manifests/`:

```
manifests/
  ui.theme.json
  ui.nav.json
  ui.search.json
  ui.toast.json
  ui.modal.json
  ui.form.json
  ui.focus.json
  ui.wait.json
  user.session.json
```

### 3. Implement handlers

Use one of the reference implementations or write your own:

- **Vanilla JS** — `reference/vanilla/verbs.js`
- **React** — `reference/react/useOpenVerb.ts`
- **Next.js** — `reference/nextjs/verbs.ts`

### 4. Wire up your AI

When your AI receives a verb call, dispatch it to your handler:

```javascript
const result = executeVerb("ui.nav.go", { routeId: "accounting" });
// → { success: true, path: "/accounting" }
```

### 5. Apply client-side effects

Verbs return data. Your client applies the effect:

- `ui.nav.go` → call `router.push(path)`
- `ui.theme.set` → update `data-theme` attribute
- `ui.toast.show` → render a toast component
- `ui.focus.element` → style `[data-openverb-focus]` however you like

## Showing, Not Just Doing

`ui.focus` and `ui.wait` exist for a different job from the rest of the
library. Everything else lets an AI operate an application; these two let
it _show_ an application — a guided tour, an onboarding walkthrough, an
answer to "where do I do that?" that points instead of describing.

```javascript
await executeVerb("ui.focus.element", {
  selector: "#field-name",
  label: "Start with a name",
});
```

Two things are deliberate:

**Name the element, never a coordinate.** A screen recording says "click
at 420, 310" and breaks the first time a button moves. A selector
survives a redesign, a responsive breakpoint and a theme change, which is
the whole reason to describe a walkthrough declaratively rather than film
it. `ui.focus.element` also accepts an `elementId`, or a visible `label`
— so whoever writes the tour can name the button by what it says.

**Pointing is not pressing.** `ui.focus.element` changes nothing and
submits nothing. It sets `data-openverb-focus` on the element and returns
where that element is right now, measured at call time. Style it from
your own CSS, or pass `focusElement` to the hook to use a highlight you
already have:

```css
[data-openverb-focus] {
  outline: 2px solid var(--accent);
  box-shadow: 0 0 0 8px color-mix(in oklab, var(--accent) 25%, transparent);
}
[data-openverb-focus]::after {
  content: attr(data-openverb-label);
}
```

`ui.wait` is the unglamorous half. `ui.nav.go` asks a router to move and
returns immediately; a step that acts on what it expects to find next is
racing the application, and that race is lost on a slower machine than
the one the tour was written on. Both wait verbs report a timeout rather
than throwing — the caller decides whether a missing element means stop
or carry on, and a wait that cannot fail is a hang.

## Route Registry

For `ui.nav.list_pages` and `ui.nav.go`, maintain a route registry so the AI knows what pages exist:

```json
{
  "id": "accounting",
  "title": "Accounting",
  "path": "/accounting",
  "tags": ["billing", "invoices", "payments"],
  "requiresAuth": true
}
```

The AI uses `id` to navigate — it never guesses URLs.

## Example: The "Accounting Page" Flow

1. User: "I want to know about the accounting stuff"
2. AI calls `ui.nav.list_pages`
3. AI sees a route with tags matching "accounting"
4. AI: "There's an Accounting page. Do you want me to take you there?"
5. User: "Yes"
6. AI calls `ui.nav.go({ routeId: "accounting" })`
7. Client navigates to `/accounting`

## Repo Layout

```
openverb-stdlib/
  docs/
    website-starter-verbs.md    Full verb specs + examples
    patterns-navigation.md      Navigation patterns & anti-patterns
  manifests/
    ui.theme.json               Theme verbs manifest
    ui.nav.json                 Navigation verbs manifest
    ui.search.json              Search verbs manifest
    ui.toast.json               Toast verbs manifest
    ui.modal.json               Modal verbs manifest
    ui.form.json                Form verbs manifest
    ui.focus.json               Attention verbs manifest
    ui.wait.json                Synchronisation verbs manifest
    user.session.json           Session verbs manifest
  reference/
    vanilla/verbs.js            Plain JS implementation
    react/useOpenVerb.ts        React hook implementation
    nextjs/verbs.ts             Next.js App Router wrapper
    nextjs/routeRegistry.ts     Route registry helpers
```

## Design Principles

- **Framework-agnostic core**: Manifests are JSON. Handlers are framework-specific.
- **Deterministic**: The AI uses registries (routes, modals, forms) — no guessing.
- **Auditable**: Every verb call has typed input/output. You can log, replay, and review.
- **Safe by default**: `user.session.get` never exposes tokens. `user.session.logout` requires confirmation.
- **Composable**: Verbs are small and independent. Combine them for complex flows.

## Docs

- [Website Starter Verbs](docs/website-starter-verbs.md) — Full spec for all Level 0 verbs
- [Navigation Patterns](docs/patterns-navigation.md) — Patterns, anti-patterns, and framework-specific guidance

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- [Report a bug](.github/ISSUE_TEMPLATE/bug_report.md)
- [Request a feature](.github/ISSUE_TEMPLATE/feature_request.md)
- [Propose a new verb](.github/ISSUE_TEMPLATE/new_verb.md)

## License

[MIT](LICENSE) — use it however you want.
