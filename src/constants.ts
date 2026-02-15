/**
 * Verb ID constants for Level 0 starter verbs.
 *
 * These are the standard verbs every app should have.
 * Your app will define additional verbs for domain-specific actions
 * using your own verb libraries.
 */

export const THEME_VERBS = {
  GET: "ui.theme.get",
  SET: "ui.theme.set",
} as const;

export const NAV_VERBS = {
  LIST_PAGES: "ui.nav.list_pages",
  GO: "ui.nav.go",
  BACK: "ui.nav.back",
} as const;

export const SEARCH_VERBS = {
  QUERY: "ui.search.query",
  OPEN_RESULT: "ui.search.open_result",
} as const;

export const TOAST_VERBS = {
  SHOW: "ui.toast.show",
  DISMISS: "ui.toast.dismiss",
} as const;

export const MODAL_VERBS = {
  OPEN: "ui.modal.open",
  CLOSE: "ui.modal.close",
  LIST: "ui.modal.list",
} as const;

export const FORM_VERBS = {
  LIST: "ui.form.list",
  FILL: "ui.form.fill",
  SUBMIT: "ui.form.submit",
  RESET: "ui.form.reset",
} as const;

export const SESSION_VERBS = {
  GET: "user.session.get",
  LOGOUT: "user.session.logout",
  GET_PREFERENCES: "user.session.get_preferences",
} as const;

/** All 19 starter verb IDs (Level 0). Your app will have more. */
export const ALL_VERB_IDS = [
  ...Object.values(THEME_VERBS),
  ...Object.values(NAV_VERBS),
  ...Object.values(SEARCH_VERBS),
  ...Object.values(TOAST_VERBS),
  ...Object.values(MODAL_VERBS),
  ...Object.values(FORM_VERBS),
  ...Object.values(SESSION_VERBS),
] as const;
