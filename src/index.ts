/**
 * @openverb/stdlib — OpenVerb Standard Library
 *
 * Starter verb definitions that every app should have.
 * These are not exhaustive — they're the common baseline.
 * Apps define their own verb libraries for domain-specific actions.
 *
 * Level 0 (Website UI Starter): 9 families, 23 verbs covering theme,
 * navigation, search, modals, toasts, forms, sessions, and — as of
 * 0.2.0 — pointing at things and waiting for them.
 */

export { manifests, getManifest, getAllVerbs, findVerb } from "./manifests.js";
// What a verb touches, and what a caller will permit. Needed by
// anything that runs verbs from a file rather than from a person.
export {
  type VerbEffects,
  type Policy,
  type Decision,
  EFFECT_ORDER,
  UNDECLARED,
  isVerbEffects,
  effectsOf,
  withinLimit,
  decide,
} from "./effects.js";
export { routeRegistry, type Route, findRouteByIntent, getRoutesForRole } from "./registries.js";
export {
  createVerbHandlers,
  executeVerb,
  type VerbHandler,
  type VerbHandlers,
  type VerbResult,
} from "./handlers.js";
export type {
  ModalEntry,
  SearchResult,
  SessionUser,
  FormField,
  FormEntry,
  ToastOptions,
} from "./types.js";

// Re-export verb family constants
export {
  THEME_VERBS,
  NAV_VERBS,
  SEARCH_VERBS,
  TOAST_VERBS,
  MODAL_VERBS,
  FORM_VERBS,
  FOCUS_VERBS,
  WAIT_VERBS,
  SESSION_VERBS,
  ALL_VERB_IDS,
} from "./constants.js";

// The DOM helpers behind ui.focus.* and ui.wait.*. Exported because a
// host that supplies its own highlight still wants the element
// resolution — naming a thing three ways is the useful part, and
// nobody should write it twice.
export {
  DEFAULT_WAIT_MS,
  POLL_MS,
  FOCUS_ATTR,
  LABEL_ATTR,
  findElement,
  elementPresent,
  mark,
  clearMarks,
  until,
  pathMatches,
  type DocumentLike,
  type ElementLike,
} from "./dom.js";
