import { defineConfig } from "vitest/config";
import { defaultServerConditions } from "vite";

export default defineConfig({
  resolve: {
    // Resolve @labyrinth/rules to its TypeScript source, no build needed.
    conditions: ["source", ...defaultServerConditions],
  },
  ssr: {
    resolve: {
      conditions: ["source", ...defaultServerConditions],
    },
  },
  test: {
    testTimeout: 15_000,
  },
});
