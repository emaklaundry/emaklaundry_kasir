/**
 * Rate Limiter Utility
 * Mencegah spam request dan melindungi dari abuse
 */

class RateLimiter {
  private timestamps: Map<string, number[]> = new Map();

  /**
   * Cek apakah operasi dapat dijalankan berdasarkan rate limit
   * @param key - Identifier unik untuk operasi (misal: 'login', 'transaction-create')
   * @param maxCalls - Maksimum jumlah panggilan yang diizinkan
   * @param windowMs - Window waktu dalam milidetik
   * @returns true jika dapat dijalankan, false jika sudah melebihi limit
   */
  canExecute(key: string, maxCalls: number, windowMs: number): boolean {
    const now = Date.now();
    const calls = this.timestamps.get(key) || [];
    
    // Hapus timestamp yang sudah di luar window
    const validCalls = calls.filter(timestamp => now - timestamp < windowMs);
    
    // Cek apakah sudah melebihi limit
    if (validCalls.length >= maxCalls) {
      return false;
    }
    
    // Tambahkan timestamp baru
    validCalls.push(now);
    this.timestamps.set(key, validCalls);
    return true;
  }

  /**
   * Reset rate limit untuk key tertentu
   * @param key - Identifier unik untuk operasi
   */
  reset(key: string): void {
    this.timestamps.delete(key);
  }

  /**
   * Clear semua rate limit
   */
  clearAll(): void {
    this.timestamps.clear();
  }

  /**
   * Mendapatkan jumlah remaining calls
   * @param key - Identifier unik untuk operasi
   * @param maxCalls - Maksimum jumlah panggilan yang diizinkan
   * @param windowMs - Window waktu dalam milidetik
   * @returns Jumlah panggilan yang masih bisa dilakukan
   */
  getRemainingCalls(key: string, maxCalls: number, windowMs: number): number {
    const now = Date.now();
    const calls = this.timestamps.get(key) || [];
    const validCalls = calls.filter(timestamp => now - timestamp < windowMs);
    
    return Math.max(0, maxCalls - validCalls.length);
  }

  /**
   * Mendapatkan waktu tunggu sebelum bisa request lagi (dalam ms)
   * @param key - Identifier unik untuk operasi
   * @param maxCalls - Maksimum jumlah panggilan yang diizinkan
   * @param windowMs - Window waktu dalam milidetik
   * @returns Waktu tunggu dalam milidetik, 0 jika sudah bisa request
   */
  getRetryAfter(key: string, maxCalls: number, windowMs: number): number {
    const now = Date.now();
    const calls = this.timestamps.get(key) || [];
    const validCalls = calls.filter(timestamp => now - timestamp < windowMs);
    
    if (validCalls.length < maxCalls) {
      return 0;
    }
    
    // Waktu oldest call + window - sekarang
    const oldestCall = validCalls[0];
    return Math.max(0, (oldestCall + windowMs) - now);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Helper function untuk menerapkan rate limiting di async function
 * @param key - Identifier unik
 * @param fn - Function yang akan dijalankan
 * @param maxCalls - Max calls (default: 5)
 * @param windowMs - Window time (default: 60000ms = 1 menit)
 */
export async function withRateLimit<T>(
  key: string,
  fn: () => Promise<T>,
  maxCalls: number = 5,
  windowMs: number = 60000,
): Promise<T> {
  if (!rateLimiter.canExecute(key, maxCalls, windowMs)) {
    const retryAfter = rateLimiter.getRetryAfter(key, maxCalls, windowMs);
    throw new Error(
      `Rate limit exceeded. Silakan tunggu ${Math.ceil(retryAfter / 1000)} detik.`
    );
  }
  
  return await fn();
}
