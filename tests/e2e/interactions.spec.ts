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

test("목록을 가까운순으로 바꾸면 거리 순서대로, 추천순으로 돌아오면 대표 카드가 다시 보인다", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.locator("[data-sheet-handle]").click(); // 절반으로 펼쳐 목록 보기
  const scope = page.locator(isMobile ? "section[aria-label='카페 목록']" : "aside");
  await scope.getByRole("radio", { name: "가까운순" }).click();
  await expect(scope.getByRole("radio", { name: "가까운순" })).toHaveAttribute("aria-checked", "true");
  await expect(scope.locator("[data-pick]")).toHaveCount(0);
  // 카드에 표시된 거리(m/km)가 오름차순인지
  const meters = await scope.locator("[data-cafe-card] p.truncate").evaluateAll((els) =>
    els.slice(0, 5).map((e) => {
      const m = e.textContent!.match(/([\d.]+)\s*(km|m)/);
      return m ? Number(m[1]) * (m[2] === "km" ? 1000 : 1) : NaN;
    })
  );
  expect(meters).toEqual([...meters].sort((a, b) => a - b));
  await scope.getByRole("radio", { name: "추천순" }).click();
  await expect(scope.locator("[data-pick]")).toHaveCount(1);
});

test("가장 잘 맞는 곳 마커는 이름으로도 알 수 있다", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-cafe-marker][aria-label*="지금 가장 잘 맞는 곳"]')).toHaveCount(1);
});

test("비교: 2곳을 담으면 결론과 항목별 막대가 나오고, 빈 칸에서 더 담을 수 있다", async ({ page }) => {
  await page.goto("/compare");
  await page.getByRole("button", { name: "카페 고르기" }).click();
  const dlg = page.getByRole("dialog", { name: "비교할 카페 고르기" });
  await dlg.locator("li button").nth(0).click();
  await dlg.locator("li button").nth(1).click();
  await dlg.getByRole("button", { name: "2곳 비교하기" }).click();
  await expect(page.getByText("이 조건에서 가장 잘 맞아요")).toBeVisible();
  await expect(page.getByRole("region", { name: "소음" })).toBeVisible();
  await page.getByRole("button", { name: "카페 추가" }).click();
  await expect(page.getByRole("dialog", { name: "비교할 카페 고르기" })).toBeVisible();
});

test("체크인은 남은 항목 수를 위에서 바로 보여준다", async ({ page }) => {
  await page.goto("/cafe/workroom-17/review");
  await expect(page.getByText("0/5")).toBeVisible();
  await page.getByRole("radio", { name: "4점" }).click();
  await page.getByRole("radiogroup", { name: "소음" }).getByRole("radio", { name: "조용함" }).click();
  await expect(page.getByText("2/5")).toBeVisible();
});

test("링크 공유: 데스크톱은 링크를 복사하고 알려준다", async ({ page, isMobile, context }) => {
  test.skip(isMobile, "휴대폰은 기기 공유 창을 연다");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/cafe/cafe-morrow");
  await page.getByRole("button", { name: "링크 공유" }).click();
  await expect(page.getByText("링크를 복사했어요 · Cafe Morrow")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/cafe\/cafe-morrow$/);
});

test("없는 주소는 지도·추천·지역으로 바로 돌아갈 길을 준다", async ({ page }) => {
  await page.goto("/cafe/nope");
  await expect(page.getByRole("heading", { name: "찾으시는 페이지가 없어요" })).toBeVisible();
  await page.getByRole("navigation", { name: "지역으로 바로 가기" }).getByRole("link", { name: "성수" }).click();
  await expect(page.getByLabel("지역", { exact: true })).toHaveValue("seongsu");
});

test("내 작업에 최근 7일 막대가 보인다", async ({ page }) => {
  await page.goto("/my");
  await expect(page.getByRole("list", { name: "최근 7일 날짜별 작업 시간" }).getByRole("listitem")).toHaveCount(7);
});
