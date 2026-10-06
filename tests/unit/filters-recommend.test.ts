import { describe, expect, it } from "vitest";
import { CAFES } from "@/lib/data/cafes";
import { applyFilters, matchesFilter } from "@/lib/filters";
import { recommend } from "@/lib/recommendation";
import { isOpenAt } from "@/lib/scoring";

describe("필터", () => {
  it("빈 필터는 전체", () => expect(applyFilters(CAFES, [], 14)).toHaveLength(CAFES.length));
  it("여러 필터는 모두 만족(AND)", () => {
    const both = applyFilters(CAFES, ["quiet", "outlet"], 14);
    expect(both.every((c) => matchesFilter(c, "quiet", 14) && matchesFilter(c, "outlet", 14))).toBe(true);
    expect(both.length).toBeLessThanOrEqual(applyFilters(CAFES, ["quiet"], 14).length);
  });
  it("'한산한 곳'은 시간에 따라 결과가 달라진다", () => {
    const counts = new Set([10, 13, 19].map((h) => applyFilters(CAFES, ["calmNow"], h).length));
    expect(counts.size).toBeGreaterThan(1);
  });
});

describe("맞춤 추천", () => {
  const base = { purpose: "focus" as const, priorities: [], stay: "medium" as const, hour: 14 };
  it("그 시간에 영업 중인 곳만, 요청한 개수만큼", () => {
    const r = recommend({ ...base, hour: 21 }, 5);
    expect(r).toHaveLength(5);
    expect(r.every((x) => isOpenAt(x.cafe, 21))).toBe(true);
  });
  it("점수 내림차순 · 0~100", () => {
    const r = recommend(base, 10);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score);
    expect(r.every((x) => x.score >= 0 && x.score <= 100)).toBe(true);
  });
  it("'역에서 가까움'을 고르면 상위 결과의 평균 거리가 줄어든다", () => {
    const avg = (xs: { cafe: { stationDistanceM: number } }[]) => xs.reduce((s, x) => s + x.cafe.stationDistanceM, 0) / xs.length;
    expect(avg(recommend({ ...base, priorities: ["access"] }, 5))).toBeLessThanOrEqual(avg(recommend(base, 5)));
  });
});
