/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defaultClientConditions, defaultServerConditions, defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves the app under /labyrinth/; the deploy workflow sets VITE_BASE.
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  define: {
    // UTC time of `vite build`, shown on the start screen; null ("dev") for the dev server and tests.
    __BUILD_TIME__: JSON.stringify(command === "build" ? new Date().toISOString() : null),
  },
  resolve: {
    // Resolve the shared workspace packages to their TypeScript source, no build needed.
    conditions: ["source", ...defaultClientConditions],
  },
  // Same for Vitest, which resolves modules like a server.
  ssr: {
    resolve: {
      conditions: ["source", ...defaultServerConditions],
    },
  },
  test: {
    setupFiles: ["./src/test/setup.ts"],
  },
}));
