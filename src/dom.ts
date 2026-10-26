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
