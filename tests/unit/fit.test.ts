import { describe, expect, it } from "vitest";
import { CAFES, CAFE_MAP } from "@/lib/data/cafes";
import { calmestHour, fitScore, PURPOSE_WEIGHTS, PURPOSES, rankByFit } from "@/lib/fit";
import { isOpenAt } from "@/lib/scoring";
import { DATA_HOURS } from "@/lib/time";

describe("적합도 엔진 (규칙 기반)", () => {
  it("목적별 가중치는 합이 1", () => {
    for (const p of PURPOSES) {
      const sum = Object.values(PURPOSE_WEIGHTS[p.key]).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
    }
  });

  it("모든 카페·목적·시간에서 0~100 정수, 같은 입력엔 같은 값", () => {
    for (const cafe of CAFES)
      for (const p of PURPOSES)
        for (const h of DATA_HOURS) {
          const s = fitScore(cafe, p.key, h);
          expect(Number.isInteger(s)).toBe(true);
          expect(s).toBeGreaterThanOrEqual(0);
          expect(s).toBeLessThanOrEqual(100);
          expect(fitScore(cafe, p.key, h)).toBe(s);
        }
  });

  it("목적이 바뀌면 순위 기준도 바뀐다", () => {
    const focus = rankByFit(CAFES, "focus", 14).map((r) => r.cafe.id);
    const meeting = rankByFit(CAFES, "meeting", 14).map((r) => r.cafe.id);
    expect(focus).not.toEqual(meeting);
  });

  it("영업 중인 곳이 항상 앞, 그 안에서는 점수 내림차순", () => {
    const ranked = rankByFit(CAFES, "focus", 9);
    const firstClosed = ranked.findIndex((r) => !r.open);
    if (firstClosed >= 0) expect(ranked.slice(firstClosed).every((r) => !r.open)).toBe(true);
    const open = ranked.filter((r) => r.open);
    for (let i = 1; i < open.length; i++) expect(open[i - 1].score).toBeGreaterThanOrEqual(open[i].score);
  });
});

describe("calmestHour — 실제로 쓸 수 있는 한산한 시간", () => {
  it("마감 2시간 전까지만 고른다", () => {
    for (const cafe of CAFES) {
      const h = calmestHour(cafe);
      expect(isOpenAt(cafe, h)).toBe(true);
      expect(h).toBeLessThanOrEqual(cafe.close - 2);
    }
  });
  it("기준 시간을 주면 그 이후에서 고른다", () => {
    const cafe = CAFE_MAP["cafe-morrow"];
    expect(calmestHour(cafe, 16)).toBeGreaterThanOrEqual(16);
  });
});
