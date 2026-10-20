import { test, expect } from "./fixtures";

test("검색에서 역을 고르면 그 지역 지도로 바뀌고 검색이 닫힌다", async ({ page, consoleErrors }) => {
  await page.goto("/");
  const input = page.getByLabel("지역·역·카페 검색");
  await input.fill("성수역");
  await page.getByRole("option", { name: /성수역/ }).click();
  await expect(page.getByLabel("지역", { exact: true })).toHaveValue("seongsu");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test("검색에서 카페를 고르면 그 카페가 지도에서 선택된다", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("지역·역·카페 검색").fill("Slow");
  await page.getByRole("option", { name: /Slow Bean/ }).click();
  await expect(page.locator('[data-cafe-marker="slow-bean"]')).toHaveAttribute("aria-pressed", "true");
});

test("상세의 섹션 바로가기로 체크인 요약까지 한 번에 이동한다", async ({ page, isMobile }) => {
  await page.goto("/cafe/cafe-morrow");
  // 모바일은 사진이 지나간 뒤에 작은 머리글과 바로가기가 나타난다
  if (isMobile) await page.locator("main .overflow-y-auto").first().evaluate((el) => el.scrollTo(0, 700));
  const nav = page.getByRole("navigation", { name: "상세 섹션 바로가기" });
  await nav.getByRole("button", { name: "체크인" }).click();
  await expect(page.getByRole("heading", { name: "작업자 체크인" })).toBeInViewport();
  await expect(nav.getByRole("button", { name: "체크인" })).toHaveAttribute("aria-current", "true");
});
