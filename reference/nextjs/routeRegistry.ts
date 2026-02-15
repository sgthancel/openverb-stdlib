/**
 * OpenVerb Route Registry — Next.js Reference
 *
 * A standalone route registry helper. Use this if you want to manage
 * routes separately from the verb hook (e.g. share them between
 * server components and client components).
 */

export interface Route {
  id: string;
  title: string;
  path: string;
  tags: string[];
  requiresAuth: boolean;
}

// ---------------------------------------------------------------------------
// Static routes — define your app's pages here
// ---------------------------------------------------------------------------

const staticRoutes: Route[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    tags: ["home", "overview", "stats"],
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
    tags: ["preferences", "account", "profile"],
    requiresAuth: true,
  },
  {
    id: "help",
    title: "Help Center",
    path: "/help",
    tags: ["support", "docs", "faq"],
    requiresAuth: false,
  },
];

// ---------------------------------------------------------------------------
// Dynamic route builder — generate routes from your data
// ---------------------------------------------------------------------------

interface DynamicRouteSource {
  id: string;
  name: string;
  labels?: string[];
}

export function buildDynamicRoutes(prefix: string, items: DynamicRouteSource[]): Route[] {
  return items.map((item) => ({
    id: `${prefix}-${item.id}`,
    title: item.name,
    path: `/${prefix}/${item.id}`,
    tags: [prefix, ...(item.labels || [])],
    requiresAuth: true,
  }));
}

// ---------------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------------

export function getAllRoutes(dynamicRoutes: Route[] = []): Route[] {
  return [...staticRoutes, ...dynamicRoutes];
}

export function getRoutesForRole(
  routes: Route[],
  role: string,
  roleAccess: Record<string, string[]>
): Route[] {
  const allowed = roleAccess[role];
  if (!allowed) return [];
  return routes.filter((r) => allowed.includes(r.id));
}

export function findRouteByIntent(routes: Route[], query: string): Route | undefined {
  const q = query.toLowerCase();
  return routes.find(
    (r) => r.title.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q))
  );
}
