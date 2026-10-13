import { describe, expect, it } from "vitest";
import { CAFES, CAFE_MAP } from "@/lib/data/cafes";
import { bestHour, decision, explainFit, fitScore } from "@/lib/fit";
import { hourlyAt, isOpenAt, levelOf } from "@/lib/scoring";
import { DATA_HOURS } from "@/lib/time";

const morrow = CAFE_MAP["cafe-morrow"]; // 08–22시

describe("explainFit — 점수와 근거가 같은 계산에서 나온다", () => {
  it("fitScore는 explainFit의 점수와 같다", () => {
    for (const c of CAFES) expect(fitScore(c, "focus", 14, 180)).toBe(explainFit(c, "focus", 14, { stayMin: 180 }).score);
  });

  it("항목은 목적 비중 순, 비중 0인 항목은 빠진다", () => {
    const ex = explainFit(morrow, "reading", 14);
    expect(ex.factors.map((f) => f.key)).not.toContain("wifiScore");
    for (let i = 1; i < ex.factors.length; i++) expect(ex.factors[i - 1].weight).toBeGreaterThanOrEqual(ex.factors[i].weight);
  });

  it("마감까지 머물 시간이 부족하면 감점하고 이유를 말한다", () => {
    const late = explainFit(morrow, "focus", 21, { stayMin: 180 });
    expect(late.stayAdjust).toBeLessThan(0);
    expect(late.cons[0]).toBe("22시 마감 · 1시간만 가능");
    expect(late.stayNote).toContain("22시 마감");
    expect(late.score).toBeLessThan(explainFit(morrow, "focus", 21, { stayMin: 60 }).score);
  });

  it("작업 도중 붐비기 시작하면 'N시 이후 혼잡 예상'을 알려준다", () => {
    let found = 0;
    for (const c of CAFES)
      for (const h of DATA_HOURS) {
        if (!isOpenAt(c, h) || levelOf(hourlyAt(c, h).crowd) === "busy") continue;
        const ex = explainFit(c, "focus", h, { stayMin: 180 });
        const msg = ex.cons.find((x) => x.endsWith("이후 혼잡 예상"));
        const later = [h + 1, h + 2].filter((x) => x < c.close && x <= 21).find((x) => levelOf(hourlyAt(c, x).crowd) === "busy");
        if (later !== undefined && c.close - h >= 3) {
          found++;
          expect(msg).toBe(`${later}시 이후 혼잡 예상`);
        }
      }
    expect(found).toBeGreaterThan(0); // 데모 데이터에 실제로 그런 경우가 있다
  });

  it("문장의 시간 표현을 바꿀 수 있다 (지금 / 15시)", () => {
    const ex = explainFit(CAFE_MAP["workroom-17"], "focus", 14, { timeWord: "지금" });
    expect(ex.pros.some((p) => p.startsWith("지금"))).toBe(true);
  });

  it("주의는 최대 2개", () => {
    for (const c of CAFES) for (const h of DATA_HOURS) expect(explainFit(c, "meeting", h, { stayMin: 240 }).cons.length).toBeLessThanOrEqual(2);
  });
});

describe("bestHour — 가장 추천하는 도착 시간", () => {
  it("fromHour 이후 영업 시간 중 점수가 가장 높은 때 (같으면 이른 시간)", () => {
    for (const c of CAFES) {
      const best = bestHour(c, "focus", 14, 120);
      if (!best) continue;
      expect(best.hour).toBeGreaterThanOrEqual(14);
      expect(isOpenAt(c, best.hour)).toBe(true);
      for (const h of DATA_HOURS.filter((x) => x >= 14 && isOpenAt(c, x))) {
        const s = fitScore(c, "focus", h, 120);
        expect(s).toBeLessThanOrEqual(best.score);
        if (s === best.score) expect(best.hour).toBeLessThanOrEqual(h);
      }
    }
  });
});

describe("decision — '그래서 갈 만한가?'", () => {
  it("영업 외면 영업 시간을 알려준다", () => {
    const ex = explainFit(morrow, "focus", 23);
    expect(decision(morrow, { ...ex, open: false }, 7).title).toBe("8시에 문을 열어요");
  });
  it("점수 구간에 따라 결론이 달라진다", () => {
    const ex = explainFit(morrow, "focus", 14);
    expect(decision(morrow, { ...ex, score: 90 }, 14, "지금").title).toBe("지금 가기 좋아요");
    expect(decision(morrow, { ...ex, score: 72 }, 14, "지금").tone).toBe("ok");
    expect(decision(morrow, { ...ex, score: 50 }, 14, "지금").tone).toBe("wait");
  });
});
