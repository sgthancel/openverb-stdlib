/**
 * OpenVerb Standard Library — Next.js Reference Implementation
 *
 * Uses Next.js App Router conventions (useRouter, usePathname, etc.).
 * Wraps the React hook with Next.js-specific navigation and theme handling.
 */

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { useOpenVerb, type OpenVerbConfig, type Route, type ModalEntry } from "../react/useOpenVerb";

// ---------------------------------------------------------------------------
// Re-export types
// ---------------------------------------------------------------------------

export type { Route, ModalEntry, SearchResult, SessionUser, VerbResult } from "../react/useOpenVerb";

// ---------------------------------------------------------------------------
// Route Registry — define your app's pages here
// ---------------------------------------------------------------------------

export const routes: Route[] = [
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

export const modals: ModalEntry[] = [
  {
    id: "confirm-delete",
    title: "Confirm Delete",
    description: "Asks the user to confirm a delete action",
  },
];

// ---------------------------------------------------------------------------
// Next.js OpenVerb Hook
// ---------------------------------------------------------------------------

export interface UseNextOpenVerbOptions {
  /** Override route registry */
  routes?: Route[];
  /** Override modal registry */
  modals?: ModalEntry[];
  /** Toast show function (plug in sonner, react-hot-toast, etc.) */
  showToast?: OpenVerbConfig["showToast"];
  /** Toast dismiss function */
  dismissToast?: OpenVerbConfig["dismissToast"];
  /** Modal open function */
  openModal?: OpenVerbConfig["openModal"];
  /** Modal close function */
  closeModal?: OpenVerbConfig["closeModal"];
  /** Session getter */
  getSession?: OpenVerbConfig["getSession"];
  /** Logout function */
  logout?: OpenVerbConfig["logout"];
  /** Preferences getter */
  getPreferences?: OpenVerbConfig["getPreferences"];
  /** Custom search */
  search?: OpenVerbConfig["search"];
}

export function useNextOpenVerb(options: UseNextOpenVerbOptions = {}) {
  const router = useRouter();

  const navigate = useCallback(
    (path: string) => router.push(path),
    [router]
  );

  const goBack = useCallback(() => router.back(), [router]);

  // Theme: uses data-theme attribute + localStorage
  const getTheme = useCallback(() => {
    const stored = localStorage.getItem("theme") || "system";
    const resolved =
      stored === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : stored;
    return { mode: stored, resolved };
  }, []);

  const setTheme = useCallback((mode: string) => {
    const previousMode = localStorage.getItem("theme") || "system";
    localStorage.setItem("theme", mode);
    document.documentElement.setAttribute("data-theme", mode);
    return { previousMode };
  }, []);

  return useOpenVerb({
    routes: options.routes || routes,
    modals: options.modals || modals,
    navigate,
    goBack,
    getTheme,
    setTheme,
    showToast: options.showToast,
    dismissToast: options.dismissToast,
    openModal: options.openModal,
    closeModal: options.closeModal,
    getSession: options.getSession,
    logout: options.logout,
    getPreferences: options.getPreferences,
    search: options.search,
  });
}
