import { test, expect } from "./fixtures";

test("지도에서 카페를 골라 작업 계획 → 새로고침 → 체크인까지 끝낸다", async ({ page, consoleErrors, isMobile }) => {
  await page.goto("/");
  const markers = page.locator("[data-cafe-marker]");
  await expect(markers).toHaveCount(22);

  // 1) 지도에서 고르기
  const first = markers.first();
  const cafeId = (await first.getAttribute("data-cafe-marker"))!;
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  if (isMobile) await page.locator(`section [data-cafe-card="${cafeId}"] a`).click();
  else await page.getByRole("link", { name: /자세히 보기/ }).click();
  await expect(page).toHaveURL(new RegExp(`/cafe/${cafeId}$`));

  // 2) 결론 → 계획
  await page.getByRole("link", { name: /에 여기서 작업하기/ }).last().click();
  await expect(page).toHaveURL(new RegExp(`/cafe/${cafeId}/plan\\?hour=14`));
  const save = page.locator("button[type=submit]:visible").first();
  await expect(save).toBeEnabled();
  await save.dblclick(); // 더블클릭해도 하나만
  await expect(page.getByRole("heading", { name: "작업 계획을 저장했어요" })).toBeVisible();

  // 3) 새로고침해도 유지, 중복 없음
  await page.reload();
  await expect(page.getByText("작업 일정").first()).toBeVisible();
  const planned = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("cf:v2:plans") ?? "[]").filter((p: { status: string }) => p.status === "planned")
  );
  expect(planned).toHaveLength(1);

  // 4) 다녀와서 체크인 → 완료
  await page.getByRole("link", { name: /작업을 마쳤다면 기록하기/ }).click();
  const submit = page.locator("button[type=submit]");
  await expect(submit).toBeDisabled();
  await page.getByRole("radio", { name: "5점" }).click();
  await page.getByRole("radiogroup", { name: "소음" }).getByRole("radio", { name: "조용함" }).click();
  await page.getByRole("radiogroup", { name: "콘센트" }).getByRole("radio", { name: "넉넉함" }).click();
  await page.getByRole("radiogroup", { name: "Wi-Fi" }).getByRole("radio", { name: "빠름" }).click();
  await submit.click();
  await expect(page.getByRole("heading", { name: "작업을 마쳤어요" })).toBeVisible();

  // 5) 내 작업 통계에 반영 (샘플 1회 + 방금 1회)
  await page.goto("/my");
  await expect(page.locator("dl").first()).toContainText("2회");

  expect(consoleErrors).toEqual([]);
});

test("이미 잡힌 시간은 '일정 있음'으로 막히고, 길게 겹치면 이유를 알려준다", async ({ page }) => {
  await page.goto("/cafe/workroom-17/plan?hour=16");
  await page.locator("button[type=submit]:visible").first().click();
  await expect(page.getByRole("heading", { name: "작업 계획을 저장했어요" })).toBeVisible();

  await page.goto("/cafe/cafe-morrow/plan?hour=16");
  const taken = page.getByRole("button", { name: /^16시, 이미 일정 있음/ });
  await expect(taken).toBeDisabled();
  await page.getByRole("button", { name: /^15시, 예상/ }).click();
  await page.getByRole("button", { name: "3시간" }).click();
  await expect(page.getByText(/일정과 겹쳐요|이미 있어요/).first()).toBeVisible();
  await expect(page.locator("button[type=submit]:visible").first()).toBeDisabled();
});
