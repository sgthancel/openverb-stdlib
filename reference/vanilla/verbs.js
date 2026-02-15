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
// Dispatcher — call any verb by id
// ---------------------------------------------------------------------------

/**
 * Execute an OpenVerb by id.
 * @param {string} verbId - e.g. "ui.theme.set"
 * @param {object} input - verb input payload
 * @returns {object} verb output
 */
function executeVerb(verbId, input = {}) {
  const handler = verbHandlers[verbId];
  if (!handler) {
    return { error: `Unknown verb: ${verbId}` };
  }
  try {
    return handler(input);
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
