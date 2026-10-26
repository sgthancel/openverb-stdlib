import { describe, it, expect } from "vitest";
import { manifests, getManifest, getAllVerbs, findVerb } from "../src/manifests.js";
import { ALL_VERB_IDS } from "../src/constants.js";

describe("manifests", () => {
  it("should have 9 verb families", () => {
    expect(manifests).toHaveLength(9);
  });

  it("should have 23 total verbs", () => {
    const allVerbs = getAllVerbs();
    expect(allVerbs).toHaveLength(23);
  });

  it("should have all expected families", () => {
    const families = manifests.map((m) => m.family).sort();
    expect(families).toEqual([
      "ui.focus",
      "ui.form",
      "ui.modal",
      "ui.nav",
      "ui.search",
      "ui.theme",
      "ui.toast",
      "ui.wait",
      "user.session",
    ]);
  });

  it("all verb ids should start with their family name", () => {
    for (const manifest of manifests) {
      for (const verb of manifest.verbs) {
        expect(verb.id).toMatch(new RegExp(`^${manifest.family}\\.`));
      }
    }
  });

  it("every verb should have id, version, summary, input, output", () => {
    for (const verb of getAllVerbs()) {
      expect(verb.id).toBeDefined();
      expect(verb.version).toBeDefined();
      expect(verb.summary).toBeDefined();
      expect(verb.input).toBeDefined();
      expect(verb.output).toBeDefined();
    }
  });

  it("every verb input/output should be type object", () => {
    for (const verb of getAllVerbs()) {
      expect((verb.input as { type: string }).type).toBe("object");
      expect((verb.output as { type: string }).type).toBe("object");
    }
  });

  it("ALL_VERB_IDS should match actual verb ids", () => {
    const actualIds = getAllVerbs()
      .map((v) => v.id)
      .sort();
    const constantIds = [...ALL_VERB_IDS].sort();
    expect(constantIds).toEqual(actualIds);
  });
});

describe("getManifest", () => {
  it("should find ui.theme manifest", () => {
    const manifest = getManifest("ui.theme");
    expect(manifest).toBeDefined();
    expect(manifest!.family).toBe("ui.theme");
    expect(manifest!.verbs).toHaveLength(2);
  });

  it("should find ui.nav manifest", () => {
    const manifest = getManifest("ui.nav");
    expect(manifest).toBeDefined();
    expect(manifest!.verbs).toHaveLength(3);
  });

  it("should return undefined for unknown family", () => {
    expect(getManifest("ui.unknown")).toBeUndefined();
  });
});

describe("findVerb", () => {
  it("should find ui.theme.get", () => {
    const verb = findVerb("ui.theme.get");
    expect(verb).toBeDefined();
    expect(verb!.summary).toContain("theme");
  });

  it("should find ui.nav.go", () => {
    const verb = findVerb("ui.nav.go");
    expect(verb).toBeDefined();
  });

  it("should find user.session.logout", () => {
    const verb = findVerb("user.session.logout");
    expect(verb).toBeDefined();
    expect(verb!.summary).toContain("confirm");
  });

  it("should find ui.focus.element", () => {
    const verb = findVerb("ui.focus.element");
    expect(verb).toBeDefined();
    // The summary has to rule out the thing a model would otherwise
    // assume: that pointing at a button also presses it.
    expect(verb!.summary).toContain("without activating it");
  });

  it("should find ui.wait.for_route", () => {
    expect(findVerb("ui.wait.for_route")).toBeDefined();
  });

  it("should return undefined for unknown verb", () => {
    expect(findVerb("ui.unknown.verb")).toBeUndefined();
  });
});
