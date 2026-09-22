import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // "use server" 액션이나 DB 접근이 필요한 통합 테스트는 범위 밖 —
    // 순수 함수(lib/*) 위주의 단위 테스트만 다룬다.
    exclude: ["node_modules", ".next", "e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
