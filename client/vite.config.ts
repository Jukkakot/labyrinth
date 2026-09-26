import react from "@vitejs/plugin-react";
import { defaultClientConditions, defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app under /labyrinth/; the deploy workflow sets VITE_BASE.
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  resolve: {
    // Resolve @labyrinth/rules to its TypeScript source, no build needed.
    conditions: ["source", ...defaultClientConditions],
  },
});
