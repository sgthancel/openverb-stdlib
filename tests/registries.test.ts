import { describe, it, expect } from "vitest";
import { routeRegistry, findRouteByIntent, getRoutesForRole } from "../src/registries.js";
import type { Route } from "../src/types.js";

const testRoutes: Route[] = [
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
    id: "help",
    title: "Help Center",
    path: "/help",
    tags: ["support", "faq"],
    requiresAuth: false,
  },
];

describe("routeRegistry", () => {
  const registry = routeRegistry(testRoutes);

  it("should return all routes", () => {
    expect(registry.all()).toHaveLength(3);
  });

  it("should find route by id", () => {
    const route = registry.find("accounting");
    expect(route).toBeDefined();
    expect(route!.title).toBe("Accounting");
  });

  it("should return undefined for unknown id", () => {
    expect(registry.find("nonexistent")).toBeUndefined();
  });

  it("should search by title", () => {
    const results = registry.search("accounting");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("accounting");
  });

  it("should search by tags", () => {
    const results = registry.search("billing");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("accounting");
  });

  it("should return empty for no matches", () => {
    const results = registry.search("nonexistent");
    expect(results).toHaveLength(0);
  });
});

describe("findRouteByIntent", () => {
  it("should find route by title keyword", () => {
    const route = findRouteByIntent(testRoutes, "accounting");
    expect(route).toBeDefined();
    expect(route!.id).toBe("accounting");
  });

  it("should find route by tag", () => {
    const route = findRouteByIntent(testRoutes, "invoices");
    expect(route).toBeDefined();
    expect(route!.id).toBe("accounting");
  });

  it("should be case-insensitive", () => {
    const route = findRouteByIntent(testRoutes, "DASHBOARD");
    expect(route).toBeDefined();
    expect(route!.id).toBe("dashboard");
  });

  it("should return undefined for no match", () => {
    expect(findRouteByIntent(testRoutes, "nonexistent")).toBeUndefined();
  });
});

describe("getRoutesForRole", () => {
  const roleAccess: Record<string, string[]> = {
    admin: ["dashboard", "accounting", "help"],
    viewer: ["dashboard", "help"],
  };

  it("should return all routes for admin", () => {
    const routes = getRoutesForRole(testRoutes, "admin", roleAccess);
    expect(routes).toHaveLength(3);
  });

  it("should return limited routes for viewer", () => {
    const routes = getRoutesForRole(testRoutes, "viewer", roleAccess);
    expect(routes).toHaveLength(2);
    expect(routes.map((r) => r.id)).toEqual(["dashboard", "help"]);
  });

  it("should return empty for unknown role", () => {
    const routes = getRoutesForRole(testRoutes, "unknown", roleAccess);
    expect(routes).toHaveLength(0);
  });
});
