import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo192.png', 'logo512.png'],
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'UniAce',
          short_name: 'UniAce',
          description: 'UniAce Learning Platform',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'logo192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'logo512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // Increased to 10MB for larger assets
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                },
              }
            },
            {
              // Cache KaTeX fonts and other local assets
              urlPattern: /\.(?:woff|woff2|ttf|eot|svg|png|jpg|jpeg|gif)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'assets-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
                }
              }
            },
            {
              // Cache API responses (Network First for fresh data, fallback to cache)
              urlPattern: /\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 1 Day
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      // API keys should not be exposed to the client
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // If enabled, configure it to run gracefully in restricted proxy environments with no full-screen overlays.
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        overlay: false,
        clientPort: 443,
        timeout: 5000,
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'firebase-vendor';
              }
              if (id.includes('katex')) {
                return 'katex-vendor';
              }
              if (id.includes('pdfjs-dist')) {
                return 'pdfjs-vendor';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'charts-vendor';
              }
              if (id.includes('lucide-react')) {
                return 'icons-vendor';
              }
              return 'vendor';
            }
          }
        }
      }
    },
    base: './',
  };
});
