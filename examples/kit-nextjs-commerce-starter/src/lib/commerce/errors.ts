/**
 * True when an error carries the given HTTP status. Works for the SDK `CommerceError`
 * and for server-side errors that expose `status`.
 */
export const hasCommerceStatus = (error: unknown, status: number): boolean =>
  !!error &&
  typeof error === "object" &&
  (error as { status?: unknown }).status === status;
