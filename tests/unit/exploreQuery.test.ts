import { describe, expect, it } from "vitest";
import { buildExploreQuery, parseExploreQuery } from "@/lib/exploreQuery";

describe("지도 상태 ↔ URL", () => {
  const state = { area: "seongsu" as const, purpose: "study" as const, time: 15, filters: ["outlet", "quiet"] as const, cafe: "workroom-17" };

  it("왕복해도 같은 상태", () => {
    const qs = buildExploreQuery({ ...state, filters: [...state.filters] });
    expect(qs).toBe("?area=seongsu&p=study&t=15&f=outlet,quiet&cafe=workroom-17");
    expect(parseExploreQuery(qs)).toEqual({ ...state, filters: ["outlet", "quiet"] });
  });

  it("기본값은 생략해 주소를 짧게", () => {
    expect(buildExploreQuery({ area: null, purpose: "focus", time: "now", filters: [], cafe: null })).toBe("?p=focus");
  });

  it("explicit이면 기본값도 적어 받는 쪽 상태를 확실히 덮어쓴다", () => {
    const qs = buildExploreQuery({ area: null, purpose: "focus", time: "now", filters: [], cafe: "slow-bean" }, { explicit: true });
    expect(parseExploreQuery(qs)).toEqual({ area: null, purpose: "focus", time: "now", filters: [], cafe: "slow-bean" });
  });

  it("손으로 고친 잘못된 값은 버린다", () => {
    expect(parseExploreQuery("?area=mars&p=party&t=30&f=quiet,laser,quiet&cafe=nope")).toEqual({
      area: null,
      time: "now",
      filters: ["quiet"],
      cafe: null,
    });
  });

  it("없는 키는 건드리지 않는다 (다른 화면에 다녀온 상태 유지)", () => {
    expect(parseExploreQuery("")).toEqual({});
  });
});
