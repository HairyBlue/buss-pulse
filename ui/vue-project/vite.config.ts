import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from "vite-plugin-pwa";
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Buss Pulse',
        short_name: 'Buss Pulse',
        description: 'Buss Pulse',
        icons: [
          {
            src: 'image/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'image/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/image/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: "apple touch icon"
          }
        ],
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#ffffff"
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
