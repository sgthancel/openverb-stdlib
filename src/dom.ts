/**
 * The small amount of DOM the pointing and waiting verbs need.
 *
 * Kept out of the hook and given an injectable document for one reason:
 * the hook cannot be tested without a browser, and this is the part
 * that is actually worth testing. Resolving an element by three
 * different names, and giving up on a wait at the right moment, are
 * where the mistakes live.
 */

/** How long a wait gives up after, when the caller does not say. */
export const DEFAULT_WAIT_MS = 5000;

/** Poll interval for waits. Short enough to feel instant, long enough not to spin. */
export const POLL_MS = 50;

/**
 * The parts of `document` these helpers touch.
 *
 * A structural type rather than `Document`, so a test can supply four
 * methods instead of a browser.
 */
export interface DocumentLike {
  querySelector(selector: string): ElementLike | null;
  querySelectorAll(selector: string): ArrayLike<ElementLike>;
  getElementById(id: string): ElementLike | null;
}

export interface ElementLike {
  getAttribute(name: string): string | null;
  setAttribute?(name: string, value: string): void;
  removeAttribute?(name: string): void;
  textContent?: string | null;
}

function ambient(): DocumentLike | null {
  return typeof document === "undefined" ? null : (document as unknown as DocumentLike);
}

export const now = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

/**
 * Resolve the element a focus call is talking about.
 *
 * Accepts a selector, a bare element id, or a visible label — in that
 * order of precision. The label fallback exists because the person
 * writing a walkthrough knows what the button says and should not have
 * to go and look up what it is called in the markup.
 */
export function findElement(
  input: Record<string, unknown>,
  doc: DocumentLike | null = ambient()
): ElementLike | null {
  if (!doc) return null;

  if (typeof input.selector === "string" && input.selector) {
    try {
      const hit = doc.querySelector(input.selector);
      if (hit) return hit;
    } catch {
      // An invalid selector is a bad instruction, not a crash: fall
      // through to the other ways of naming the thing.
    }
  }

  if (typeof input.elementId === "string" && input.elementId) {
    const hit = doc.getElementById(input.elementId);
    if (hit) return hit;
  }

  if (typeof input.label === "string" && input.label) {
    const wanted = input.label.trim().toLowerCase();
    const candidates = doc.querySelectorAll("button, a, [role='button'], label, [aria-label]");
    for (const candidate of Array.from(candidates)) {
      const text = (candidate.getAttribute("aria-label") ?? candidate.textContent ?? "")
        .trim()
        .toLowerCase();
      if (text === wanted) return candidate;
    }
  }

  return null;
}

/**
 * Whether anything matches `selector` right now.
 *
 * Swallows a bad selector and a missing document, because this is the
 * predicate a wait loop runs dozens of times: an exception thrown on
 * the fortieth poll would surface as a crash rather than as the
 * timeout it actually is.
 */
export function elementPresent(selector: string, doc: DocumentLike | null = ambient()): boolean {
  if (!doc || !selector) return false;
  try {
    return doc.querySelector(selector) !== null;
  } catch {
    return false;
  }
}

/** The attribute a focused element carries, for the host's own CSS to target. */
export const FOCUS_ATTR = "data-openverb-focus";
export const LABEL_ATTR = "data-openverb-label";

/** Mark one element as focused, having unmarked whatever was before it. */
export function mark(
  element: ElementLike,
  label?: string,
  doc: DocumentLike | null = ambient()
): void {
  clearMarks(doc);
  element.setAttribute?.(FOCUS_ATTR, "true");
  if (label) element.setAttribute?.(LABEL_ATTR, String(label));
}

/** Remove every mark this library put on the page, and nothing else. */
export function clearMarks(doc: DocumentLike | null = ambient()): void {
  if (!doc) return;
  for (const marked of Array.from(doc.querySelectorAll(`[${FOCUS_ATTR}]`))) {
    marked.removeAttribute?.(FOCUS_ATTR);
    marked.removeAttribute?.(LABEL_ATTR);
  }
}

/**
 * Resolve once `ready()` is true, or false once the clock runs out.
 *
 * Checks before waiting at all, so a condition already met costs
 * nothing — the common case, since most of these waits are insurance
 * rather than an actual pause. Timing out resolves false instead of
 * throwing: the caller decides whether a missing element means stop or
 * carry on, and a wait that cannot fail is a hang.
 */
export function until(ready: () => boolean, timeoutMs: number): Promise<boolean> {
  if (ready()) return Promise.resolve(true);
  return new Promise((resolve) => {
    const deadline = now() + timeoutMs;
    const tick = () => {
      if (ready()) return resolve(true);
      if (now() >= deadline) return resolve(false);
      setTimeout(tick, POLL_MS);
    };
    setTimeout(tick, POLL_MS);
  });
}

/**
 * Forms, which until 0.3.0 the package only pretended to fill.
 *
 * The four ui.form.* handlers returned `{ success: true }` and did
 * nothing. That is the worst shape a stub can take: a walkthrough calls
 * fill, is told it worked, and submits an empty form one beat later with
 * nothing anywhere saying why. Every other unconfigured verb in this
 * library says so plainly; these now do the work instead.
 */

/** The attribute a form carries so verbs can name it. */
export const FORM_ATTR = "data-openverb-id";

export function findForm(formId: string, doc: DocumentLike | null = ambient()): ElementLike | null {
  if (!doc || !formId) return null;
  // CSS.escape is not on DocumentLike and not worth requiring; an id
  // with a quote in it is a naming problem, not a lookup problem.
  try {
    return doc.querySelector(`[${FORM_ATTR}="${formId}"]`);
  } catch {
    return null;
  }
}

/** A field within a form: by name first, since that is what forms use. */
export function findField(form: ElementLike, name: string): ElementLike | null {
  const scope = form as unknown as DocumentLike;
  if (typeof scope.querySelector !== "function" || !name) return null;
  try {
    return scope.querySelector(`[name="${name}"]`) ?? scope.querySelector(`#${name}`) ?? null;
  } catch {
    return null;
  }
}

/**
 * Set a field's value so the application notices.
 *
 * Assigning `.value` is enough for the DOM and invisible to React, which
 * tracks the previous value on the node and skips the change event when
 * the two look the same. The library would fill a field, the app's state
 * would stay empty, and submit would send nothing - so the value goes in
 * through the prototype's own setter and the event is dispatched by
 * hand. Most hosts here are React, and a fill that only convinces the
 * DOM is the stub again in a different costume.
 */
function assignThroughPrototype(
  node: Record<string, unknown>,
  property: "value" | "checked",
  next: unknown
): void {
  // Walk up, because the setter lives on HTMLInputElement.prototype
  // rather than on the node, and a subclass may sit in between.
  let level: object | null = Object.getPrototypeOf(node) as object | null;
  while (level) {
    const descriptor = Object.getOwnPropertyDescriptor(level, property);
    if (descriptor?.set) {
      descriptor.set.call(node, next);
      return;
    }
    level = Object.getPrototypeOf(level) as object | null;
  }
  node[property] = next;
}

export function setFieldValue(field: ElementLike, value: string): boolean {
  const node = field as unknown as Record<string, unknown> & {
    type?: string;
    dispatchEvent?: (event: unknown) => boolean;
  };
  if (!node || typeof node.dispatchEvent !== "function") return false;

  // A checkbox is not a text field with a different setter. React wires
  // its onChange to the CLICK event, so setting `checked` and firing
  // input/change ticks the box in the DOM and tells the application
  // nothing - it re-renders the old state straight back over it. The
  // honest way to tick a box is to click it, and only when it is not
  // already in the state being asked for, since a click toggles.
  if (node.type === "checkbox" || node.type === "radio") {
    const on = value === "true" || value === "on" || value === "1";
    if (node.checked === on) return true;
    // MouseEvent where there is one; a plain Event elsewhere, so this
    // does not throw outside a browser.
    const click =
      typeof MouseEvent === "function"
        ? new MouseEvent("click", { bubbles: true, cancelable: true })
        : new Event("click", { bubbles: true, cancelable: true });
    node.dispatchEvent(click);
    return true;
  }

  // Text fields are the opposite case: assigning `value` is what React
  // suppresses, because its tracker shadows the prototype accessor and
  // records the write as already seen. Going through the prototype
  // descriptor steps around the tracker so the change counts.
  assignThroughPrototype(node, "value", value);
  for (const type of ["input", "change"]) {
    node.dispatchEvent(new Event(type, { bubbles: true }));
  }
  return true;
}

/**
 * Compare where the app is with where it was asked to go.
 *
 * Trailing slashes and a leading slash are noise here: a route
 * declared as `folders` and a location of `/app/folders/` are the same
 * place, and a demo should not break over the spelling.
 */
export function pathMatches(actual: string, wanted: string): boolean {
  const trim = (s: string) => s.replace(/^\/+|\/+$/g, "");
  const a = trim(actual);
  const b = trim(wanted);
  if (!b) return false;
  return a === b || a.endsWith(`/${b}`);
}
