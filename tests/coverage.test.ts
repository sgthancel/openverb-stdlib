import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { getAllVerbs } from "../src/manifests.js";

/**
 * Every published verb must have a handler, and every handler must be
 * a published verb.
 *
 * This is here because of how the two halves drift apart: a manifest is
 * the easy half to write, so a family gets declared, documented and
 * shipped while an implementation never learns to answer it. Nothing
 * else in the build notices — the manifest validates, the types
 * compile, and the failure arrives as `Unknown verb` at the one moment
 * it matters, in front of whoever the walkthrough was for.
 *
 * This is not hypothetical. 0.2.0 shipped with a reference
 * implementation stuck at nineteen verbs, because adding a family means
 * remembering every place that answers verbs, and nothing was checking.
 *
 * Reading source text is crude, but calling a hook needs a React
 * renderer, and the thing being checked is a list of string keys.
 */
function handlerKeysIn(relativePath: string): Set<string> {
  const source = readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf-8");
  return new Set(
    Array.from(source.matchAll(/^\s+"([a-z_]+(?:\.[a-z_]+)+)":\s*(?:async\s*)?\(/gm), (m) => m[1])
  );
}

/**
 * Everything that claims to answer the whole verb set.
 *
 * `reference/react/useOpenVerb.ts` is deliberately absent: it re-exports
 * the package hook instead of keeping a copy, which is the fix for the
 * drift this file exists to catch. `reference/nextjs/verbs.ts` wraps
 * that same hook and adds no handlers of its own.
 */
const IMPLEMENTATIONS = ["src/useOpenVerb.ts", "reference/vanilla/verbs.js"];

describe.each(IMPLEMENTATIONS)("handler coverage: %s", (path) => {
  const handled = handlerKeysIn(path);

  it("found the handler map at all", () => {
    // Guards the regex itself: a reformat that broke the match would
    // otherwise make every assertion below pass vacuously.
    expect(handled.size).toBeGreaterThan(10);
  });

  it("implements every verb the manifests declare", () => {
    const missing = getAllVerbs()
      .map((verb) => verb.id)
      .filter((id) => !handled.has(id));
    expect(missing).toEqual([]);
  });

  it("declares every verb it implements", () => {
    const declared = new Set(getAllVerbs().map((verb) => verb.id));
    const undeclared = Array.from(handled).filter((id) => !declared.has(id));
    expect(undeclared).toEqual([]);
  });
});

describe("reference/react", () => {
  const source = readFileSync(
    new URL("../reference/react/useOpenVerb.ts", import.meta.url),
    "utf-8"
  );

  it("re-exports the package hook rather than copying it", () => {
    // A second copy is what drifted. If someone reintroduces one, the
    // coverage check above will not see it — this will.
    expect(source).toContain('from "@openverb/stdlib/react"');
    expect(handlerKeysIn("reference/react/useOpenVerb.ts").size).toBe(0);
  });
});
