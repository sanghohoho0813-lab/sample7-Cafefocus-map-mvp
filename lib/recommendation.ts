import type { Cafe, CafeMetrics, PriorityKey, Purpose, StayLength } from "@/lib/types";
import { CAFES } from "@/lib/data/cafes";
import { isOpenAt } from "@/lib/scoring";
import { effectiveMetrics, fitReasons, PURPOSE_WEIGHTS, weighted } from "@/lib/fit";

export const PRIORITIES: { key: PriorityKey; label: string }[] = [
  { key: "quiet", label: "조용함" },
  { key: "outlet", label: "콘센트" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "seat", label: "넓은 좌석" },
  { key: "access", label: "역에서 가까움" },
];

export const STAY_OPTIONS: { key: StayLength; label: string; desc: string }[] = [
  { key: "short", label: "1시간 이하", desc: "잠깐 들러 처리할 일" },
  { key: "medium", label: "1~2시간", desc: "한 가지 일을 끝낼 정도" },
  { key: "long", label: "2시간 이상", desc: "반나절 머물 예정" },
];

const PRIORITY_BOOST: Record<PriorityKey, Partial<Record<keyof CafeMetrics, number>>> = {
  quiet: { noiseScore: 0.15 },
  outlet: { outletScore: 0.15 },
  wifi: { wifiScore: 0.15 },
  seat: { seatScore: 0.15 },
  access: {},
};

export interface RecommendInput {
  purpose: Purpose;
  priorities: PriorityKey[];
  stay: StayLength;
  hour: number;
}

export interface RecommendResult {
  cafe: Cafe;
  score: number;
  reasons: string[];
}

/**
 * 조건 기반 추천 (규칙 기반, AI 아님).
 * 지도와 같은 시간대 적합도 위에 우선순위·체류시간 보정을 더한다.
 */
export function recommend(input: RecommendInput, limit = 3): RecommendResult[] {
  const weights = { ...PURPOSE_WEIGHTS[input.purpose] };
  for (const p of input.priorities) {
    const boost = PRIORITY_BOOST[p];
    (Object.keys(boost) as (keyof CafeMetrics)[]).forEach((k) => {
      weights[k] += boost[k] ?? 0;
    });
  }

  return CAFES.filter((c) => isOpenAt(c, input.hour))
    .map((cafe) => {
      let score = weighted(effectiveMetrics(cafe, input.hour), weights);

      if (input.stay === "long") {
        score += Math.round((cafe.metrics.stayScore - 70) / 8);
        // 2시간 이상 머물려면 마감까지 여유가 있어야 한다
        if (cafe.close - input.hour < 3) score -= 6;
      }
      if (input.stay === "short" && cafe.stationDistanceM <= 300) score += 2;
      if (input.priorities.includes("access")) {
        score += Math.round((500 - Math.min(cafe.stationDistanceM, 700)) / 100);
      }

      score = Math.max(0, Math.min(100, score));

      const reasons = fitReasons(cafe, input.purpose, input.hour, 3);
      if (input.priorities.includes("access") && cafe.stationDistanceM <= 300 && reasons.length < 3) {
        reasons.push(`${cafe.station} ${cafe.stationDistanceM}m`);
      }
      return { cafe, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
