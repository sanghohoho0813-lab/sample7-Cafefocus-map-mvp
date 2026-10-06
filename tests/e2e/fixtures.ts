import { test as base, expect } from "@playwright/test";

/** 화요일 오후 2시 10분(서울)으로 시계를 고정하고, 외부 요청(웹폰트 등)은 막아 결과를 결정적으로 만든다 */
export const NOW = "2026-10-06T14:10:00+09:00";

export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && !m.text().includes("ERR_FAILED") && !m.location().url.includes("/nope")) errors.push(m.text());
    });
    await use(errors);
  },
  page: async ({ page, context, baseURL }, use) => {
    await context.clock.setFixedTime(new Date(NOW));
    await context.route("**/*", (route) => {
      const url = route.request().url();
      return url.startsWith(baseURL!) || url.startsWith("data:") ? route.continue() : route.abort();
    });
    await use(page);
  },
});

export { expect };
