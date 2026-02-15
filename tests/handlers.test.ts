import { describe, it, expect } from "vitest";
import { createVerbHandlers, executeVerb } from "../src/handlers.js";

describe("createVerbHandlers", () => {
  it("should create a handler map", () => {
    const handlers = createVerbHandlers({
      "ui.theme.get": () => ({ mode: "dark", resolved: "dark" }),
    });
    expect(handlers["ui.theme.get"]).toBeDefined();
  });
});

describe("executeVerb", () => {
  const handlers = createVerbHandlers({
    "ui.theme.get": () => ({ mode: "dark", resolved: "dark" }),
    "ui.theme.set": (input) => ({
      success: true,
      mode: input.mode,
      previousMode: "light",
    }),
    "ui.nav.go": (input) => ({
      success: true,
      path: input.path || "/unknown",
    }),
    "failing.verb": () => {
      throw new Error("Something went wrong");
    },
  });

  it("should execute a verb and return result", async () => {
    const result = await executeVerb(handlers, "ui.theme.get");
    expect(result).toEqual({ mode: "dark", resolved: "dark" });
  });

  it("should pass input to handler", async () => {
    const result = await executeVerb(handlers, "ui.theme.set", { mode: "light" });
    expect(result).toEqual({ success: true, mode: "light", previousMode: "light" });
  });

  it("should return error for unknown verb", async () => {
    const result = await executeVerb(handlers, "ui.unknown.verb");
    expect(result.error).toBe("Unknown verb: ui.unknown.verb");
  });

  it("should catch handler errors", async () => {
    const result = await executeVerb(handlers, "failing.verb");
    expect(result.error).toBe("Something went wrong");
  });
});
