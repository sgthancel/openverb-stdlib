import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { getAllVerbs } from "../src/manifests.js";

/**
 * Every published verb must have a handler, and every handler must be
 * a published verb.
 *
 * This is here because of how the two halves drift apart: a manifest is
 * the easy half to write, so a family gets declared, documented and
 * shipped while the hook never learns to answer it. Nothing else in the
 * build notices — the manifest validates, the types compile, and the
 * failure arrives as `Unknown verb` at the one moment it matters, in
 * front of whoever the walkthrough was for.
 *
 * Reading the source text is crude, but calling the hook needs a React
 * renderer, and the thing being checked is a list of string keys.
 */
const source = readFileSync(new URL("../src/useOpenVerb.ts", import.meta.url), "utf-8");

/** Handler keys, which are the only quoted dotted ids at line start in the map. */
const handled = new Set(
  Array.from(source.matchAll(/^\s{6}"([a-z_]+(?:\.[a-z_]+)+)":/gm), (m) => m[1])
);

describe("handler coverage", () => {
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
