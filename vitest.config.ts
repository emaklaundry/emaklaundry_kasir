import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // vite-plugin-pwa's virtual module only exists in Vite builds; point tests at a stub.
      'virtual:pwa-register/react': path.resolve(
        __dirname,
        './src/__tests__/stubs/pwa-register-react.ts',
      ),
    },
  },
});
