/**
 * Load and query verb manifests
 */

import type { VerbManifest, VerbDefinition } from "./types.js";

// Import manifests as JSON
import uiTheme from "../manifests/ui.theme.json";
import uiNav from "../manifests/ui.nav.json";
import uiSearch from "../manifests/ui.search.json";
import uiToast from "../manifests/ui.toast.json";
import uiModal from "../manifests/ui.modal.json";
import uiForm from "../manifests/ui.form.json";
import userSession from "../manifests/user.session.json";

/** All Level 0 verb manifests */
export const manifests: VerbManifest[] = [
  uiTheme as VerbManifest,
  uiNav as VerbManifest,
  uiSearch as VerbManifest,
  uiToast as VerbManifest,
  uiModal as VerbManifest,
  uiForm as VerbManifest,
  userSession as VerbManifest,
];

/** Get a manifest by family name */
export function getManifest(family: string): VerbManifest | undefined {
  return manifests.find((m) => m.family === family);
}

/** Get all verb definitions across all families */
export function getAllVerbs(): VerbDefinition[] {
  return manifests.flatMap((m) => m.verbs);
}

/** Find a specific verb definition by id */
export function findVerb(verbId: string): VerbDefinition | undefined {
  return getAllVerbs().find((v) => v.id === verbId);
}
