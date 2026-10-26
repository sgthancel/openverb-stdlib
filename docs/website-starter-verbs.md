# OpenVerb Website Starter Verbs

**OpenVerb Standard Library** provides the starter verb definitions that every app should have. These are not exhaustive — they're the common baseline that gives an AI agent immediate capabilities. Your app defines its own verb libraries for domain-specific actions on top of these.

## Level 0: Website UI Starter

The starter set of verbs that every app should ship with. These give an AI the basics it needs to operate any site. Your app extends this with its own verb libraries for domain-specific functionality.

| Family       | Verbs                        | Purpose                      |
| ------------ | ---------------------------- | ---------------------------- |
| ui.theme     | get, set                     | Theme (light/dark/system)    |
| ui.nav       | list_pages, go, back         | Navigation & route discovery |
| ui.search    | query, open_result           | On-site search               |
| ui.toast     | show, dismiss                | Notifications & feedback     |
| ui.modal     | open, close, list            | Modal dialogs                |
| ui.form      | list, fill, submit, reset    | Form interaction             |
| ui.focus     | element, clear               | Drawing attention            |
| ui.wait      | for_element, for_route       | Letting the app catch up     |
| user.session | get, logout, get_preferences | User session & preferences   |

---

## Theme

### `ui.theme.get`

Returns the current theme mode.

**Input:** `{}` (no args)

**Output:**

```json
{
  "mode": "light" | "dark" | "system",
  "resolved": "light" | "dark"
}
```

### `ui.theme.set`

Set the application theme.

**Input:**

```json
{
  "mode": "light" | "dark" | "system"
}
```

**Output:**

```json
{
  "success": true,
  "mode": "dark",
  "previousMode": "light"
}
```

---

## Navigation

### `ui.nav.list_pages`

Returns the app's route registry so the AI knows what pages exist. The AI uses this to answer "Where can I find X?" and to propose navigation.

**Input:** `{}` (no args)

**Output:**

```json
{
  "routes": [
    {
      "id": "accounting",
      "title": "Accounting",
      "path": "/accounting",
      "tags": ["billing", "invoices", "payments"],
      "requiresAuth": true
    }
  ]
}
```

### `ui.nav.go`

Navigate to a page by `id` from the route registry. The client applies the navigation when the verb succeeds.

**Input:**

```json
{
  "routeId": "accounting"
}
```

Or by path (for dynamic routes):

```json
{
  "path": "/lists/abc-123"
}
```

**Output:**

```json
{
  "success": true,
  "path": "/accounting"
}
```

### `ui.nav.back`

Navigate back in history.

**Input:** `{}`

**Output:**

```json
{
  "success": true
}
```

---

## Search

### `ui.search.query`

Search the app's content. Returns results the AI can present to the user or act on.

**Input:**

```json
{
  "query": "invoices",
  "scope": "pages",
  "limit": 5
}
```

| Field | Required | Description                                       |
| ----- | -------- | ------------------------------------------------- |
| query | yes      | Search query string                               |
| scope | no       | Narrow results (e.g. "pages", "docs", "products") |
| limit | no       | Max results (default: 10)                         |

**Output:**

```json
{
  "results": [
    {
      "id": "result-001",
      "title": "Invoices Dashboard",
      "snippet": "View and manage all invoices...",
      "url": "/accounting/invoices",
      "type": "page"
    }
  ],
  "total": 3
}
```

### `ui.search.open_result`

Open a search result by id. Navigates the user to the result.

**Input:**

```json
{
  "resultId": "result-001"
}
```

**Output:**

```json
{
  "success": true,
  "url": "/accounting/invoices"
}
```

---

## Toast Notifications

### `ui.toast.show`

Show a toast notification. Use for confirmations, warnings, or transient messages.

**Input:**

```json
{
  "message": "Settings saved successfully",
  "variant": "success",
  "duration": 5000
}
```

| Field    | Required | Description                                             |
| -------- | -------- | ------------------------------------------------------- |
| message  | yes      | Message to display                                      |
| variant  | no       | `info`, `success`, `warning`, `error` (default: `info`) |
| duration | no       | Auto-dismiss after ms (default: 5000, 0 = persistent)   |

**Output:**

```json
{
  "success": true,
  "toastId": "toast-abc"
}
```

### `ui.toast.dismiss`

Dismiss a specific toast or all toasts.

**Input:**

```json
{
  "toastId": "toast-abc"
}
```

Omit `toastId` to dismiss all toasts.

**Output:**

```json
{
  "success": true
}
```

---

## Modals

### `ui.modal.list`

List all registered modals the AI can open.

**Input:** `{}`

**Output:**

```json
{
  "modals": [
    {
      "id": "confirm-delete",
      "title": "Confirm Delete",
      "description": "Asks the user to confirm a delete action"
    },
    {
      "id": "new-invoice",
      "title": "New Invoice",
      "description": "Create a new invoice form"
    }
  ]
}
```

### `ui.modal.open`

Open a modal by id. Optionally pass data to pre-fill or configure the modal.

**Input:**

```json
{
  "modalId": "new-invoice",
  "data": { "customerId": "cust-123" }
}
```

**Output:**

```json
{
  "success": true,
  "modalId": "new-invoice"
}
```

### `ui.modal.close`

Close the currently open modal, or a specific modal by id.

**Input:**

```json
{
  "modalId": "new-invoice"
}
```

Omit `modalId` to close the top-most modal.

**Output:**

```json
{
  "success": true
}
```

---

## Forms

### `ui.form.list`

List all registered forms on the current page or view.

**Input:** `{}`

**Output:**

```json
{
  "forms": [
    {
      "id": "contact-form",
      "title": "Contact Us",
      "fields": [
        { "name": "name", "type": "text", "label": "Full Name", "required": true },
        { "name": "email", "type": "email", "label": "Email", "required": true },
        { "name": "message", "type": "textarea", "label": "Message", "required": true }
      ]
    }
  ]
}
```

### `ui.form.fill`

Fill form fields with values. Does **not** submit — use `ui.form.submit` after filling.

**Input:**

```json
{
  "formId": "contact-form",
  "values": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "message": "I'd like to learn more about your services."
  }
}
```

**Output:**

```json
{
  "success": true,
  "filled": ["name", "email", "message"]
}
```

### `ui.form.submit`

Submit a form by id. Returns validation errors if the form is invalid.

**Input:**

```json
{
  "formId": "contact-form"
}
```

**Output (success):**

```json
{
  "success": true,
  "errors": []
}
```

**Output (validation failed):**

```json
{
  "success": false,
  "errors": [{ "field": "email", "message": "Invalid email address" }]
}
```

### `ui.form.reset`

Reset a form to its default values.

**Input:**

```json
{
  "formId": "contact-form"
}
```

**Output:**

```json
{
  "success": true
}
```

---

## Focus

Every other family in this library lets an AI _operate_ an application.
This one lets it _show_ an application: a guided tour, an onboarding
walkthrough, or an answer to "where do I do that?" that points instead of
describing. Until 0.2.0 the library had no way to say "look here".

**Pointing is not pressing.** Neither verb clicks, submits, or changes
anything. If you want the thing acted on as well, point first and act
second — the viewer has to be shown where to look before anything moves,
or they are watching the aftermath of something they missed.

### `ui.focus.element`

Draw the user's attention to one element.

A target can be named three ways, tried in that order:

| Field       | Use it when                                                      |
| ----------- | ---------------------------------------------------------------- |
| `selector`  | You know the markup. Prefer a stable id over a positional path.  |
| `elementId` | Same, shorter.                                                   |
| `label`     | You know what the control _says_, not what it is called in code. |

**Name the element, never a coordinate.** A screen recording says "click
at 420, 310" and breaks the first time a button moves. A selector
survives a redesign, a responsive breakpoint and a theme change — the
whole reason to describe a walkthrough declaratively rather than film it.

**Input:**

```json
{
  "selector": "#field-name",
  "label": "Start with a name",
  "scroll": true
}
```

**Output:**

```json
{
  "success": true,
  "found": true,
  "rect": { "x": 312, "y": 188, "width": 240, "height": 38 }
}
```

`rect` is measured at call time, in viewport pixels, which is what lets
the same instruction point correctly at a layout that has changed since
it was written. `found: false` with `success: false` means nothing
matched, so a caller can skip the step rather than point at nothing.

**Output (nothing matched):**

```json
{
  "success": false,
  "found": false
}
```

**Applying the effect.** The handler sets two attributes on the element
and leaves the look to you:

```css
[data-openverb-focus] {
  outline: 2px solid var(--accent);
  box-shadow: 0 0 0 8px color-mix(in oklab, var(--accent) 25%, transparent);
}
[data-openverb-focus]::after {
  content: attr(data-openverb-label);
}
```

If the app already has a highlight of its own, pass `focusElement` to
`useOpenVerb` and that is called instead.

### `ui.focus.clear`

Stop drawing attention to anything. Call it when a walkthrough ends _or
is cancelled_, so the interface is left as it was found.

**Input:** `{}`

**Output:**

```json
{
  "success": true
}
```

---

## Wait

The unglamorous half of a walkthrough. `ui.nav.go` asks a router to move
and returns immediately; a step that acts on what it expects to find next
is racing the application, and that race is lost on a slower machine than
the one the sequence was written on.

Both verbs **report** a timeout rather than throwing. The caller decides
whether a missing element means stop or carry on — and a wait that cannot
fail is a hang, so there is always a deadline.

### `ui.wait.for_element`

Wait until an element is present — or, with `gone: true`, until it is
not, which is how you wait out a modal or a spinner.

**Input:**

```json
{
  "selector": "#structure-list",
  "gone": false,
  "timeoutMs": 5000
}
```

**Output:**

```json
{
  "success": true,
  "timedOut": false,
  "waitedMs": 112
}
```

A condition that already holds costs nothing: the check runs before any
waiting does. Most of these calls are insurance rather than a pause.

### `ui.wait.for_route`

Wait until navigation has actually landed. Takes a `routeId` from the
route registry, or a `path`.

**Input:**

```json
{
  "routeId": "folders",
  "timeoutMs": 5000
}
```

**Output:**

```json
{
  "success": true,
  "timedOut": false,
  "path": "/app/folders",
  "waitedMs": 240
}
```

`path` is where the app actually is, which is the thing worth having when
it is not where you asked it to go. Comparison ignores leading and
trailing slashes and allows the app to be mounted under a prefix, so a
route declared as `folders` matches `/app/folders/`.

---

## User Session

### `user.session.get`

Get the current user's session info. Returns auth status, display name, and role. **Never exposes tokens or passwords.**

**Input:** `{}`

**Output:**

```json
{
  "authenticated": true,
  "user": {
    "id": "user-456",
    "displayName": "Jane Doe",
    "email": "jane@example.com",
    "role": "admin"
  }
}
```

### `user.session.logout`

Log the user out. The AI **must** confirm with the user before calling this verb.

**Input:**

```json
{
  "confirmed": true
}
```

**Output:**

```json
{
  "success": true
}
```

### `user.session.get_preferences`

Get the current user's preferences.

**Input:** `{}`

**Output:**

```json
{
  "preferences": {
    "language": "en",
    "timezone": "America/New_York",
    "notifications": true
  }
}
```

---

## Example Flows

### The "Accounting Page" Flow

1. User: "I want to know about the accounting stuff"
2. AI calls `ui.nav.list_pages`
3. AI sees `{ id: "accounting", title: "Accounting", path: "/accounting" }`
4. AI: "There's an Accounting page. Do you want me to take you there?"
5. User: "Yes"
6. AI calls `ui.nav.go` with `{ routeId: "accounting" }`
7. Client navigates to `/accounting`

### The "Search and Navigate" Flow

1. User: "Find me something about invoices"
2. AI calls `ui.search.query` with `{ query: "invoices" }`
3. AI sees results: Invoices Dashboard, Invoice Templates, etc.
4. AI: "I found 3 results for invoices. The top hit is the Invoices Dashboard. Want me to open it?"
5. User: "Yes"
6. AI calls `ui.search.open_result` with `{ resultId: "result-001" }`
7. Client navigates to `/accounting/invoices`

### The "Dark Mode" Flow

1. User: "Switch to dark mode"
2. AI calls `ui.theme.set` with `{ mode: "dark" }`
3. Client applies the theme change
4. AI: "Done — switched to dark mode."

### The "Fill a Form" Flow

1. User: "Help me fill out the contact form"
2. AI calls `ui.form.list` to see available forms
3. AI: "I see a Contact Us form with fields for name, email, and message. What should I fill in?"
4. User: "Name is Jane Doe, email is jane@example.com, message is 'I'd like a demo'"
5. AI calls `ui.form.fill` with the values
6. AI: "Form is filled out. Should I submit it?"
7. User: "Yes"
8. AI calls `ui.form.submit` with `{ formId: "contact-form" }`

### The "Guided Tour" Flow

The shape every walkthrough has, and the order matters:

1. `ui.focus.element` with `{ selector: "#field-name", label: "Start with a name" }`
2. Narrate, or let the user read. **This is the point of the pause** — the
   viewer is being told where to look.
3. `ui.form.fill` with the value
4. `ui.focus.element` on the submit button, narrate, then `ui.form.submit`
5. `ui.wait.for_element` on whatever the submission produces, so the next
   step is not acting on a screen that has not arrived
6. `ui.focus.element` on the result — the payoff has to be visible; a tour
   that says a thing was made and then shows nothing has gone quiet at
   exactly the wrong moment
7. `ui.focus.clear`

### The "Show Confirmation" Flow

1. AI performs some action (e.g. saves settings)
2. AI calls `ui.toast.show` with `{ message: "Settings saved!", variant: "success" }`
3. Toast appears and auto-dismisses after 5 seconds

---

## Route Registry Design

You don't want the AI guessing URLs. Expose a deterministic registry:

```json
{
  "id": "accounting",
  "title": "Accounting",
  "path": "/accounting",
  "tags": ["billing", "invoices", "payments"],
  "requiresAuth": true
}
```

- **id**: Stable identifier for `ui.nav.go`. Use kebab-case.
- **title**: Human-readable name for the AI to mention.
- **path**: Actual path. For dynamic routes, use a template like `/lists/[id]` or provide a lookup.
- **tags**: Keywords for semantic search ("accounting", "billing", etc.).
- **requiresAuth**: Whether the route requires login.

---

## Modal Registry Design

Similar to the route registry, register modals so the AI knows what's available:

```json
{
  "id": "confirm-delete",
  "title": "Confirm Delete",
  "description": "Asks the user to confirm a delete action"
}
```

The AI calls `ui.modal.list` to discover modals, then `ui.modal.open` to trigger them. The `data` field lets the AI pass context into the modal (e.g. which item to delete).

---

## Form Registry Design

Register forms so the AI can discover and interact with them:

```json
{
  "id": "contact-form",
  "title": "Contact Us",
  "fields": [
    { "name": "name", "type": "text", "label": "Full Name", "required": true },
    { "name": "email", "type": "email", "label": "Email", "required": true },
    { "name": "message", "type": "textarea", "label": "Message", "required": true }
  ]
}
```

The separation of `fill` and `submit` is intentional — it lets the AI confirm values with the user before submitting, and lets the user make corrections.

---

## Verb Library Levels

| Level | Name                   | Contents                                           |
| ----- | ---------------------- | -------------------------------------------------- |
| 0     | Website UI Starter     | Theme, nav, search, modals, toasts, forms, session |
| 1     | App Operations Starter | CRUD, table filters, export, settings              |
| 2     | Domain Packs           | GIS, Pantry, CAD, etc.                             |

---

## Implementation Notes

- **Client-side application**: Verbs like `ui.theme.set` and `ui.nav.go` return success; the client applies the change when the verb result is received (e.g., in chat).
- **Route registry**: Maintain a single source of truth that both `ui.nav.list_pages` and your app's nav use.
- **Modal registry**: Register modals by id so the AI can discover and open them. The registry lives alongside your component definitions.
- **Form registry**: Register forms with their fields so the AI can discover, fill, and submit them.
- **Framework-agnostic**: Manifests are JSON. Handlers are framework-specific (Next.js `router.push`, React Router `navigate()`, vanilla `window.location`, etc.).
- **Security**: `user.session.get` never exposes tokens. `user.session.logout` requires explicit confirmation. Forms validate server-side regardless of AI input.
