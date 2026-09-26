/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defaultClientConditions, defaultServerConditions, defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app under /labyrinth/; the deploy workflow sets VITE_BASE.
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
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
});
