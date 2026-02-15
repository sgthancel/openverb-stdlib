# OpenVerb Standard Library

[![CI](https://github.com/sgthancel/openverb-stdlib/actions/workflows/ci.yml/badge.svg)](https://github.com/sgthancel/openverb-stdlib/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Verbs](https://img.shields.io/badge/verbs-19-blue.svg)](docs/website-starter-verbs.md)
[![Families](https://img.shields.io/badge/families-7-blue.svg)](docs/website-starter-verbs.md)

A set of canonical verbs most apps need (theme, navigation, search, modals, toasts, forms, sessions). Expose common UI capabilities to AI in a deterministic, auditable way — without DOM hacks or brittle selectors.

> **Install this, and your AI can operate your app.**

## What This Is

Think of it like Python's standard library, but for AI-app interaction. OpenVerb Standard Library gives you the verbs that every app needs so an AI agent can:

- Switch themes
- Navigate pages
- Search content
- Show notifications
- Open modals
- Fill and submit forms
- Check who's logged in

## Verb Families

### Level 0: Website UI Starter

| Family | Verbs | Purpose |
|--------|-------|---------|
| `ui.theme` | `get`, `set` | Theme (light/dark/system) |
| `ui.nav` | `list_pages`, `go`, `back` | Navigation & route discovery |
| `ui.search` | `query`, `open_result` | On-site search |
| `ui.toast` | `show`, `dismiss` | Notifications & feedback |
| `ui.modal` | `open`, `close`, `list` | Modal dialogs |
| `ui.form` | `list`, `fill`, `submit`, `reset` | Form interaction |
| `user.session` | `get`, `logout`, `get_preferences` | User session & preferences |

**Total: 7 families, 19 verbs.**

### Future Levels

| Level | Name | Examples |
|-------|------|----------|
| 1 | App Operations Starter | CRUD, table filters, export, settings |
| 2 | Domain Packs | GIS, Pantry, CAD, etc. |

## Quick Start

### 1. Copy the manifests

Grab the JSON files from `manifests/` and add them to your app's verb definitions:

```
manifests/
  ui.theme.json
  ui.nav.json
  ui.search.json
  ui.toast.json
  ui.modal.json
  ui.form.json
  user.session.json
```

### 2. Implement handlers

Use one of the reference implementations or write your own:

- **Vanilla JS** — `reference/vanilla/verbs.js`
- **React** — `reference/react/useOpenVerb.ts`
- **Next.js** — `reference/nextjs/verbs.ts`

### 3. Wire up your AI

When your AI receives a verb call, dispatch it to your handler:

```javascript
const result = executeVerb("ui.nav.go", { routeId: "accounting" });
// → { success: true, path: "/accounting" }
```

### 4. Apply client-side effects

Verbs return data. Your client applies the effect:

- `ui.nav.go` → call `router.push(path)`
- `ui.theme.set` → update `data-theme` attribute
- `ui.toast.show` → render a toast component

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
