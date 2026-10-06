import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // 날짜 계산은 서울 시간 기준으로 검증한다 (CI 러너의 기본 시간대와 무관하게)
    env: { TZ: "Asia/Seoul" },
  },
});
