import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      "**/node_modules/**",
      "__tests__/e2e/**",
      "__tests__/vrt/**",
    ],
  },
});
