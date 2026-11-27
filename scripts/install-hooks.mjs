// Dijalankan oleh "npm install" (script prepare): arahkan git ke folder .githooks.
// Diam saja bila bukan repo git (mis. build di Vercel).
import { execSync } from 'node:child_process';

try {
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  execSync('git config core.hooksPath .githooks', { stdio: 'ignore' });
} catch {
  // bukan repo git atau git tidak tersedia
}
