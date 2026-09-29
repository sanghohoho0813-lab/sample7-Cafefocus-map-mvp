import type { Cafe, FilterKey } from "@/lib/types";
import { hourlyAt } from "@/lib/scoring";

/**
 * 첫 화면에는 핵심 필터 3개만, 나머지는 '필터' 시트로 보낸다.
 * (미팅 여부는 필터가 아니라 '목적'으로 고른다)
 */
export const ESSENTIAL_FILTERS: FilterKey[] = ["quiet", "outlet", "calmNow"];
export const MORE_FILTERS: FilterKey[] = ["wifi", "bigTable", "longStay", "lateNight"];

export const FILTER_LABEL: Record<FilterKey, string> = {
  quiet: "조용한 곳",
  outlet: "콘센트 많음",
  calmNow: "한산한 곳",
  wifi: "Wi-Fi 빠름",
  bigTable: "넓은 테이블",
  longStay: "오래 있기 좋음",
  lateNight: "밤늦게까지",
};

export const FILTER_HINT: Record<FilterKey, string> = {
  quiet: "평소 소음이 낮은 곳",
  outlet: "대부분 좌석에서 충전 가능",
  calmNow: "선택한 시간대에 자리 여유",
  wifi: "80Mbps 이상, 화상회의 가능",
  bigTable: "노트북과 자료를 함께 펼칠 수 있는 테이블",
  longStay: "평균 체류 2시간 이상, 눈치 보지 않는 분위기",
  lateNight: "밤 11시 이후까지 영업",
};

export function matchesFilter(cafe: Cafe, key: FilterKey, hour: number): boolean {
  switch (key) {
    case "quiet":
      return cafe.metrics.noiseScore >= 78;
    case "outlet":
      return cafe.metrics.outletScore >= 76;
    case "wifi":
      return cafe.metrics.wifiScore >= 80;
    case "bigTable":
      return cafe.amenities.bigTable;
    case "longStay":
      return cafe.metrics.stayScore >= 78 && cafe.avgStayMinutes >= 120;
    case "lateNight":
      return cafe.close >= 23;
    case "calmNow":
      return hourlyAt(cafe, hour).crowd < 45;
  }
}

export function applyFilters(cafes: Cafe[], active: FilterKey[], hour: number): Cafe[] {
  if (!active.length) return cafes;
  return cafes.filter((c) => active.every((k) => matchesFilter(c, k, hour)));
}
