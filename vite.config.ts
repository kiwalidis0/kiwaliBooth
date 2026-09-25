import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'kiwalibooth.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
      ],
      // Use our hand-crafted manifest from /public
      manifest: false,
      workbox: {
        // Pre-cache all built JS/CSS/HTML/font bundles
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,ico,webmanifest}'],
        // Suppress verbose workbox logs in production
        disableDevLogs: true,
        runtimeCaching: [
          {
            // Google Fonts CSS stylesheet — serve stale, update in background
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            // Google Fonts woff2 files — cache-first, they never change
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Static images from /public (mock selfies, icons)
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        // Enable service worker in dev for testing (use type: module for Vite ESM)
        enabled: false, // Set to true to test PWA features locally
        type: 'module',
      },
    }),
  ],
});
