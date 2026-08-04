import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "TranscribeMind",
        short_name: "TranscribeMind",
        description: "Transcribe y resume videos con IA en el idioma que elijas.",
        theme_color: "#0b0b0e",
        background_color: "#0b0b0e",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Only precache the app shell (build assets); API/WebSocket traffic
        // must always hit the network live, never be served from cache.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        // vite-plugin-pwa only sets these two automatically when
        // injectRegister is left on "auto" — since it's now false (we
        // register manually below to get the auto-reload-on-update
        // behavior), they have to be set explicitly here instead.
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});
