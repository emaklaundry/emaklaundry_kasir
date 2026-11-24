/**
 * Escape special LIKE/ILIKE pattern characters for Supabase/Postgres queries.
 * Characters %, _ and \ have special meaning in LIKE patterns.
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

/**
 * Conditional logging — only outputs in development mode.
 */
export function debugLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}
