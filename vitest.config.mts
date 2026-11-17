import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: { COY_PGLITE_DIR: "memory://" },
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
