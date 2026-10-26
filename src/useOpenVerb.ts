/**
 * React hook for OpenVerb Standard Library
 */

import { useCallback, useMemo } from "react";
import type { Route, ModalEntry, SearchResult } from "./types.js";
import type { VerbResult, VerbHandlers } from "./handlers.js";
import {
  DEFAULT_WAIT_MS,
  clearMarks,
  elementPresent,
  findElement,
  mark,
  now,
  pathMatches,
  until,
} from "./dom.js";

export interface OpenVerbConfig {
  routes: Route[];
  modals?: ModalEntry[];
  navigate: (path: string) => void;
  goBack?: () => void;
  showToast?: (opts: {
    message: string;
    variant?: "info" | "success" | "warning" | "error";
    duration?: number;
  }) => string;
  dismissToast?: (toastId?: string) => void;
  openModal?: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal?: (modalId?: string) => void;
  getTheme?: () => { mode: string; resolved: string };
  setTheme?: (mode: string) => { previousMode: string };
  getSession?: () => {
    authenticated: boolean;
    user: { id: string; displayName: string; email: string; role: string } | null;
  };
  logout?: () => Promise<void> | void;
  getPreferences?: () => Record<string, unknown>;
  /**
   * Draw attention to an element.
   *
   * Optional: without it the library marks the element itself, which
   * works in any DOM application. Provide it when the app already has a
   * highlight of its own and should keep using it.
   */
  focusElement?: (element: Element, label?: string) => void;
  clearFocus?: () => void;
  /** Where the app currently is, if its router can say. */
  currentPath?: () => string;
  search?: (
    query: string,
    scope?: string,
    limit?: number
  ) => {
    results: SearchResult[];
    total: number;
  };
}

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
    focusElement,
    clearFocus,
    currentPath,
    search,
  } = config;

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

  const handlers: VerbHandlers = useMemo(
    () => ({
      "ui.theme.get": () => {
        if (!getTheme) return { mode: "system", resolved: "light" };
        return getTheme();
      },
      "ui.theme.set": (input) => {
        if (!setTheme) return { success: false, error: "setTheme not configured" };
        const prev = setTheme(input.mode as string);
        return { success: true, mode: input.mode, previousMode: prev.previousMode };
      },
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
      "ui.form.list": () => ({ forms: [] }),
      "ui.form.fill": () => ({ success: true, filled: [] }),
      "ui.form.submit": () => ({ success: true, errors: [] }),
      "ui.form.reset": () => ({ success: true }),
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
      /**
       * Pointing, which has no default anywhere else.
       *
       * Operating an interface and SHOWING someone the interface are
       * different jobs, and until now the library could only do the
       * first: nav, forms and modals can press things but nothing could
       * say look here. A guided walkthrough is mostly this verb.
       *
       * The element is resolved and measured at call time rather than
       * recorded in advance, which is what lets the same instruction
       * survive a layout that has since changed.
       */
      "ui.focus.element": (input) => {
        const element = findElement(input);
        if (!element) return { success: false, found: false };

        const scrollable = element as { scrollIntoView?: (o?: object) => void };
        if (input.scroll !== false && typeof scrollable.scrollIntoView === "function") {
          scrollable.scrollIntoView({ block: "center", behavior: "smooth" });
        }

        if (focusElement) {
          focusElement(element as unknown as Element, input.label as string | undefined);
        } else {
          // A plain attribute rather than injected styling: the host owns
          // how a focused thing looks, and can target it from its own CSS.
          mark(element, input.label as string | undefined);
        }

        // Measured here rather than recorded in advance, which is what
        // lets the same instruction point correctly at a layout that has
        // changed since it was written.
        const measurable = element as { getBoundingClientRect?: () => DOMRect };
        const box = measurable.getBoundingClientRect?.();
        return {
          success: true,
          found: true,
          rect: box ? { x: box.left, y: box.top, width: box.width, height: box.height } : undefined,
        };
      },
      "ui.focus.clear": () => {
        if (clearFocus) clearFocus();
        else clearMarks();
        return { success: true };
      },

      /**
       * Waiting, because asking is not arriving.
       *
       * ui.nav.go asks a router to move and returns straight away. An
       * instruction that acts on what it expects to be there next is
       * racing the application, and the race is lost on a slow machine
       * rather than on the one it was written on.
       *
       * A timeout is reported rather than thrown: the caller decides
       * whether a missing element means stop or carry on, and a wait
       * that cannot fail is a hang.
       */
      "ui.wait.for_element": async (input) => {
        const selector = String(input.selector ?? "");
        const gone = input.gone === true;
        const timeoutMs = Number(input.timeoutMs) || DEFAULT_WAIT_MS;
        if (!selector) return { success: false, timedOut: false, waitedMs: 0 };

        const started = now();
        const settled = await until(() => elementPresent(selector) !== gone, timeoutMs);
        return { success: settled, timedOut: !settled, waitedMs: now() - started };
      },
      "ui.wait.for_route": async (input) => {
        const route = input.routeId ? routes.find((r) => r.id === input.routeId) : null;
        const wanted = route ? route.path : ((input.path as string) ?? "");
        const timeoutMs = Number(input.timeoutMs) || DEFAULT_WAIT_MS;
        const where = () =>
          currentPath
            ? currentPath()
            : typeof window !== "undefined"
              ? window.location.pathname
              : "";

        if (!wanted) return { success: false, timedOut: false, path: where(), waitedMs: 0 };

        const started = now();
        const settled = await until(() => pathMatches(where(), wanted), timeoutMs);
        return {
          success: settled,
          timedOut: !settled,
          path: where(),
          waitedMs: now() - started,
        };
      },

      "user.session.get_preferences": () => {
        if (!getPreferences) {
          return {
            preferences: {
              language: typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : "en",
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
      focusElement,
      clearFocus,
      currentPath,
      search,
      defaultSearch,
    ]
  );

  const execute = useCallback(
    async (verbId: string, input: Record<string, unknown> = {}): Promise<VerbResult> => {
      const handler = handlers[verbId];
      if (!handler) return { error: `Unknown verb: ${verbId}` };
      try {
        return await handler(input);
      } catch (err) {
        return { error: (err as Error).message };
      }
    },
    [handlers]
  );

  return { executeVerb: execute, handlers };
}
