import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    sequence: {
      concurrent: false,
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules",
        "dist",
        "tests",
        "**/*.test.ts",
        "**/*.d.ts",
        "src/scripts",
        "vitest.config.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "src/**/__tests__/**/*.test.ts"],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@scripts": path.resolve(__dirname, "./src/scripts"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@types": path.resolve(__dirname, "./src/types.js"),
      "@database": path.resolve(__dirname, "./src/database.js"),
      "@logger": path.resolve(__dirname, "./src/logger.js"),
      "@schemas": path.resolve(__dirname, "./src/schemas.js"),
      "@tests": path.resolve(__dirname, "./tests"),
    },
  },
});
