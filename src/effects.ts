/**
 * What a verb does to the world, and how much of that you will allow.
 *
 * Every verb in this library is safe to fire. A host's own verbs are
 * not: the same mechanism that lets an assistant navigate a page lets it
 * send an invoice, and nothing in the format distinguished the two. That
 * is tolerable while a person is reading each call and approving it. It
 * stops being tolerable the moment calls are run from a file — a product
 * tour, an onboarding walkthrough, a scripted sequence — where nobody is
 * reading anything and the audience is watching.
 *
 * So a verb declares what it touches, and a caller declares what it will
 * permit. Those are two different people: the host owns the verb library
 * and knows what its verbs do, while the document only gets to choose
 * from what it has been allowed. A document that could widen its own
 * permissions would not be a permission.
 */

/**
 * The four kinds, in order of how much they commit you to.
 *
 * The line that matters for anything scripted is between `ui` and
 * `data`: whether a refresh undoes it.
 */
export type VerbEffects =
  /** Reads. Changes nothing, commits to nothing. */
  | "read"
  /** Changes what is on screen. A refresh undoes it. */
  | "ui"
  /** Changes what the application has stored. A refresh does not undo it. */
  | "data"
  /** Leaves the application: messages, money, third parties, anything irreversible. */
  | "external";

/** Least committing first. An index into this is a comparison. */
export const EFFECT_ORDER: readonly VerbEffects[] = ["read", "ui", "data", "external"];

/**
 * What an unannotated verb is treated as.
 *
 * `external`, deliberately. Verb libraries that predate this field have
 * no effects on any verb, and the two possible defaults are not equally
 * wrong: assume safe and every dangerous verb in every existing library
 * is callable from a script on day one, assume dangerous and a host adds
 * one field to the verbs it wants scripted. The second failure is a
 * clear refusal naming the verb. The first is an invoice.
 */
export const UNDECLARED: VerbEffects = "external";

export function isVerbEffects(value: unknown): value is VerbEffects {
  return typeof value === "string" && (EFFECT_ORDER as readonly string[]).includes(value);
}

/**
 * What this verb declares, or `external` if it declares nothing.
 *
 * Takes the definition rather than an id, so it works for a host's own
 * verbs as readily as for these.
 */
export function effectsOf(verb: unknown): VerbEffects {
  const declared = (verb as { effects?: unknown } | null)?.effects;
  return isVerbEffects(declared) ? declared : UNDECLARED;
}

/** True when `effects` is no more committing than `limit`. */
export function withinLimit(effects: VerbEffects, limit: VerbEffects): boolean {
  return EFFECT_ORDER.indexOf(effects) <= EFFECT_ORDER.indexOf(limit);
}

export interface Policy {
  /** The most this caller will permit without being asked. Defaults to `ui`. */
  limit?: VerbEffects;
  /**
   * Verb ids permitted regardless of what they declare.
   *
   * The escape hatch that makes the strict default usable. A product
   * tour has to be able to press Create, and `ui.form.submit` is
   * correctly marked `external` because submitting a form sends data
   * somewhere. The host is the one who knows that its own submit, in
   * demo mode, writes to a scratchpad — so the host says so, per verb,
   * in its own code. The document cannot.
   */
  allow?: readonly string[];
  /** Verb ids refused regardless. Checked before everything else. */
  deny?: readonly string[];
}

export interface Decision {
  allowed: boolean;
  effects: VerbEffects;
  /** Why, in a form worth putting in front of whoever wrote the document. */
  reason: string;
}

/**
 * Whether this caller may fire this verb.
 *
 * Returns a decision rather than a boolean, because a refusal that
 * cannot say which verb it refused or what that verb declared sends
 * whoever wrote the document hunting through a manifest.
 */
export function decide(verbId: string, verb: unknown, policy: Policy = {}): Decision {
  const effects = effectsOf(verb);
  const limit = policy.limit ?? "ui";

  if (policy.deny?.includes(verbId)) {
    return { allowed: false, effects, reason: `${verbId} is on the deny list` };
  }

  if (policy.allow?.includes(verbId)) {
    return { allowed: true, effects, reason: `${verbId} is permitted explicitly` };
  }

  if (withinLimit(effects, limit)) {
    return { allowed: true, effects, reason: `${verbId} is ${effects}, within ${limit}` };
  }

  const undeclared = !isVerbEffects((verb as { effects?: unknown } | null)?.effects);
  return {
    allowed: false,
    effects,
    reason: undeclared
      ? `${verbId} declares no effects, so it is treated as ${UNDECLARED}; ` +
        `add "effects" to its manifest, or permit it explicitly`
      : `${verbId} is ${effects}, beyond the limit of ${limit}; permit it explicitly to allow it`,
  };
}
