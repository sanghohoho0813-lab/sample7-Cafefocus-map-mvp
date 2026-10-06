import { describe, expect, it } from "vitest";
import {
  dateKey,
  dateWithRelative,
  effectiveHour,
  formatDuration,
  relativeDate,
  timeRange,
  timeSelLabel,
  visitLabel,
} from "@/lib/time";

const at = (iso: string) => new Date(iso);

describe("effectiveHour — 데이터가 있는 9~21시로 보정", () => {
  it("직접 고른 시간은 그대로", () => expect(effectiveHour(15, at("2026-10-06T03:00:00+09:00"))).toBe(15));
  it("새벽은 9시, 심야는 21시로", () => {
    expect(effectiveHour("now", at("2026-10-06T06:30:00+09:00"))).toBe(9);
    expect(effectiveHour("now", at("2026-10-06T23:30:00+09:00"))).toBe(21);
  });
  it("마운트 전(now=null)에는 SSR 고정값으로 hydration 불일치를 막는다", () => {
    expect(effectiveHour("now", null)).toBe(15);
  });
});

describe("timeSelLabel — 보정했다면 어느 시간 기준인지 밝힌다", () => {
  it("영업 시간 안이면 현재 시각", () => expect(timeSelLabel("now", at("2026-10-06T14:05:00+09:00"))).toBe("지금 14:05"));
  it("범위 밖이면 기준 시간 명시", () => {
    expect(timeSelLabel("now", at("2026-10-06T07:00:00+09:00"))).toBe("오전 9시 기준");
    expect(timeSelLabel("now", at("2026-10-06T23:00:00+09:00"))).toBe("밤 9시 기준");
  });
});

describe("날짜 표기", () => {
  const today = at("2026-10-06T14:00:00+09:00");
  it("dateKey는 로컬(서울) 날짜", () => expect(dateKey(at("2026-10-06T00:30:00+09:00"))).toBe("2026-10-06"));
  it("오늘·내일·어제는 상대 표기", () => {
    expect(relativeDate("2026-10-06", today)).toBe("오늘");
    expect(relativeDate("2026-10-07", today)).toBe("내일");
    expect(relativeDate("2026-10-05", today)).toBe("어제");
    expect(relativeDate("2026-10-04", today)).toBe("10월 4일 (일)");
  });
  it("상대 표기가 없으면 같은 날짜를 두 번 쓰지 않는다 (회귀 방지)", () => {
    expect(dateWithRelative("2026-10-04", today)).toBe("10월 4일 (일)");
    expect(dateWithRelative("2026-10-06", today)).toBe("오늘 · 10월 6일 (화)");
  });
  it("월말·연말 경계", () => {
    expect(relativeDate("2027-01-01", at("2026-12-31T22:00:00+09:00"))).toBe("내일");
  });
  it("방문 시간대 라벨", () => {
    expect(visitLabel("2026-10-04", 10)).toBe("주말 오전");
    expect(visitLabel("2026-10-06", 19)).toBe("평일 저녁");
  });
});

describe("시간 길이 표기", () => {
  it.each([
    [45, "45분"],
    [60, "1시간"],
    [150, "2시간 30분"],
  ])("%i분 → %s", (min, label) => expect(formatDuration(min)).toBe(label));
  it("구간", () => expect(timeRange(14, 150)).toBe("14:00–16:30"));
});
