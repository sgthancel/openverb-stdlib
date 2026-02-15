/**
 * OpenVerb Standard Library — React Reference Implementation
 *
 * A hook-based approach for React apps (works with React Router, Remix, etc.).
 * Provides useOpenVerb() hook that wires up all Level 0 verb handlers.
 */

import { useCallback, useMemo } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Route {
  id: string;
  title: string;
  path: string;
  tags: string[];
  requiresAuth: boolean;
}

export interface ModalEntry {
  id: string;
  title: string;
  description: string;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
  type: string;
}

export interface SessionUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

export interface VerbResult {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Config — pass these into the hook
// ---------------------------------------------------------------------------

export interface OpenVerbConfig {
  /** Your app's route registry */
  routes: Route[];

  /** Registered modals */
  modals?: ModalEntry[];

  /** Navigation function (e.g. react-router's navigate) */
  navigate: (path: string) => void;

  /** Go back in history */
  goBack?: () => void;

  /** Show a toast (plug in your toast library) */
  showToast?: (opts: {
    message: string;
    variant?: "info" | "success" | "warning" | "error";
    duration?: number;
  }) => string;

  /** Dismiss a toast */
  dismissToast?: (toastId?: string) => void;

  /** Open a modal by id */
  openModal?: (modalId: string, data?: Record<string, unknown>) => void;

  /** Close a modal */
  closeModal?: (modalId?: string) => void;

  /** Get current theme */
  getTheme?: () => { mode: string; resolved: string };

  /** Set theme */
  setTheme?: (mode: string) => { previousMode: string };

  /** Get current session */
  getSession?: () => { authenticated: boolean; user: SessionUser | null };

  /** Logout */
  logout?: () => Promise<void> | void;

  /** Get user preferences */
  getPreferences?: () => Record<string, unknown>;

  /** Search function (override to use your own search backend) */
  search?: (
    query: string,
    scope?: string,
    limit?: number
  ) => {
    results: SearchResult[];
    total: number;
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOpenVerb(config: OpenVerbConfig) {
  const {
    routes,
    modals = [],
    navigate,
    goBack = () => window.history.back(),
    showToast,
    dismissToast,
    openModal,
    closeModal,
    getTheme,
    setTheme,
    getSession,
    logout,
    getPreferences,
    search,
  } = config;

  // Default search: match routes by title and tags
  const defaultSearch = useCallback(
    (query: string, _scope?: string, limit = 10) => {
      const q = query.toLowerCase();
      const results = routes
        .filter(
          (r) =>
            r.title.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q))
        )
        .slice(0, limit)
        .map((r) => ({
          id: r.id,
          title: r.title,
          snippet: `Navigate to ${r.title}`,
          url: r.path,
          type: "page" as const,
        }));
      return { results, total: results.length };
    },
    [routes]
  );

  const handlers: Record<string, (input: Record<string, unknown>) => VerbResult> = useMemo(
    () => ({
      // Theme
      "ui.theme.get": () => {
        if (!getTheme) return { mode: "system", resolved: "light" };
        return getTheme();
      },
      "ui.theme.set": (input) => {
        if (!setTheme) return { success: false, error: "setTheme not configured" };
        const prev = setTheme(input.mode as string);
        return { success: true, mode: input.mode, previousMode: prev.previousMode };
      },

      // Navigation
      "ui.nav.list_pages": () => ({ routes }),
      "ui.nav.go": (input) => {
        const route = input.routeId ? routes.find((r) => r.id === input.routeId) : null;
        const path = route ? route.path : (input.path as string);
        if (!path) return { success: false };
        navigate(path);
        return { success: true, path };
      },
      "ui.nav.back": () => {
        goBack();
        return { success: true };
      },

      // Search
      "ui.search.query": (input) => {
        const searchFn = search || defaultSearch;
        return searchFn(
          input.query as string,
          input.scope as string | undefined,
          input.limit as number | undefined
        );
      },
      "ui.search.open_result": (input) => {
        const route = routes.find((r) => r.id === input.resultId);
        if (!route) return { success: false };
        navigate(route.path);
        return { success: true, url: route.path };
      },

      // Toast
      "ui.toast.show": (input) => {
        if (!showToast) return { success: false, error: "showToast not configured" };
        const toastId = showToast({
          message: input.message as string,
          variant: input.variant as "info" | "success" | "warning" | "error",
          duration: input.duration as number,
        });
        return { success: true, toastId };
      },
      "ui.toast.dismiss": (input) => {
        if (!dismissToast) return { success: false, error: "dismissToast not configured" };
        dismissToast(input.toastId as string | undefined);
        return { success: true };
      },

      // Modal
      "ui.modal.list": () => ({ modals }),
      "ui.modal.open": (input) => {
        if (!openModal) return { success: false, error: "openModal not configured" };
        openModal(input.modalId as string, input.data as Record<string, unknown>);
        return { success: true, modalId: input.modalId };
      },
      "ui.modal.close": (input) => {
        if (!closeModal) return { success: false, error: "closeModal not configured" };
        closeModal(input.modalId as string | undefined);
        return { success: true };
      },

      // Form — forms interact with DOM, so these are thin wrappers
      "ui.form.list": () => {
        const forms = document.querySelectorAll<HTMLFormElement>("form[data-openverb-id]");
        return {
          forms: Array.from(forms).map((form) => ({
            id: form.dataset.openverbId!,
            title: form.dataset.openverbTitle || form.dataset.openverbId!,
            fields: Array.from(form.elements)
              .filter(
                (el): el is HTMLInputElement => "name" in el && !!(el as HTMLInputElement).name
              )
              .map((el) => ({
                name: el.name,
                type: el.type || "text",
                label: el.labels?.[0]?.textContent || el.name,
                required: el.required,
              })),
          })),
        };
      },
      "ui.form.fill": (input) => {
        const form = document.querySelector<HTMLFormElement>(
          `form[data-openverb-id="${input.formId}"]`
        );
        if (!form) return { success: false, filled: [] };
        const filled: string[] = [];
        const values = input.values as Record<string, string>;
        for (const [name, value] of Object.entries(values)) {
          const el = form.elements.namedItem(name) as HTMLInputElement | null;
          if (el) {
            el.value = value;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            filled.push(name);
          }
        }
        return { success: true, filled };
      },
      "ui.form.submit": (input) => {
        const form = document.querySelector<HTMLFormElement>(
          `form[data-openverb-id="${input.formId}"]`
        );
        if (!form)
          return { success: false, errors: [{ field: "_form", message: "Form not found" }] };
        if (!form.checkValidity()) {
          const errors = Array.from(form.elements)
            .filter(
              (el): el is HTMLInputElement =>
                !("validity" in el) || !(el as HTMLInputElement).validity.valid
            )
            .map((el) => ({
              field: (el as HTMLInputElement).name,
              message: (el as HTMLInputElement).validationMessage,
            }));
          return { success: false, errors };
        }
        form.requestSubmit();
        return { success: true, errors: [] };
      },
      "ui.form.reset": (input) => {
        const form = document.querySelector<HTMLFormElement>(
          `form[data-openverb-id="${input.formId}"]`
        );
        if (!form) return { success: false };
        form.reset();
        return { success: true };
      },

      // Session
      "user.session.get": () => {
        if (!getSession) return { authenticated: false, user: null };
        return getSession();
      },
      "user.session.logout": (input) => {
        if (!input.confirmed) return { success: false };
        if (!logout) return { success: false, error: "logout not configured" };
        logout();
        return { success: true };
      },
      "user.session.get_preferences": () => {
        if (!getPreferences) {
          return {
            preferences: {
              language: navigator.language?.slice(0, 2) || "en",
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              notifications: false,
            },
          };
        }
        return { preferences: getPreferences() };
      },
    }),
    [
      routes,
      modals,
      navigate,
      goBack,
      showToast,
      dismissToast,
      openModal,
      closeModal,
      getTheme,
      setTheme,
      getSession,
      logout,
      getPreferences,
      search,
      defaultSearch,
    ]
  );

  const executeVerb = useCallback(
    (verbId: string, input: Record<string, unknown> = {}): VerbResult => {
      const handler = handlers[verbId];
      if (!handler) return { error: `Unknown verb: ${verbId}` };
      try {
        return handler(input);
      } catch (err) {
        return { error: (err as Error).message };
      }
    },
    [handlers]
  );

  return { executeVerb, handlers };
}
