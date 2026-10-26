import { describe, it, expect } from "vitest";
import {
  FORM_ATTR,
  findField,
  findForm,
  setFieldValue,
  type DocumentLike,
  type ElementLike,
} from "../src/dom.js";

/**
 * A field that behaves like a React-controlled one.
 *
 * Two details carry the whole test, and the first version of this file
 * had neither — so it passed while a real browser ticked the checkbox
 * straight back.
 *
 * 1. `value` and `checked` live on the PROTOTYPE, as they do on
 *    HTMLInputElement.
 * 2. React installs a value tracker: an OWN property on the node that
 *    shadows the prototype accessor, remembers the last value it saw,
 *    and lets React suppress a change event when the new value matches.
 *    A plain assignment hits that tracker — inherited setters are
 *    invoked by assignment, so merely counting prototype-setter calls
 *    proves nothing. Going through the prototype descriptor on purpose
 *    is what steps around it.
 *
 * `trackerWrites` counts assignments that went through the tracker.
 * It must stay zero: that is the bug, modelled.
 */
class FakeField extends EventTarget {
  private inner = "";
  private innerChecked = false;
  seen: string[] = [];
  setterCalls = 0;
  checkedSetterCalls = 0;
  trackerWrites = 0;
  clicks = 0;
  type?: string;

  constructor(type?: string) {
    super();
    this.type = type;
    for (const kind of ["input", "change"]) {
      this.addEventListener(kind, () => this.seen.push(kind));
    }
    this.addEventListener("click", () => {
      this.clicks += 1;
      // A real click toggles before the handler sees it.
      this.innerChecked = !this.innerChecked;
    });
  }

  get value(): string {
    return this.inner;
  }

  set value(next: string) {
    this.setterCalls += 1;
    this.inner = next;
  }

  get checked(): boolean {
    return this.innerChecked;
  }

  set checked(next: boolean) {
    this.checkedSetterCalls += 1;
    this.innerChecked = next;
  }

  /** What React does on mount, shadowing the prototype accessor. */
  installTracker(property: "value" | "checked"): void {
    let level: object | null = Object.getPrototypeOf(this) as object | null;
    let descriptor: PropertyDescriptor | undefined;
    while (level && !descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(level, property);
      level = Object.getPrototypeOf(level) as object | null;
    }
    const field = this;
    Object.defineProperty(this, property, {
      configurable: true,
      enumerable: false,
      get: () => descriptor!.get!.call(field),
      set: (next: unknown) => {
        field.trackerWrites += 1;
        descriptor!.set!.call(field, next);
      },
    });
  }
}

function tracked(type?: string, property: "value" | "checked" = "value"): FakeField {
  const field = new FakeField(type);
  field.installTracker(property);
  return field;
}

function fakeDoc(bySelector: Record<string, ElementLike | null>): DocumentLike {
  return {
    querySelector: (selector) => bySelector[selector] ?? null,
    querySelectorAll: () => [],
    getElementById: () => null,
  };
}

/** A form is just something you can query inside. */
function fakeForm(fields: Record<string, ElementLike | null>): ElementLike {
  return {
    getAttribute: () => null,
    querySelector: (selector: string) => fields[selector] ?? null,
  } as unknown as ElementLike;
}

describe("findForm", () => {
  it("finds a form by its openverb id", () => {
    const form = fakeForm({});
    const doc = fakeDoc({ [`[${FORM_ATTR}="structure"]`]: form });
    expect(findForm("structure", doc)).toBe(form);
  });

  it("returns null for an unknown id rather than guessing", () => {
    expect(findForm("nope", fakeDoc({}))).toBeNull();
  });

  it("returns null for an empty id or no document", () => {
    expect(findForm("", fakeDoc({}))).toBeNull();
    expect(findForm("structure", null)).toBeNull();
  });
});

describe("findField", () => {
  it("prefers name, which is what forms actually use", () => {
    const byName = tracked() as unknown as ElementLike;
    const byId = tracked() as unknown as ElementLike;
    const form = fakeForm({ '[name="email"]': byName, "#email": byId });
    expect(findField(form, "email")).toBe(byName);
  });

  it("falls back to an id", () => {
    const byId = tracked() as unknown as ElementLike;
    const form = fakeForm({ "#email": byId });
    expect(findField(form, "email")).toBe(byId);
  });

  it("returns null when the field is not there", () => {
    expect(findField(fakeForm({}), "email")).toBeNull();
  });

  it("returns null for an empty name", () => {
    expect(findField(fakeForm({}), "")).toBeNull();
  });
});

describe("setFieldValue", () => {
  it("sets the value", () => {
    const field = tracked();
    expect(setFieldValue(field as unknown as ElementLike, "Hartley Rebrand")).toBe(true);
    expect(field.value).toBe("Hartley Rebrand");
  });

  it("steps around React's value tracker rather than through it", () => {
    const field = tracked();
    setFieldValue(field as unknown as ElementLike, "x");
    // The assertion that matters: a plain assignment would make this 1,
    // and React would then treat the change as already seen.
    expect(field.trackerWrites).toBe(0);
    expect(field.setterCalls).toBe(1);
  });

  it("dispatches input and change, in that order", () => {
    const field = tracked();
    setFieldValue(field as unknown as ElementLike, "x");
    expect(field.seen).toEqual(["input", "change"]);
  });

  it("still fires events when the value is unchanged", () => {
    const field = tracked();
    setFieldValue(field as unknown as ElementLike, "same");
    field.seen.length = 0;
    setFieldValue(field as unknown as ElementLike, "same");
    expect(field.seen).toEqual(["input", "change"]);
  });

  it("ticks a checkbox by clicking it", () => {
    // Two wrong versions preceded this. Setting `checked` did nothing
    // in a browser, and so did setting it through the prototype: React
    // wires a checkbox onChange to the CLICK event, so input and change
    // never reach the application and it re-renders the old state back.
    const box = tracked("checkbox", "checked");
    setFieldValue(box as unknown as ElementLike, "true");
    expect(box.clicks).toBe(1);
    expect(box.seen).toEqual([]);
  });

  it("does not click a box that is already in the state asked for", () => {
    // A click toggles. Clicking a ticked box to tick it unticks it.
    const box = tracked("checkbox", "checked");
    box.checked = true;
    setFieldValue(box as unknown as ElementLike, "true");
    expect(box.clicks).toBe(0);
  });

  it("unticks a ticked box, and leaves an unticked one alone", () => {
    const on = tracked("checkbox", "checked");
    on.checked = true;
    setFieldValue(on as unknown as ElementLike, "no");
    expect(on.clicks).toBe(1);

    const off = tracked("checkbox", "checked");
    setFieldValue(off as unknown as ElementLike, "no");
    expect(off.clicks).toBe(0);
  });

  it("finds a setter inherited from further up the chain", () => {
    // HTMLInputElement.prototype is more than one level up from a real
    // node; an implementation that checks only the immediate prototype
    // finds nothing and falls back to the assignment it was avoiding.
    class Deeper extends FakeField {}
    const field = new Deeper();
    field.installTracker("value");
    setFieldValue(field as unknown as ElementLike, "x");
    expect(field.trackerWrites).toBe(0);
    expect(field.setterCalls).toBe(1);
    expect(field.value).toBe("x");
  });

  it("reports false for something that is not a field", () => {
    expect(setFieldValue({ getAttribute: () => null } as ElementLike, "x")).toBe(false);
  });
});
