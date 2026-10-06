import { afterEach, describe, expect, it, vi } from "vitest";
import { isArray, isPlan, isPrefs, isReview, keepValid, read, write } from "@/lib/storage";
import { buildSeed } from "@/lib/data/seed";

describe("저장값 검증", () => {
  const seed = buildSeed(new Date("2026-10-06T14:00:00+09:00"));

  it("샘플 데이터는 검증을 통과한다", () => {
    expect(seed.plans.every(isPlan)).toBe(true);
    expect(seed.reviews.every(isReview)).toBe(true);
  });

  it("깨진 항목만 버리고 나머지는 살린다", () => {
    const raw: unknown[] = [...seed.plans, null, 3, { id: "x", cafeId: "nope", date: "2026-10-06" }, { ...seed.plans[0], purpose: "hack" }];
    expect(keepValid(raw, isPlan)).toEqual(seed.plans);
  });

  it("잘못된 선호값(점수 계산을 깨뜨릴 수 있는 목적)은 거부", () => {
    expect(isPrefs({ purpose: "focus", priorities: ["quiet"], stay: "long" })).toBe(true);
    expect(isPrefs({ purpose: "hack", priorities: [], stay: "long" })).toBe(false);
    expect(isPrefs({ purpose: "focus", priorities: ["laser"], stay: "long" })).toBe(false);
  });
});

describe("localStorage 접근", () => {
  afterEach(() => vi.unstubAllGlobals());

  const fakeStorage = (data: Record<string, string>) => ({
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  });

  it("JSON이 깨졌거나 형식이 다르면 기본값", () => {
    vi.stubGlobal("window", { localStorage: fakeStorage({ a: "{oops", b: '{"x":1}' }) });
    expect(read("a", isArray, [])).toEqual([]);
    expect(read("b", isArray, [])).toEqual([]);
    expect(read("missing", isArray, ["d"])).toEqual(["d"]);
  });

  it("저장소를 쓸 수 없는 환경(시크릿 모드 등)에서도 예외를 던지지 않는다", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("denied");
        },
        setItem: () => {
          throw new Error("quota");
        },
      },
    });
    expect(read("a", isArray, [])).toEqual([]);
    expect(() => write("a", [1])).not.toThrow();
  });
});
