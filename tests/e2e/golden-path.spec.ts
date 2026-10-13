import { test, expect } from "./fixtures";

test("지도에서 카페를 골라 작업 계획 → 새로고침 → 체크인까지 끝낸다", async ({ page, consoleErrors, isMobile }) => {
  await page.goto("/");
  const markers = page.locator("[data-cafe-marker]");
  await expect(markers).toHaveCount(22);
  // 첫 화면은 "지금 어디로 가면 좋은가?"에 바로 답한다
  await expect(page.getByRole("heading", { name: "지금 집중 작업하기 좋은 곳" }).first()).toBeVisible();

  // 1) 지도에서 고르기
  const first = markers.first();
  const cafeId = (await first.getAttribute("data-cafe-marker"))!;
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  if (isMobile) await page.locator(`section [data-cafe-card="${cafeId}"] a`).click();
  else await page.getByRole("dialog", { name: /미리보기/ }).getByRole("link", { name: "자세히 보기" }).click();
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
  await page.getByRole("link", { name: /작업을 마쳤다면 체크인하기/ }).click();
  const submit = page.locator("button[type=submit]");
  await expect(submit).toBeDisabled();
  await page.getByRole("radio", { name: "5점" }).click();
  await page.getByRole("radiogroup", { name: "소음" }).getByRole("radio", { name: "조용함" }).click();
  await page.getByRole("radiogroup", { name: "콘센트" }).getByRole("radio", { name: "넉넉함" }).click();
  await page.getByRole("radiogroup", { name: "Wi-Fi" }).getByRole("radio", { name: "빠름" }).click();
  await expect(submit).toBeDisabled(); // 좌석까지 답해야 저장
  await page.getByRole("radiogroup", { name: "좌석·테이블" }).getByRole("radio", { name: "편함", exact: true }).click();
  await submit.click();
  await expect(page.getByRole("heading", { name: "작업을 마쳤어요" })).toBeVisible();

  // 5) 내 작업 통계에 반영 (샘플 2회 + 방금 1회)
  await page.goto("/my");
  await expect(page.locator("dl").first()).toContainText("3회");

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

test("상세는 결론부터 — 이유·주의·시간대 비교·체크인 요약 순서", async ({ page }) => {
  await page.goto("/cafe/cafe-morrow");
  const decisionBox = page.locator("[data-decision]:visible");
  await expect(decisionBox.getByText(/가기 좋아요|갈 만해요|추천하지 않아요|문을 열어요|영업이 끝났어요/)).toBeVisible();
  // 결론이 매장 소개보다 먼저 나온다
  const order = await page.evaluate(() => {
    const y = (sel: string) => [...document.querySelectorAll(sel)].find((e) => (e as HTMLElement).offsetParent)?.getBoundingClientRect().top ?? 1e9;
    const h2 = (t: string) => [...document.querySelectorAll("h2")].find((e) => e.textContent === t)?.getBoundingClientRect().top ?? 1e9;
    return { decision: y("[data-decision]"), time: h2("언제 가면 좋을까"), checkin: h2("작업자 체크인"), info: h2("상세 정보") };
  });
  expect(order.time).toBeLessThan(order.checkin);
  expect(order.checkin).toBeLessThan(order.info);
  // 점수 근거를 펼칠 수 있다
  await page.getByRole("button", { name: /점인가요/ }).first().click();
  await expect(page.getByText("목적별 비중 × 항목 점수").first()).toBeVisible();
});

test("계획을 만들면 지도에 '다음 작업'으로 바로 보이고, 누르면 그 카페로 간다", async ({ page }) => {
  await page.goto("/cafe/slow-bean/plan?hour=17");
  await page.locator("button[type=submit]:visible").first().click();
  await expect(page.getByRole("heading", { name: "작업 계획을 저장했어요" })).toBeVisible();
  await page.getByRole("link", { name: "지도에서 보기" }).click();
  const marker = page.locator('[data-cafe-marker="slow-bean"]');
  await expect(marker).toHaveAttribute("aria-pressed", "true");
  await expect(marker).toHaveAttribute("aria-label", /작업 예정/);
  await expect(page.getByRole("button", { name: /다음 작업: .*Slow Bean/ })).toBeVisible();
});
