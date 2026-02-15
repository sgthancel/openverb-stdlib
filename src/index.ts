/**
 * @openverb/stdlib — OpenVerb Standard Library
 *
 * Starter verb definitions that every app should have.
 * These are not exhaustive — they're the common baseline.
 * Apps define their own verb libraries for domain-specific actions.
 *
 * Level 0 (Website UI Starter): 7 families, 19 verbs
 * covering theme, navigation, search, modals, toasts, forms, and sessions.
 */

export { manifests, getManifest, getAllVerbs, findVerb } from "./manifests.js";
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
  SESSION_VERBS,
  ALL_VERB_IDS,
} from "./constants.js";
