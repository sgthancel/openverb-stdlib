import { describe, it, expect } from "vitest";
import {
  EFFECT_ORDER,
  UNDECLARED,
  decide,
  effectsOf,
  isVerbEffects,
  withinLimit,
  type VerbEffects,
} from "../src/effects.js";
import { getAllVerbs, findVerb } from "../src/manifests.js";

describe("effectsOf", () => {
  it("reads a declaration", () => {
    expect(effectsOf({ effects: "ui" })).toBe("ui");
  });

  it("treats an undeclared verb as external", () => {
    // The whole point. A library written before this field exists must
    // not become scriptable by default.
    expect(effectsOf({ id: "billing.charge" })).toBe("external");
    expect(UNDECLARED).toBe("external");
  });

  it("treats a nonsense declaration as external too", () => {
    // A typo is not a permission.
    expect(effectsOf({ effects: "safe" })).toBe("external");
    expect(effectsOf({ effects: 1 })).toBe("external");
    expect(effectsOf({ effects: null })).toBe("external");
  });

  it("survives being handed nothing", () => {
    expect(effectsOf(null)).toBe("external");
    expect(effectsOf(undefined)).toBe("external");
  });
});

describe("isVerbEffects", () => {
  it("accepts exactly the four", () => {
    for (const value of EFFECT_ORDER) expect(isVerbEffects(value)).toBe(true);
    expect(EFFECT_ORDER).toEqual(["read", "ui", "data", "external"]);
  });

  it("rejects anything else", () => {
    for (const value of ["", "READ", "none", "local", 0, null, undefined, {}]) {
      expect(isVerbEffects(value)).toBe(false);
    }
  });
});

describe("withinLimit", () => {
  it("permits anything at or below the limit", () => {
    expect(withinLimit("read", "ui")).toBe(true);
    expect(withinLimit("ui", "ui")).toBe(true);
  });

  it("refuses anything above it", () => {
    expect(withinLimit("data", "ui")).toBe(false);
    expect(withinLimit("external", "data")).toBe(false);
  });

  it("lets a caller that permits everything permit everything", () => {
    for (const value of EFFECT_ORDER) expect(withinLimit(value, "external")).toBe(true);
  });

  it("lets a read-only caller read and nothing else", () => {
    expect(withinLimit("read", "read")).toBe(true);
    expect(withinLimit("ui", "read")).toBe(false);
  });
});

describe("decide", () => {
  const safe = { effects: "ui" };
  const sends = { effects: "external" };
  const legacy = { id: "mail.send" };

  it("defaults the limit to ui, which is what a walkthrough needs", () => {
    expect(decide("ui.nav.go", safe).allowed).toBe(true);
    expect(decide("ui.form.submit", sends).allowed).toBe(false);
  });

  it("refuses an undeclared verb and says what to do about it", () => {
    const decision = decide("mail.send", legacy);
    expect(decision.allowed).toBe(false);
    expect(decision.effects).toBe("external");
    expect(decision.reason).toContain("declares no effects");
    expect(decision.reason).toContain("mail.send");
  });

  it("names the verb in every refusal", () => {
    // A refusal that cannot say what it refused sends whoever wrote the
    // document hunting through a manifest.
    expect(decide("ui.form.submit", sends).reason).toContain("ui.form.submit");
    expect(decide("x.y", safe, { deny: ["x.y"] }).reason).toContain("x.y");
  });

  it("lets the host permit one verb explicitly", () => {
    // The escape hatch that makes the strict default usable: a tour has
    // to be able to press Create.
    const decision = decide("ui.form.submit", sends, { allow: ["ui.form.submit"] });
    expect(decision.allowed).toBe(true);
    expect(decision.effects).toBe("external");
  });

  it("permits only the verb named, not others like it", () => {
    const policy = { allow: ["ui.form.submit"] };
    expect(decide("ui.form.submit", sends, policy).allowed).toBe(true);
    expect(decide("user.session.logout", sends, policy).allowed).toBe(false);
  });

  it("denies ahead of allowing, so deny cannot be talked round", () => {
    const policy = { allow: ["x.y"], deny: ["x.y"], limit: "external" as VerbEffects };
    expect(decide("x.y", safe, policy).allowed).toBe(false);
  });

  it("denies ahead of the limit too", () => {
    expect(decide("ui.nav.go", safe, { deny: ["ui.nav.go"] }).allowed).toBe(false);
  });

  it("reports the declared effects even when refusing", () => {
    expect(decide("x.y", { effects: "data" }).effects).toBe("data");
  });
});

describe("the library's own verbs", () => {
  it("all declare effects", () => {
    const undeclared = getAllVerbs()
      .filter((verb) => !isVerbEffects((verb as { effects?: unknown }).effects))
      .map((verb) => verb.id);
    expect(undeclared).toEqual([]);
  });

  it("are almost all callable from a walkthrough", () => {
    const refused = getAllVerbs()
      .filter((verb) => !decide(verb.id, verb).allowed)
      .map((verb) => verb.id);
    // Exactly two, and both for a reason worth stating: submitting a
    // form sends data somewhere this library cannot see, and logging out
    // ends a real session for a real person.
    expect(refused.sort()).toEqual(["ui.form.submit", "user.session.logout"]);
  });

  it("marks reads as reads, including pointing and waiting", () => {
    for (const id of [
      "ui.nav.list_pages",
      "ui.focus.element",
      "ui.focus.clear",
      "ui.wait.for_element",
      "ui.wait.for_route",
      "user.session.get",
    ]) {
      expect(effectsOf(findVerb(id))).toBe("read");
    }
  });

  it("marks nothing as data, since none of them store anything", () => {
    const stored = getAllVerbs()
      .filter((verb) => effectsOf(verb) === "data")
      .map((verb) => verb.id);
    expect(stored).toEqual([]);
  });

  it("lets a read-only caller call the reads and nothing more", () => {
    const policy = { limit: "read" as VerbEffects };
    expect(decide("ui.nav.list_pages", findVerb("ui.nav.list_pages"), policy).allowed).toBe(true);
    expect(decide("ui.nav.go", findVerb("ui.nav.go"), policy).allowed).toBe(false);
  });
});
