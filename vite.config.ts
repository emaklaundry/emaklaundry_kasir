
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon/favicon.ico', 'favicon/apple-touch-icon.png'],
          manifest: {
            name: 'Laundry Management System',
            short_name: 'Laundry POS',
            description: 'A comprehensive laundry management system for cashiers and admins.',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            start_url: '/',
            icons: [
              {
                src: '/favicon/android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/favicon/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
