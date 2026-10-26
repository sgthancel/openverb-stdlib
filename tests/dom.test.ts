import { describe, it, expect } from "vitest";
import {
  DEFAULT_WAIT_MS,
  FOCUS_ATTR,
  LABEL_ATTR,
  clearMarks,
  elementPresent,
  findElement,
  mark,
  pathMatches,
  until,
  type DocumentLike,
  type ElementLike,
} from "../src/dom.js";

/**
 * A document with three methods, which is all these helpers touch.
 *
 * Deliberately not jsdom: the point of giving dom.ts an injectable
 * document was to be able to assert on element resolution without
 * adding a browser to devDependencies.
 */
function fakeElement(attrs: Record<string, string> = {}, text = ""): ElementLike {
  const own = { ...attrs };
  return {
    attrs: own,
    getAttribute: (name: string) => own[name] ?? null,
    setAttribute: (name: string, value: string) => {
      own[name] = value;
    },
    removeAttribute: (name: string) => {
      delete own[name];
    },
    textContent: text,
  } as unknown as ElementLike;
}

function attrsOf(element: ElementLike): Record<string, string> {
  return (element as unknown as { attrs: Record<string, string> }).attrs;
}

function fakeDoc(options: {
  bySelector?: Record<string, ElementLike | null>;
  byId?: Record<string, ElementLike>;
  all?: Record<string, ElementLike[]>;
  throwOn?: string;
}): DocumentLike {
  return {
    querySelector: (selector: string) => {
      if (options.throwOn && selector === options.throwOn) {
        throw new SyntaxError("not a valid selector: " + selector);
      }
      return options.bySelector?.[selector] ?? null;
    },
    querySelectorAll: (selector: string) => options.all?.[selector] ?? [],
    getElementById: (id: string) => options.byId?.[id] ?? null,
  };
}

const CANDIDATES = "button, a, [role='button'], label, [aria-label]";
const MARKED = "[" + FOCUS_ATTR + "]";

describe("findElement", () => {
  it("resolves a selector", () => {
    const target = fakeElement();
    const doc = fakeDoc({ bySelector: { "#field-name": target } });
    expect(findElement({ selector: "#field-name" }, doc)).toBe(target);
  });

  it("falls back to an element id when the selector misses", () => {
    const target = fakeElement();
    const doc = fakeDoc({ bySelector: {}, byId: { "field-name": target } });
    expect(findElement({ selector: "#nope", elementId: "field-name" }, doc)).toBe(target);
  });

  it("falls back to a visible label, so a walkthrough can name the button", () => {
    const target = fakeElement({}, "  Create Structure  ");
    const doc = fakeDoc({ all: { [CANDIDATES]: [fakeElement({}, "Cancel"), target] } });
    expect(findElement({ label: "create structure" }, doc)).toBe(target);
  });

  it("matches an aria-label ahead of text content", () => {
    const target = fakeElement({ "aria-label": "Close dialog" }, "x");
    const doc = fakeDoc({ all: { [CANDIDATES]: [target] } });
    expect(findElement({ label: "Close dialog" }, doc)).toBe(target);
  });

  it("returns null rather than throwing on an invalid selector", () => {
    const doc = fakeDoc({ throwOn: "###" });
    // A bad instruction should make a step skip, not take the page down.
    expect(findElement({ selector: "###" }, doc)).toBeNull();
  });

  it("still tries the other names after an invalid selector", () => {
    const target = fakeElement();
    const doc = fakeDoc({ throwOn: "###", byId: { "field-name": target } });
    expect(findElement({ selector: "###", elementId: "field-name" }, doc)).toBe(target);
  });

  it("returns null when nothing matches", () => {
    expect(findElement({ selector: "#gone" }, fakeDoc({}))).toBeNull();
  });

  it("returns null with no document at all, for server rendering", () => {
    expect(findElement({ selector: "#anything" }, null)).toBeNull();
  });
});

describe("mark and clearMarks", () => {
  it("marks an element with an attribute the host can style", () => {
    const target = fakeElement();
    mark(target, "Start here", fakeDoc({}));
    expect(attrsOf(target)[FOCUS_ATTR]).toBe("true");
    expect(attrsOf(target)[LABEL_ATTR]).toBe("Start here");
  });

  it("omits the label attribute when there is no label", () => {
    const target = fakeElement();
    mark(target, undefined, fakeDoc({}));
    expect(attrsOf(target)[FOCUS_ATTR]).toBe("true");
    expect(LABEL_ATTR in attrsOf(target)).toBe(false);
  });

  it("unmarks the previous element, so only one thing is pointed at", () => {
    const previous = fakeElement({ [FOCUS_ATTR]: "true", [LABEL_ATTR]: "old" });
    const next = fakeElement();
    const doc = fakeDoc({ all: { [MARKED]: [previous] } });
    mark(next, "new", doc);
    expect(FOCUS_ATTR in attrsOf(previous)).toBe(false);
    expect(LABEL_ATTR in attrsOf(previous)).toBe(false);
    expect(attrsOf(next)[FOCUS_ATTR]).toBe("true");
  });

  it("clears every mark and leaves other attributes alone", () => {
    const marked = fakeElement({ [FOCUS_ATTR]: "true", id: "keep-me" });
    clearMarks(fakeDoc({ all: { [MARKED]: [marked] } }));
    expect(FOCUS_ATTR in attrsOf(marked)).toBe(false);
    expect(attrsOf(marked).id).toBe("keep-me");
  });

  it("is a no-op without a document", () => {
    expect(() => clearMarks(null)).not.toThrow();
  });
});

describe("elementPresent", () => {
  it("reports a present element", () => {
    const doc = fakeDoc({ bySelector: { "#here": fakeElement() } });
    expect(elementPresent("#here", doc)).toBe(true);
  });

  it("reports an absent element", () => {
    expect(elementPresent("#gone", fakeDoc({}))).toBe(false);
  });

  it("reports false for an invalid selector instead of throwing mid-poll", () => {
    expect(elementPresent("###", fakeDoc({ throwOn: "###" }))).toBe(false);
  });

  it("reports false for an empty selector and no document", () => {
    expect(elementPresent("", fakeDoc({}))).toBe(false);
    expect(elementPresent("#x", null)).toBe(false);
  });
});

describe("until", () => {
  it("resolves true without waiting when the condition already holds", async () => {
    const started = Date.now();
    await expect(until(() => true, 1000)).resolves.toBe(true);
    // The common case: most of these waits are insurance, not a pause.
    expect(Date.now() - started).toBeLessThan(40);
  });

  it("resolves true once the condition becomes true", async () => {
    let ready = false;
    setTimeout(() => {
      ready = true;
    }, 60);
    await expect(until(() => ready, 2000)).resolves.toBe(true);
  });

  it("resolves false on timeout rather than throwing", async () => {
    await expect(until(() => false, 80)).resolves.toBe(false);
  });

  it("stops polling once it has given up", async () => {
    let polls = 0;
    const settled = await until(() => {
      polls += 1;
      return false;
    }, 120);
    expect(settled).toBe(false);
    const atGiveUp = polls;
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(polls).toBe(atGiveUp);
  });
});

describe("pathMatches", () => {
  it("ignores leading and trailing slashes", () => {
    expect(pathMatches("/folders/", "folders")).toBe(true);
    expect(pathMatches("folders", "/folders")).toBe(true);
  });

  it("matches a route declared relative to where the app is mounted", () => {
    expect(pathMatches("/app/folders", "folders")).toBe(true);
  });

  it("does not match a different route that merely ends the same way", () => {
    // "shared-folders" ends in "folders" as text but is not that route.
    expect(pathMatches("/app/shared-folders", "folders")).toBe(false);
  });

  it("does not match a parent of the wanted route", () => {
    expect(pathMatches("/app", "app/folders")).toBe(false);
  });

  it("never matches an empty target", () => {
    expect(pathMatches("/folders", "")).toBe(false);
    expect(pathMatches("/folders", "/")).toBe(false);
  });
});

describe("DEFAULT_WAIT_MS", () => {
  it("is finite, because a wait that cannot fail is a hang", () => {
    expect(Number.isFinite(DEFAULT_WAIT_MS)).toBe(true);
    expect(DEFAULT_WAIT_MS).toBeGreaterThan(0);
  });
});
