/**
 * Retry Utility with Exponential Backoff
 * Untuk memastikan operasi critical berhasil dengan retry otomatis
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry async function dengan exponential backoff
 * @param fn - Function yang akan di-retry
 * @param options - Retry configuration
 * @returns Promise hasil dari function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Jangan retry jika sudah attempt terakhir
      if (attempt === maxRetries) {
        break;
      }

      // Callback untuk logging/notification
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait dengan exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay untuk next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw new Error(
    `Operation failed after ${maxRetries + 1} attempts. Last error: ${lastError!.message}`
  );
}

/**
 * Retry khusus untuk Supabase operations
 * Dengan detection untuk network errors
 */
export async function retrySupabaseOperation<T>(
  fn: () => Promise<T>,
  operationName: string = 'operation'
): Promise<T> {
  return retryWithBackoff(fn, {
    maxRetries: 3,
    initialDelay: 1000,
    onRetry: (attempt, error) => {
      console.warn(
        `[Retry ${attempt}/3] ${operationName} failed:`,
        error.message
      );
    },
  });
}

/**
 * Verify data setelah save dengan polling
 * Memastikan data benar-benar tersimpan di database
 */
export async function verifyDataSaved<T>(
  fetchFn: () => Promise<T | null>,
  validateFn: (data: T | null) => boolean,
  options: {
    maxAttempts?: number;
    pollInterval?: number;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 5,
    pollInterval = 500,
    timeoutMs = 5000,
  } = options;

  const startTime = Date.now();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error('Verification timeout: Data tidak dapat diverifikasi dalam waktu yang ditentukan');
    }

    try {
      const data = await fetchFn();
      
      if (validateFn(data)) {
        return data as T;
      }
    } catch (error) {
      console.warn(`Verification attempt ${attempt + 1} failed:`, error);
    }

    // Wait sebelum retry
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error('Verification failed: Data tidak dapat diverifikasi setelah disimpan');
}

/**
 * Transaction wrapper dengan rollback support
 * Untuk operasi multi-step yang harus atomic
 */
export async function executeWithRollback<T>(
  operations: Array<{
    execute: () => Promise<any>;
    rollback?: () => Promise<void>;
    description: string;
  }>
): Promise<T> {
  const completed: Array<() => Promise<void>> = [];

  try {
    let lastResult: any;

    for (const op of operations) {
      console.log(`Executing: ${op.description}`);
      lastResult = await op.execute();
      
      if (op.rollback) {
        completed.push(op.rollback);
      }
    }

    return lastResult;
  } catch (error) {
    console.error('Transaction failed, rolling back...', error);

    // Rollback dalam urutan terbalik
    for (const rollback of completed.reverse()) {
      try {
        await rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }

    throw error;
  }
}
