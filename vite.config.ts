import path from 'path';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Inject version from package.json
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        // Use injectManifest so we can bundle and use a custom service worker source (src/sw.js)
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        injectManifest: {
          // Files to include in the precache manifest
          globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
        },
        registerType: 'prompt', // Changed from autoUpdate to give user control
        // Disable dev mode service worker to prevent caching issues during development
        devOptions: {
          enabled: false,
        },
        includeAssets: ['favicon/favicon.ico', 'favicon/apple-touch-icon.png'],
        manifest: {
          name: 'Emak Laundry - Sistem Kasir',
          short_name: 'Emak Laundry',
          description: 'Sistem Manajemen Laundry dengan fitur transaksi, inventory, dan laporan',
          theme_color: '#3b82f6',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          orientation: 'portrait',
          icons: [
            {
              src: '/favicon/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/favicon/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
          categories: ['business', 'productivity'],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    },
  };
});
