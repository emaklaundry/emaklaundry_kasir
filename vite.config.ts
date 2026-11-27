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
      // Sama dengan rewrite di vercel.json: BMKG tidak selalu mengirim header CORS,
      // jadi browser memanggilnya lewat origin sendiri.
      proxy: {
        '/api/bmkg': {
          target: 'https://api.bmkg.go.id',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/bmkg/, '/publik'),
        },
      },
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
          // Injected manifest will exclude these
          globIgnores: ['**/node_modules/**/*', '**/exceljs.min-*.js'],
        },
        // 'prompt': a new version waits until the user taps "Perbarui Sekarang" in
        // PWAUpdatePrompt, so an open transaction form is never lost to an auto-reload.
        registerType: 'prompt',
        // Disable dev mode service worker to prevent caching issues during development
        devOptions: {
          enabled: false,
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'Emak Laundry - Sistem Kasir',
          short_name: 'Emak Laundry',
          description: 'Sistem Manajemen Laundry dengan fitur transaksi, inventory, dan laporan',
          lang: 'id',
          dir: 'ltr',
          theme_color: '#3b82f6',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          // 'any' so the installed app also works on tablets/desktops in landscape
          orientation: 'any',
          icons: [
            {
              src: '/favicon/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/favicon/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/favicon/maskable-icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/favicon/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Transaksi Baru',
              short_name: 'Transaksi Baru',
              url: '/transactions/new',
              icons: [
                { src: '/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
              ],
            },
            {
              name: 'Daftar Transaksi',
              short_name: 'Transaksi',
              url: '/transactions',
              icons: [
                { src: '/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
              ],
            },
          ],
          categories: ['business', 'productivity'],
          prefer_related_applications: false,
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
      __SW_VERSION__: JSON.stringify(pkg.version),
    },
    build: {
      target: 'es2024',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-tanstack': ['@tanstack/react-query'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});
