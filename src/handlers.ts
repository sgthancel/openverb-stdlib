/**
 * Verb handler types and dispatcher
 */

export interface VerbResult {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

export type VerbHandler = (input: Record<string, unknown>) => VerbResult | Promise<VerbResult>;

export type VerbHandlers = Record<string, VerbHandler>;

/**
 * Create a verb handler map from partial implementations.
 * Handlers that are not provided will return an error when called.
 */
export function createVerbHandlers(handlers: Partial<VerbHandlers>): VerbHandlers {
  return { ...handlers } as VerbHandlers;
}

/**
 * Execute a verb by id against a handler map.
 */
export async function executeVerb(
  handlers: VerbHandlers,
  verbId: string,
  input: Record<string, unknown> = {}
): Promise<VerbResult> {
  const handler = handlers[verbId];
  if (!handler) {
    return { error: `Unknown verb: ${verbId}` };
  }
  try {
    return await handler(input);
  } catch (err) {
    return { error: (err as Error).message };
  }
}
