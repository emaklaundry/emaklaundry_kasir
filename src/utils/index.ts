// Helper untuk generate UUID universal
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
export * from './supabaseClient';
export * from './dateHelpers';
export * from './rateLimiter';
export * from './performance';
export * from './retryUtils';
export * from './roundingUtils';
export * from './mappers';
export * from './sanitize';
