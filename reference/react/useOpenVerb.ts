/**
 * OpenVerb Standard Library — React Reference
 *
 * This file used to be a second, hand-maintained copy of the hook. It
 * drifted: 0.2.0 added `ui.focus` and `ui.wait` to the package and this
 * copy kept answering nineteen verbs, so anyone who pasted it got a
 * walkthrough that could operate an app but not point at it. Its
 * `executeVerb` was also synchronous, which silently returns a pending
 * Promise for the two waiting verbs instead of the result.
 *
 * There is now one implementation, and it ships in the package. React
 * apps install it rather than paste it — if you are using this hook you
 * already have a package manager.
 *
 *     npm install openverb @openverb/stdlib
 *
 * Copy-paste without a build step is what `reference/vanilla/verbs.js`
 * is for. It is standalone and has no dependencies.
 */

export {
  useOpenVerb,
  type OpenVerbConfig,
  type Route,
  type ModalEntry,
  type SearchResult,
  type SessionUser,
  type VerbResult,
  type VerbHandler,
  type VerbHandlers,
} from "@openverb/stdlib/react";

/**
 * Wiring, in full. Everything past `navigate` is optional.
 *
 * ```tsx
 * const { executeVerb } = useOpenVerb({
 *   routes,
 *   navigate: (path) => router.push(path),
 *
 *   // ui.focus.* and ui.wait.* need none of this. Unlike every other
 *   // family they work with no host wiring at all, falling back to
 *   // querySelector, getBoundingClientRect and location. Supply these
 *   // three only to override that:
 *   focusElement: (el, label) => myHighlight.show(el, label),
 *   clearFocus: () => myHighlight.hide(),
 *   currentPath: () => usePathname(),
 * });
 *
 * // Await it: ui.wait.* genuinely waits, and everything else resolves
 * // immediately, so awaiting costs a microtask.
 * await executeVerb("ui.focus.element", {
 *   selector: "#field-name",
 *   label: "Start with a name",
 * });
 * ```
 *
 * With no `focusElement`, the focused element carries
 * `data-openverb-focus` and the look is yours:
 *
 * ```css
 * [data-openverb-focus] {
 *   outline: 2px solid var(--accent);
 *   box-shadow: 0 0 0 8px color-mix(in oklab, var(--accent) 25%, transparent);
 * }
 * [data-openverb-focus]::after {
 *   content: attr(data-openverb-label);
 * }
 * ```
 */
