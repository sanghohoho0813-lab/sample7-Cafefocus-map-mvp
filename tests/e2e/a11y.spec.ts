import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";

const ROUTES = ["/", "/cafe/cafe-morrow", "/cafe/cafe-morrow/plan", "/cafe/cafe-morrow/review", "/plans/p_seed_1", "/my", "/favorites", "/compare", "/recommend"];

for (const route of ROUTES) {
  test(`접근성 위반 없음 (serious·critical): ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .exclude("[data-mirae-history-nav]") // 공용 스크립트가 붙이는 외부 위젯
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
  });
}

/* 열린 상태(시트·선택)도 같은 기준으로 검사한다 */
const STATES: { name: string; route: string; open: (page: import("@playwright/test").Page) => Promise<void> }[] = [
  { name: "필터 시트", route: "/", open: async (p) => p.getByRole("button", { name: /^필터/ }).first().click() },
  { name: "적합도 계산 기준", route: "/", open: async (p) => p.getByRole("button", { name: /계산 기준/ }).click() },
  { name: "마커 선택", route: "/", open: async (p) => p.locator("[data-cafe-marker]").first().click() },
  { name: "비교할 카페 고르기", route: "/compare", open: async (p) => p.getByRole("button", { name: "카페 고르기" }).click() },
];

for (const s of STATES) {
  test(`접근성 위반 없음 (열린 상태): ${s.name}`, async ({ page }) => {
    await page.goto(s.route);
    await page.waitForLoadState("networkidle");
    await s.open(page);
    await page.waitForTimeout(300);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .exclude("[data-mirae-history-nav]")
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
  });
}
