import type { Cafe, FilterKey } from "@/lib/types";
import { hourlyAt } from "@/lib/scoring";

export const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "quiet", label: "조용한 곳" },
  { key: "outlet", label: "콘센트 많음" },
  { key: "wifi", label: "Wi-Fi 좋음" },
  { key: "bigTable", label: "넓은 테이블" },
  { key: "longStay", label: "오래 있기 좋음" },
  { key: "meeting", label: "미팅하기 좋음" },
  { key: "lateNight", label: "늦게까지" },
  { key: "calmNow", label: "현재 한산함" },
];

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
    case "meeting":
      return cafe.metrics.seatScore >= 70 && cafe.metrics.wifiScore >= 72;
    case "lateNight":
      return cafe.close >= 23;
    case "calmNow":
      return hourlyAt(cafe, hour).crowd < 45;
  }
}

export function applyFilters(
  cafes: Cafe[],
  active: FilterKey[],
  hour: number
): Cafe[] {
  if (!active.length) return cafes;
  return cafes.filter((c) => active.every((k) => matchesFilter(c, k, hour)));
}
