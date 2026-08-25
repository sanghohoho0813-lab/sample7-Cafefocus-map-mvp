import type {
  Cafe,
  CafeMetrics,
  Purpose,
  PriorityKey,
  StayLength,
} from "@/lib/types";
import { CAFES } from "@/lib/data/cafes";
import { workScore } from "@/lib/scoring";

export const PURPOSES: { key: Purpose; label: string; desc: string; emoji: string }[] = [
  { key: "focus", label: "집중 작업", desc: "몰입해서 끝내야 하는 일", emoji: "💻" },
  { key: "study", label: "공부", desc: "시험·자격증·강의 수강", emoji: "📚" },
  { key: "meeting", label: "미팅", desc: "1~2시간 대화형 업무", emoji: "🤝" },
  { key: "light", label: "가벼운 노트북", desc: "메일·문서 정리 정도", emoji: "☕" },
  { key: "reading", label: "독서", desc: "조용히 책 읽는 시간", emoji: "📖" },
];

export const PRIORITIES: { key: PriorityKey; label: string }[] = [
  { key: "quiet", label: "조용함" },
  { key: "outlet", label: "콘센트" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "seat", label: "넓은 좌석" },
  { key: "access", label: "접근성" },
];

export const STAY_OPTIONS: { key: StayLength; label: string }[] = [
  { key: "short", label: "1시간 이하" },
  { key: "medium", label: "1~2시간" },
  { key: "long", label: "2시간 이상" },
];

/** 목적별 기본 가중치 (합계 1.0) */
const PURPOSE_WEIGHTS: Record<Purpose, Record<keyof CafeMetrics, number>> = {
  focus: { noiseScore: 0.35, wifiScore: 0.2, outletScore: 0.2, seatScore: 0.15, crowdScore: 0.1, stayScore: 0 },
  study: { noiseScore: 0.35, wifiScore: 0.1, outletScore: 0.2, seatScore: 0.1, crowdScore: 0.1, stayScore: 0.15 },
  meeting: { noiseScore: 0.25, wifiScore: 0.1, outletScore: 0.05, seatScore: 0.3, crowdScore: 0.15, stayScore: 0.15 },
  light: { noiseScore: 0.15, wifiScore: 0.3, outletScore: 0.15, seatScore: 0.15, crowdScore: 0.15, stayScore: 0.1 },
  reading: { noiseScore: 0.45, wifiScore: 0, outletScore: 0.05, seatScore: 0.25, crowdScore: 0.15, stayScore: 0.1 },
};

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
}

export interface RecommendResult {
  cafe: Cafe;
  score: number;
  reasons: string[];
}

export function recommend(input: RecommendInput, limit = 3): RecommendResult[] {
  const weights: Record<keyof CafeMetrics, number> = {
    ...PURPOSE_WEIGHTS[input.purpose],
  };
  for (const p of input.priorities) {
    const boost = PRIORITY_BOOST[p];
    (Object.keys(boost) as (keyof CafeMetrics)[]).forEach((k) => {
      weights[k] += boost[k] ?? 0;
    });
  }

  const results = CAFES.map((cafe) => {
    let score = workScore(cafe.metrics, weights);

    // 체류시간 보정
    if (input.stay === "long") {
      score += Math.round((cafe.metrics.stayScore - 70) / 8);
      if (cafe.avgStayMinutes >= 150) score += 2;
    }
    if (input.stay === "short" && cafe.stationDistanceM <= 300) score += 2;

    // 접근성 우선 시 역까지 거리 보정
    if (input.priorities.includes("access")) {
      score += Math.round((500 - Math.min(cafe.stationDistanceM, 700)) / 100);
    }

    score = Math.max(0, Math.min(100, score));

    const reasons: string[] = [];
    if (cafe.metrics.noiseScore >= 82) reasons.push("조용한 편이에요");
    if (cafe.metrics.outletScore >= 82) reasons.push("콘센트가 넉넉해요");
    if (cafe.metrics.wifiScore >= 85) reasons.push(`Wi-Fi ${cafe.wifiMbps}Mbps`);
    if (cafe.metrics.seatScore >= 82) reasons.push("좌석이 편해요");
    if (input.stay === "long" && cafe.metrics.stayScore >= 85)
      reasons.push("장시간 체류 부담 없음");
    if (cafe.stationDistanceM <= 250) reasons.push(`${cafe.station} ${cafe.stationDistanceM}m`);

    return { cafe, score, reasons: reasons.slice(0, 3) };
  });

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
