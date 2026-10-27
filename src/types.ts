/**
 * Shared types for OpenVerb Standard Library
 */

export interface Route {
  id: string;
  title: string;
  path: string;
  tags: string[];
  requiresAuth: boolean;
}

export interface ModalEntry {
  id: string;
  title: string;
  description: string;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
  type: string;
}

export interface SessionUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

export interface FormField {
  name: string;
  type: string;
  label: string;
  required: boolean;
}

export interface FormEntry {
  id: string;
  title: string;
  fields: FormField[];
}

export interface ToastOptions {
  message: string;
  variant?: "info" | "success" | "warning" | "error";
  duration?: number;
}

export interface VerbManifest {
  family: string;
  version: string;
  verbs: VerbDefinition[];
}

export interface VerbDefinition {
  id: string;
  version: string;
  summary: string;
  /**
   * What this verb touches: "read", "ui", "data" or "external".
   *
   * Optional in the type because verb libraries written before this
   * field exist and still have to load. It is not optional in effect: a
   * verb that declares nothing is treated as "external" and anything
   * running verbs from a file will refuse it. See src/effects.ts.
   */
  effects?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}
