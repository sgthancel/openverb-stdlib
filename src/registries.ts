/**
 * Registry helpers for routes, modals, and forms
 */

import type { Route } from "./types.js";

export type { Route } from "./types.js";

/**
 * Create a route registry from an array of route definitions.
 * This is a convenience wrapper — the real registry lives in your app.
 */
export function routeRegistry(routes: Route[]): {
  all: () => Route[];
  find: (id: string) => Route | undefined;
  search: (query: string) => Route[];
} {
  return {
    all: () => routes,
    find: (id: string) => routes.find((r) => r.id === id),
    search: (query: string) => {
      const q = query.toLowerCase();
      return routes.filter(
        (r) => r.title.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q))
      );
    },
  };
}

/** Find a route by user intent (matches title and tags) */
export function findRouteByIntent(routes: Route[], query: string): Route | undefined {
  const q = query.toLowerCase();
  return routes.find(
    (r) => r.title.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q))
  );
}

/** Filter routes by user role */
export function getRoutesForRole(
  routes: Route[],
  role: string,
  roleAccess: Record<string, string[]>
): Route[] {
  const allowed = roleAccess[role];
  if (!allowed) return [];
  return routes.filter((r) => allowed.includes(r.id));
}
