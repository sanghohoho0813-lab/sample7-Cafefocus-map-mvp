import { test, expect } from "./fixtures";

test("지도 조건은 주소에 남아 새로고침·공유해도 그대로", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("작업 목적").selectOption("study");
  await page.getByRole("button", { name: "조용한 곳" }).click();
  await expect(page).toHaveURL(/p=study/);
  await expect(page).toHaveURL(/f=quiet/);
  const count = await page.locator("[data-cafe-marker]").count();

  await page.reload();
  await expect(page.getByLabel("작업 목적")).toHaveValue("study");
  await expect(page.getByRole("button", { name: "조용한 곳" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-cafe-marker]")).toHaveCount(count);
});

test("딥링크로 지역·카페가 선택된 지도가 열린다", async ({ page }) => {
  await page.goto("/?area=seongsu&p=focus&t=10&f=&cafe=slow-bean");
  await expect(page.getByLabel("지역", { exact: true })).toHaveValue("seongsu");
  await expect(page.getByLabel("기준 시간")).toHaveValue("10");
  await expect(page.locator('[data-cafe-marker="slow-bean"]')).toHaveAttribute("aria-pressed", "true");
});

test("주소를 엉망으로 고쳐도 기본 화면으로 안전하게 열린다", async ({ page, consoleErrors }) => {
  await page.goto("/?area=mars&p=party&t=99&f=laser&cafe=nope");
  await expect(page.locator("[data-cafe-marker]")).toHaveCount(22);
  await expect(page.getByLabel("기준 시간")).toHaveValue("now");
  expect(consoleErrors).toEqual([]);
});

test("상세의 '지도에서 보기'는 그 카페를 고른 지도로 돌아온다", async ({ page }) => {
  await page.goto("/cafe/hanok-desk");
  await page.getByRole("link", { name: "지도에서 보기" }).click();
  await expect(page.locator('[data-cafe-marker="hanok-desk"]')).toHaveAttribute("aria-pressed", "true");
});
