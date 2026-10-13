import { describe, expect, it } from "vitest";
import { buildSeed } from "@/lib/data/seed";
import { CAFE_MAP } from "@/lib/data/cafes";
import { habitsFrom, personalNote, stayFor } from "@/lib/personal";
import { checkinSummary } from "@/lib/reviews";

const seed = buildSeed(new Date("2026-10-13T14:00:00+09:00"));
const prefs = { purpose: "focus" as const, priorities: [], stay: "short" as const };

describe("내 작업 패턴 — 실제 기록에서만 계산", () => {
  const h = habitsFrom(seed.plans, seed.reviews);

  it("샘플 계정: 성수 2회 · 집중 작업 · 평균 2시간 30분", () => {
    expect(h.visits).toBe(2);
    expect(h.topArea).toBe("seongsu");
    expect(h.topAreaCount).toBe(2);
    expect(h.topPurpose).toBe("focus");
    expect(h.avgStayMin).toBe(150);
  });

  it("만족한 체크인에서 좋았던 조건을 많이 나온 순으로", () => {
    expect(h.likes.slice(0, 2).sort()).toEqual(["outlet", "seat"]);
    expect(h.likes).toContain("quiet");
  });

  it("기록이 2건 이상이면 체류 시간을 기록에서, 아니면 선호 조건에서", () => {
    expect(stayFor(h, prefs)).toEqual({ minutes: 150, fromHistory: true });
    const one = habitsFrom(seed.plans.slice(0, 1), []);
    expect(stayFor(one, prefs)).toEqual({ minutes: 60, fromHistory: false });
  });

  it("취소한 계획은 패턴에 넣지 않는다", () => {
    const cancelled = seed.plans.map((p) => ({ ...p, status: "cancelled" as const }));
    expect(habitsFrom(cancelled, []).visits).toBe(0);
  });

  it("카드의 내 기록 한 줄", () => {
    expect(personalNote(CAFE_MAP["workroom-17"], h)).toBe("지난번 ★5");
    expect(personalNote(CAFE_MAP["slow-bean"], h)).toBe("자주 가는 지역");
    expect(personalNote(CAFE_MAP["monday-roast"], h)).toBeNull();
  });
});

describe("작업자 체크인 요약", () => {
  const cafe = CAFE_MAP["cafe-morrow"];
  it("비율은 0~100, 내 체크인 수가 반영된다", () => {
    const none = checkinSummary(cafe, []);
    const mine = checkinSummary(cafe, seed.reviews);
    expect(mine.mine).toBe(1);
    expect(mine.count).toBe(none.count + 1);
    for (const s of mine.stats) {
      expect(s.percent).toBeGreaterThanOrEqual(0);
      expect(s.percent).toBeLessThanOrEqual(100);
    }
  });
  it("내가 '조용했어요'라고 답하면 조용함 비율이 오른다", () => {
    const base = checkinSummary(cafe, []).stats.find((s) => s.key === "quiet")!.percent;
    const quiet = { ...seed.reviews[1], id: "x", noise: "quiet" as const };
    const after = checkinSummary(cafe, [quiet, { ...quiet, id: "y" }, { ...quiet, id: "z" }]).stats.find((s) => s.key === "quiet")!.percent;
    expect(after).toBeGreaterThanOrEqual(base);
  });
});
