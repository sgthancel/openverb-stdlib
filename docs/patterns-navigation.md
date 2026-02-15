# Navigation Patterns

How to implement OpenVerb navigation verbs across different app architectures.

## Pattern 1: Static Route Registry

Best for apps with a known set of pages (marketing sites, dashboards, admin panels).

### Define your routes once

```json
[
  {
    "id": "dashboard",
    "title": "Dashboard",
    "path": "/dashboard",
    "tags": ["home", "overview", "stats"],
    "requiresAuth": true
  },
  {
    "id": "accounting",
    "title": "Accounting",
    "path": "/accounting",
    "tags": ["billing", "invoices", "payments"],
    "requiresAuth": true
  },
  {
    "id": "settings",
    "title": "Settings",
    "path": "/settings",
    "tags": ["preferences", "account", "profile"],
    "requiresAuth": true
  },
  {
    "id": "help",
    "title": "Help Center",
    "path": "/help",
    "tags": ["support", "docs", "faq"],
    "requiresAuth": false
  }
]
```

### How the AI uses it

1. `ui.nav.list_pages` returns the full array
2. AI matches user intent to `tags` (e.g. "billing" -> Accounting)
3. AI proposes the page by `title`
4. AI navigates by `id` using `ui.nav.go`

The AI never guesses URLs. It always uses the registry.

---

## Pattern 2: Dynamic Route Registry

Best for apps where pages are generated from data (CMS, multi-tenant, user-created content).

### Build the registry at runtime

```typescript
// Your app generates routes from data
function buildRouteRegistry(userProjects: Project[]): Route[] {
  const staticRoutes = [
    { id: "dashboard", title: "Dashboard", path: "/dashboard", tags: ["home"], requiresAuth: true },
    { id: "settings", title: "Settings", path: "/settings", tags: ["account"], requiresAuth: true },
  ];

  const projectRoutes = userProjects.map((p) => ({
    id: `project-${p.id}`,
    title: p.name,
    path: `/projects/${p.id}`,
    tags: ["project", ...p.labels],
    requiresAuth: true,
  }));

  return [...staticRoutes, ...projectRoutes];
}
```

### `ui.nav.list_pages` returns the combined list

The AI sees both static pages and user-specific pages. It can say:
"I see your project 'Q1 Budget'. Want me to open it?"

---

## Pattern 3: Role-Based Filtering

Only show routes the current user can access.

```typescript
function getRoutesForUser(allRoutes: Route[], userRole: string): Route[] {
  const roleAccess: Record<string, string[]> = {
    admin: ["dashboard", "accounting", "settings", "users", "help"],
    member: ["dashboard", "accounting", "help"],
    viewer: ["dashboard", "help"],
  };

  const allowed = roleAccess[userRole] || [];
  return allRoutes.filter((r) => allowed.includes(r.id));
}
```

The AI only sees routes the user has access to. No "permission denied" surprises.

---

## Pattern 4: Combining Navigation with Search

Use `ui.search.query` to find content, then `ui.nav.go` to navigate.

### Flow: "Find invoices from last month"

1. AI calls `ui.search.query` with `{ query: "invoices last month" }`
2. Search returns results with URLs
3. AI presents: "I found 3 invoice-related pages"
4. User picks one
5. AI calls `ui.search.open_result` or `ui.nav.go` with the path

### When to use search vs. nav

| Use case                      | Verb                                        |
| ----------------------------- | ------------------------------------------- |
| User names a page             | `ui.nav.go` (by id)                         |
| User describes what they want | `ui.search.query` → `ui.search.open_result` |
| User says "go back"           | `ui.nav.back`                               |
| AI needs to know all pages    | `ui.nav.list_pages`                         |

---

## Pattern 5: Deep Linking with Parameters

For dynamic routes like `/projects/[id]` or `/invoices/[invoiceId]`:

```json
{
  "id": "invoice-detail",
  "title": "Invoice Detail",
  "path": "/invoices/:invoiceId",
  "tags": ["invoice", "billing", "detail"],
  "requiresAuth": true
}
```

The AI uses `ui.nav.go` with `path` instead of `routeId`:

```json
{
  "path": "/invoices/inv-2024-001"
}
```

The app resolves the path using its router.

---

## Anti-Patterns

### Don't: Let the AI construct URLs

```
// BAD - AI is guessing
AI: "I'll navigate you to /app/main/accounting/dashboard/v2"
```

### Do: Use the route registry

```
// GOOD - AI uses registered id
AI calls ui.nav.go({ routeId: "accounting" })
```

### Don't: Expose internal route structure

```json
// BAD
{ "id": "accounting", "path": "/app/v2/modules/accounting/index.html" }
```

```json
// GOOD
{ "id": "accounting", "path": "/accounting" }
```

### Don't: Return routes the user can't access

The AI shouldn't propose pages that will 403. Filter the registry by the user's role/permissions before returning it from `ui.nav.list_pages`.

---

## Framework-Specific Navigation

| Framework              | How `ui.nav.go` applies       |
| ---------------------- | ----------------------------- |
| Next.js (App Router)   | `router.push(path)`           |
| Next.js (Pages Router) | `router.push(path)`           |
| React Router           | `navigate(path)`              |
| Vue Router             | `router.push(path)`           |
| SvelteKit              | `goto(path)`                  |
| Vanilla JS             | `window.location.href = path` |

The manifest is the same. Only the handler changes.
