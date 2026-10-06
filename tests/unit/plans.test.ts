import { describe, expect, it } from "vitest";
import type { Plan, PlanInput } from "@/lib/types";
import { CAFE_MAP } from "@/lib/data/cafes";
import { findConflict, isPastSlot, maxDurationFor, nextPlan, startHoursFor, validatePlan, weeklyMinutes } from "@/lib/plans";

const morrow = CAFE_MAP["cafe-morrow"]; // 08:00–22:00
const now = new Date("2026-10-06T14:10:00+09:00");
const name = (id: string) => CAFE_MAP[id]?.name ?? id;

const plan = (over: Partial<Plan> = {}): Plan => ({
  id: "p1",
  cafeId: "workroom-17",
  date: "2026-10-06",
  startHour: 16,
  durationMin: 120,
  purpose: "focus",
  memo: "",
  status: "planned",
  createdAt: "2026-10-06T05:00:00.000Z",
  ...over,
});
const input = (over: Partial<PlanInput> = {}): PlanInput => ({
  cafeId: "cafe-morrow",
  date: "2026-10-06",
  startHour: 18,
  durationMin: 120,
  purpose: "focus",
  memo: "",
  ...over,
});

describe("시작 가능 시간", () => {
  it("영업 시간과 데이터 범위(9~21시)의 교집합", () => {
    expect(startHoursFor(morrow)).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
  });
  it("지난 시간은 오늘만 막고, 현재 시각이 속한 시는 허용", () => {
    expect(isPastSlot("2026-10-06", 13, now)).toBe(true);
    expect(isPastSlot("2026-10-06", 14, now)).toBe(false);
    expect(isPastSlot("2026-10-07", 9, now)).toBe(false);
  });
  it("마감 전까지만 머물 수 있다", () => expect(maxDurationFor(morrow, 20)).toBe(120));
});

describe("겹침 판단", () => {
  const existing = [plan()]; // 16:00–18:00
  it("시간이 겹치면 충돌", () => expect(findConflict(input({ startHour: 17 }), existing)?.id).toBe("p1"));
  it("앞뒤로 붙어 있는 것은 충돌이 아니다", () => {
    expect(findConflict(input({ startHour: 18 }), existing)).toBeNull();
    expect(findConflict(input({ startHour: 14, durationMin: 120 }), existing)).toBeNull();
  });
  it("길게 잡아 뒤 일정을 덮으면 충돌", () => {
    expect(findConflict(input({ startHour: 15, durationMin: 180 }), existing)?.id).toBe("p1");
  });
  it("완료·취소된 계획이나 다른 날은 무시", () => {
    expect(findConflict(input({ startHour: 16 }), [plan({ status: "cancelled" })])).toBeNull();
    expect(findConflict(input({ startHour: 16, date: "2026-10-07" }), existing)).toBeNull();
  });
});

describe("validatePlan — 폼 안내와 저장 가드가 같은 규칙을 쓴다", () => {
  it("정상 입력은 통과", () => expect(validatePlan(input(), morrow, [], now, name)).toBeNull());
  it("영업 시간 밖", () => expect(validatePlan(input({ startHour: 22 }), morrow, [], now, name)).toMatch(/영업 시간/));
  it("지난 시간", () => expect(validatePlan(input({ startHour: 10 }), morrow, [], now, name)).toMatch(/지난 시간/));
  it("마감 초과", () =>
    expect(validatePlan(input({ startHour: 20, durationMin: 180 }), morrow, [], now, name)).toBe("22시 마감 전까지 작업 시간을 줄여주세요."));
  it("메모 60자 초과", () => expect(validatePlan(input({ memo: "가".repeat(61) }), morrow, [], now, name)).toMatch(/60자/));
  it("겹치는 계획은 카페 이름과 함께 안내", () =>
    expect(validatePlan(input({ startHour: 17 }), morrow, [plan()], now, name)).toContain("Workroom 17"));
});

describe("집계", () => {
  it("다음 작업은 지난 날짜를 건너뛴 가장 이른 예정", () => {
    const plans = [plan({ id: "old", date: "2026-10-01" }), plan({ id: "late", startHour: 19 }), plan({ id: "soon", startHour: 15 })];
    expect(nextPlan(plans, now)?.id).toBe("soon");
  });
  it("최근 7일 완료 시간만 합산", () => {
    const plans = [
      plan({ status: "completed", date: "2026-09-30", durationMin: 120 }),
      plan({ status: "completed", date: "2026-09-29", durationMin: 999 }), // 8일 전
      plan({ status: "planned", durationMin: 999 }),
    ];
    expect(weeklyMinutes(plans, now)).toBe(120);
  });
});
