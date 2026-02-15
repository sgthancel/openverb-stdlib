/**
 * @openverb/stdlib — OpenVerb Standard Library
 *
 * Canonical verb definitions for AI-app interaction.
 * 7 families, 19 verbs covering theme, navigation, search,
 * modals, toasts, forms, and user sessions.
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
