/**
 * Performance Monitoring Utilities
 * Untuk tracking performance dan debugging bottleneck
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100; // Simpan max 100 metrics terakhir
  private readonly slowThreshold = 100; // Warn jika operasi > 100ms

  /**
   * Measure waktu eksekusi function
   * @param name - Nama operasi
   * @param fn - Function yang akan diukur
   * @returns Hasil dari function
   */
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    this.recordMetric(name, duration);

    if (duration > this.slowThreshold) {
      console.warn(`⚠️ Slow operation detected: "${name}" took ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  /**
   * Measure waktu eksekusi async function
   * @param name - Nama operasi
   * @param fn - Async function yang akan diukur
   * @returns Promise hasil dari function
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    this.recordMetric(name, duration);

    if (duration > this.slowThreshold) {
      console.warn(`⚠️ Slow async operation detected: "${name}" took ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  /**
   * Start manual performance measurement
   * @param name - Nama operasi
   * @returns Function untuk stop measurement
   */
  start(name: string): () => void {
    const start = performance.now();

    return () => {
      const end = performance.now();
      const duration = end - start;
      this.recordMetric(name, duration);

      if (duration > this.slowThreshold) {
        console.warn(`⚠️ Slow operation detected: "${name}" took ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Record metric ke storage
   * @param name - Nama operasi
   * @param duration - Durasi dalam ms
   */
  private recordMetric(name: string, duration: number): void {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    // Keep only last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get semua metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics untuk operasi tertentu
   * @param name - Nama operasi
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get rata-rata durasi untuk operasi tertentu
   * @param name - Nama operasi
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Get operasi paling lambat
   * @param limit - Jumlah operasi yang ditampilkan (default: 10)
   */
  getSlowestOperations(limit: number = 10): PerformanceMetric[] {
    return [...this.metrics].sort((a, b) => b.duration - a.duration).slice(0, limit);
  }

  /**
   * Clear semua metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    if (this.metrics.length === 0) {
      return 'No performance metrics recorded.';
    }

    const slowest = this.getSlowestOperations(5);
    const uniqueOperations = [...new Set(this.metrics.map((m) => m.name))];

    let report = '📊 Performance Report\n';
    report += '='.repeat(50) + '\n\n';

    report += `Total Operations: ${this.metrics.length}\n`;
    report += `Unique Operations: ${uniqueOperations.length}\n\n`;

    report += '🐌 Top 5 Slowest Operations:\n';
    slowest.forEach((m, i) => {
      report += `  ${i + 1}. ${m.name}: ${m.duration.toFixed(2)}ms\n`;
    });

    report += '\n📈 Average Duration by Operation:\n';
    uniqueOperations.forEach((name) => {
      const avg = this.getAverageDuration(name);
      const count = this.getMetricsByName(name).length;
      report += `  ${name}: ${avg.toFixed(2)}ms (${count} calls)\n`;
    });

    return report;
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator untuk measure performance (untuk development)
 */
export function measurePerformance(
  target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptor.value = async function (...args: any[]) {
    const stop = performanceMonitor.start(`${target.constructor.name}.${propertyKey}`);
    try {
      return await originalMethod.apply(this, args);
    } finally {
      stop();
    }
  };

  return descriptor;
}

/**
 * Log performance report ke console (dev only)
 */
export function logPerformanceReport(): void {
  if (import.meta.env.DEV) {
    // console.log(performanceMonitor.generateReport());
  }
}
