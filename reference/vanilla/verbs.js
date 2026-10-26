/**
 * OpenVerb Standard Library — Vanilla JS Reference Implementation
 *
 * Framework-agnostic verb handlers using plain DOM APIs.
 * Copy and adapt these for any project.
 */

// ---------------------------------------------------------------------------
// Route Registry
// ---------------------------------------------------------------------------

/**
 * Define your app's route registry. This is the single source of truth
 * for what pages exist and how the AI can navigate to them.
 *
 * @type {Array<{id: string, title: string, path: string, tags: string[], requiresAuth: boolean}>}
 */
const routeRegistry = [
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    tags: ["home", "overview"],
    requiresAuth: true,
  },
  {
    id: "accounting",
    title: "Accounting",
    path: "/accounting",
    tags: ["billing", "invoices", "payments"],
    requiresAuth: true,
  },
  {
    id: "settings",
    title: "Settings",
    path: "/settings",
    tags: ["preferences", "account"],
    requiresAuth: true,
  },
];

// ---------------------------------------------------------------------------
// Modal Registry
// ---------------------------------------------------------------------------

const modalRegistry = [
  {
    id: "confirm-delete",
    title: "Confirm Delete",
    description: "Asks the user to confirm a delete action",
  },
];

// ---------------------------------------------------------------------------
// Verb Handlers
// ---------------------------------------------------------------------------

const verbHandlers = {
  // -- Theme ----------------------------------------------------------------

  "ui.theme.get": () => {
    const stored = localStorage.getItem("theme") || "system";
    const resolved =
      stored === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : stored;
    return { mode: stored, resolved };
  },

  "ui.theme.set": ({ mode }) => {
    const previousMode = localStorage.getItem("theme") || "system";
    localStorage.setItem("theme", mode);
    document.documentElement.setAttribute("data-theme", mode);
    return { success: true, mode, previousMode };
  },

  // -- Navigation -----------------------------------------------------------

  "ui.nav.list_pages": () => {
    return { routes: routeRegistry };
  },

  "ui.nav.go": ({ routeId, path }) => {
    const target = routeId ? routeRegistry.find((r) => r.id === routeId) : null;
    const href = target ? target.path : path;
    if (!href) return { success: false };
    window.location.href = href;
    return { success: true, path: href };
  },

  "ui.nav.back": () => {
    window.history.back();
    return { success: true };
  },

  // -- Search ---------------------------------------------------------------

  "ui.search.query": ({ query, scope, limit = 10 }) => {
    // Example: search route registry by tags and title
    const q = query.toLowerCase();
    const results = routeRegistry
      .filter(
        (r) => r.title.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        title: r.title,
        snippet: `Navigate to ${r.title}`,
        url: r.path,
        type: "page",
      }));
    return { results, total: results.length };
  },

  "ui.search.open_result": ({ resultId }) => {
    const route = routeRegistry.find((r) => r.id === resultId);
    if (!route) return { success: false };
    window.location.href = route.path;
    return { success: true, url: route.path };
  },

  // -- Toast ----------------------------------------------------------------

  "ui.toast.show": ({ message, variant = "info", duration = 5000 }) => {
    const toastId = `toast-${Date.now()}`;
    const el = document.createElement("div");
    el.id = toastId;
    el.className = `openverb-toast openverb-toast--${variant}`;
    el.textContent = message;
    document.body.appendChild(el);
    if (duration > 0) {
      setTimeout(() => el.remove(), duration);
    }
    return { success: true, toastId };
  },

  "ui.toast.dismiss": ({ toastId } = {}) => {
    if (toastId) {
      document.getElementById(toastId)?.remove();
    } else {
      document.querySelectorAll(".openverb-toast").forEach((el) => el.remove());
    }
    return { success: true };
  },

  // -- Modal ----------------------------------------------------------------

  "ui.modal.list": () => {
    return { modals: modalRegistry };
  },

  "ui.modal.open": ({ modalId, data }) => {
    const modal = document.getElementById(modalId);
    if (!modal) return { success: false };
    if (data) modal.dataset.openverbData = JSON.stringify(data);
    modal.showModal?.() ?? modal.classList.add("open");
    return { success: true, modalId };
  },

  "ui.modal.close": ({ modalId } = {}) => {
    const modal = modalId
      ? document.getElementById(modalId)
      : document.querySelector("dialog[open], .modal.open");
    if (!modal) return { success: false };
    modal.close?.() ?? modal.classList.remove("open");
    return { success: true };
  },

  // -- Form -----------------------------------------------------------------

  "ui.form.list": () => {
    const forms = Array.from(document.querySelectorAll("form[data-openverb-id]"));
    return {
      forms: forms.map((form) => ({
        id: form.dataset.openverbId,
        title: form.dataset.openverbTitle || form.dataset.openverbId,
        fields: Array.from(form.elements)
          .filter((el) => el.name)
          .map((el) => ({
            name: el.name,
            type: el.type || "text",
            label: el.labels?.[0]?.textContent || el.name,
            required: el.required,
          })),
      })),
    };
  },

  "ui.form.fill": ({ formId, values }) => {
    const form = document.querySelector(`form[data-openverb-id="${formId}"]`);
    if (!form) return { success: false, filled: [] };
    const filled = [];
    for (const [name, value] of Object.entries(values)) {
      const el = form.elements[name];
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        filled.push(name);
      }
    }
    return { success: true, filled };
  },

  "ui.form.submit": ({ formId }) => {
    const form = document.querySelector(`form[data-openverb-id="${formId}"]`);
    if (!form) return { success: false, errors: [{ field: "_form", message: "Form not found" }] };
    if (!form.checkValidity()) {
      const errors = Array.from(form.elements)
        .filter((el) => !el.validity.valid)
        .map((el) => ({ field: el.name, message: el.validationMessage }));
      return { success: false, errors };
    }
    form.requestSubmit();
    return { success: true, errors: [] };
  },

  "ui.form.reset": ({ formId }) => {
    const form = document.querySelector(`form[data-openverb-id="${formId}"]`);
    if (!form) return { success: false };
    form.reset();
    return { success: true };
  },

  // -- Focus ----------------------------------------------------------------
  //
  // Pointing, which is a different job from operating. Neither of these
  // clicks, submits or changes anything: they are what a guided tour is
  // made of, and a tour has to show you where to look before it moves.

  "ui.focus.element": ({ selector, elementId, label, scroll }) => {
    const el = resolveTarget({ selector, elementId, label });
    if (!el) return { success: false, found: false };

    if (scroll !== false) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    // A plain attribute rather than injected styling: the page owns how a
    // focused thing looks, and can target [data-openverb-focus] in its
    // own stylesheet.
    clearFocusMarks();
    el.setAttribute("data-openverb-focus", "true");
    if (label) el.setAttribute("data-openverb-label", label);

    // Measured now, not recorded in advance — that is what lets the same
    // instruction point correctly at a layout that has since changed.
    const box = el.getBoundingClientRect();
    return {
      success: true,
      found: true,
      rect: { x: box.left, y: box.top, width: box.width, height: box.height },
    };
  },

  "ui.focus.clear": () => {
    clearFocusMarks();
    return { success: true };
  },

  // -- Wait -----------------------------------------------------------------
  //
  // ui.nav.go asks a router to move and returns straight away. A step
  // that acts on what it expects to find next is racing the application,
  // and the race is lost on a slower machine than yours.

  "ui.wait.for_element": async ({ selector, gone, timeoutMs }) => {
    if (!selector) return { success: false, timedOut: false, waitedMs: 0 };
    const started = performance.now();
    const settled = await until(
      () => present(selector) !== (gone === true),
      timeoutMs || DEFAULT_WAIT_MS
    );
    return {
      success: settled,
      timedOut: !settled,
      waitedMs: performance.now() - started,
    };
  },

  "ui.wait.for_route": async ({ routeId, path, timeoutMs }) => {
    const route = routeId ? routeRegistry.find((r) => r.id === routeId) : null;
    const wanted = route ? route.path : path;
    const where = () => window.location.pathname;
    if (!wanted) {
      return { success: false, timedOut: false, path: where(), waitedMs: 0 };
    }

    const started = performance.now();
    const settled = await until(() => pathMatches(where(), wanted), timeoutMs || DEFAULT_WAIT_MS);
    return {
      success: settled,
      timedOut: !settled,
      path: where(),
      waitedMs: performance.now() - started,
    };
  },

  // -- User Session ---------------------------------------------------------

  "user.session.get": () => {
    // Replace with your actual session/auth logic
    return {
      authenticated: false,
      user: null,
    };
  },

  "user.session.logout": ({ confirmed }) => {
    if (!confirmed) return { success: false };
    // Replace with your actual logout logic
    return { success: true };
  },

  "user.session.get_preferences": () => {
    return {
      preferences: {
        language: navigator.language?.slice(0, 2) || "en",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notifications: Notification.permission === "granted",
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Helpers for ui.focus and ui.wait
// ---------------------------------------------------------------------------

/** How long a wait gives up after, when the caller does not say. */
const DEFAULT_WAIT_MS = 5000;
const POLL_MS = 50;

/**
 * Resolve the element a focus call is talking about.
 *
 * Selector, then element id, then visible label — in that order of
 * precision. The label fallback exists because whoever writes a
 * walkthrough knows what the button says, not what it is called in the
 * markup.
 */
function resolveTarget({ selector, elementId, label }) {
  if (selector) {
    try {
      const hit = document.querySelector(selector);
      if (hit) return hit;
    } catch {
      // A bad selector is a bad instruction, not a crash.
    }
  }

  if (elementId) {
    const hit = document.getElementById(elementId);
    if (hit) return hit;
  }

  if (label) {
    const wanted = label.trim().toLowerCase();
    const candidates = document.querySelectorAll("button, a, [role='button'], label, [aria-label]");
    for (const candidate of candidates) {
      const text = (candidate.getAttribute("aria-label") || candidate.textContent || "")
        .trim()
        .toLowerCase();
      if (text === wanted) return candidate;
    }
  }

  return null;
}

/** Remove every mark this file put on the page, and nothing else. */
function clearFocusMarks() {
  for (const marked of document.querySelectorAll("[data-openverb-focus]")) {
    marked.removeAttribute("data-openverb-focus");
    marked.removeAttribute("data-openverb-label");
  }
}

/** Whether anything matches right now; a bad selector is absent, not fatal. */
function present(selector) {
  try {
    return document.querySelector(selector) !== null;
  } catch {
    return false;
  }
}

/**
 * Resolve once ready() is true, or false once the clock runs out.
 *
 * Checks before waiting at all, so a condition already met costs
 * nothing. Resolves false instead of throwing: the caller decides
 * whether to stop or carry on, and a wait that cannot fail is a hang.
 */
function until(ready, timeoutMs) {
  if (ready()) return Promise.resolve(true);
  return new Promise((resolve) => {
    const deadline = performance.now() + timeoutMs;
    const tick = () => {
      if (ready()) return resolve(true);
      if (performance.now() >= deadline) return resolve(false);
      setTimeout(tick, POLL_MS);
    };
    setTimeout(tick, POLL_MS);
  });
}

/** Trailing and leading slashes are noise, and the app may be mounted deeper. */
function pathMatches(actual, wanted) {
  const trim = (v) => String(v).replace(/^\/+|\/+$/g, "");
  const a = trim(actual);
  const b = trim(wanted);
  if (!b) return false;
  return a === b || a.endsWith("/" + b);
}

// ---------------------------------------------------------------------------
// Dispatcher — call any verb by id
// ---------------------------------------------------------------------------

/**
 * Execute an OpenVerb by id.
 *
 * Async because ui.wait.* genuinely waits. Everything else still
 * returns immediately; awaiting a value that is already there costs a
 * microtask.
 *
 * @param {string} verbId - e.g. "ui.theme.set"
 * @param {object} input - verb input payload
 * @returns {Promise<object>} verb output
 */
async function executeVerb(verbId, input = {}) {
  const handler = verbHandlers[verbId];
  if (!handler) {
    return { error: `Unknown verb: ${verbId}` };
  }
  try {
    return await handler(input);
  } catch (err) {
    return { error: err.message };
  }
}

// Export for ES modules or expose globally
if (typeof module !== "undefined" && module.exports) {
  module.exports = { executeVerb, verbHandlers, routeRegistry };
} else {
  window.OpenVerb = { executeVerb, verbHandlers, routeRegistry };
}
