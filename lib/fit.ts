import type { Cafe, CafeMetrics, Purpose } from "@/lib/types";
import { hourlyAt, isOpenAt, levelOf, type LevelKey } from "@/lib/scoring";

/**
 * 적합도 엔진 (규칙 기반).
 *
 * "지금 이 시간에, 이 목적으로 일하기 좋은가?"에 답한다.
 * 카페의 고정 환경 지표에 해당 시간대의 소음·혼잡 예측을 섞고,
 * 목적별 가중치로 0~100점을 계산한다. 난수 없이 항상 같은 결과가 나온다.
 */

export const PURPOSES: { key: Purpose; label: string; short: string; desc: string }[] = [
  { key: "focus", label: "집중 작업", short: "집중", desc: "몰입해서 끝내야 하는 일" },
  { key: "study", label: "공부", short: "공부", desc: "시험·자격증·강의 수강" },
  { key: "meeting", label: "미팅", short: "미팅", desc: "1~2시간 대화형 업무" },
  { key: "light", label: "가벼운 작업", short: "가벼운 작업", desc: "메일·문서 정리 정도" },
  { key: "reading", label: "독서", short: "독서", desc: "조용히 책 읽는 시간" },
];

export const PURPOSE_LABEL: Record<Purpose, string> = Object.fromEntries(
  PURPOSES.map((p) => [p.key, p.label])
) as Record<Purpose, string>;

/** 목적별 가중치 (합계 1.0) */
export const PURPOSE_WEIGHTS: Record<Purpose, Record<keyof CafeMetrics, number>> = {
  focus: { noiseScore: 0.3, wifiScore: 0.18, outletScore: 0.2, seatScore: 0.12, crowdScore: 0.12, stayScore: 0.08 },
  study: { noiseScore: 0.32, wifiScore: 0.08, outletScore: 0.2, seatScore: 0.1, crowdScore: 0.14, stayScore: 0.16 },
  meeting: { noiseScore: 0.22, wifiScore: 0.1, outletScore: 0.05, seatScore: 0.3, crowdScore: 0.2, stayScore: 0.13 },
  light: { noiseScore: 0.15, wifiScore: 0.3, outletScore: 0.15, seatScore: 0.15, crowdScore: 0.15, stayScore: 0.1 },
  reading: { noiseScore: 0.42, wifiScore: 0, outletScore: 0.05, seatScore: 0.25, crowdScore: 0.18, stayScore: 0.1 },
};

/** 시간대 예측을 반영한 유효 지표 */
export function effectiveMetrics(cafe: Cafe, hour: number): CafeMetrics {
  const p = hourlyAt(cafe, hour);
  return {
    ...cafe.metrics,
    noiseScore: Math.round(cafe.metrics.noiseScore * 0.5 + (100 - p.noise) * 0.5),
    crowdScore: Math.round(cafe.metrics.crowdScore * 0.4 + (100 - p.crowd) * 0.6),
  };
}

export function weighted(
  metrics: CafeMetrics,
  weights: Record<keyof CafeMetrics, number>
): number {
  let total = 0;
  let wsum = 0;
  (Object.keys(weights) as (keyof CafeMetrics)[]).forEach((k) => {
    total += metrics[k] * weights[k];
    wsum += weights[k];
  });
  return wsum ? Math.round(total / wsum) : 0;
}

/** 목적·시간 기준 적합도 (0~100) */
export function fitScore(cafe: Cafe, purpose: Purpose, hour: number): number {
  return weighted(effectiveMetrics(cafe, hour), PURPOSE_WEIGHTS[purpose]);
}

export interface FitResult {
  cafe: Cafe;
  score: number;
  open: boolean;
}

/** 영업 중인 곳을 적합도순으로, 영업 외 카페는 뒤로 */
export function rankByFit(cafes: Cafe[], purpose: Purpose, hour: number): FitResult[] {
  return cafes
    .map((cafe) => ({ cafe, score: fitScore(cafe, purpose, hour), open: isOpenAt(cafe, hour) }))
    .sort((a, b) => {
      if (a.open !== b.open) return a.open ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      return a.cafe.stationDistanceM - b.cafe.stationDistanceM;
    });
}

/* ---------------- 결과 설명: 결론 → 이유 → 주의 ---------------- */

export function crowdLevel(cafe: Cafe, hour: number): LevelKey {
  return levelOf(hourlyAt(cafe, hour).crowd);
}

export function noiseLevel(cafe: Cafe, hour: number): LevelKey {
  return levelOf(hourlyAt(cafe, hour).noise);
}

/** 한 줄 결론 */
export function verdict(cafe: Cafe, hour: number): string {
  if (!isOpenAt(cafe, hour)) {
    return hour < cafe.open ? `${cafe.open}시에 문을 열어요` : "이 시간엔 영업이 끝났어요";
  }
  const crowd = crowdLevel(cafe, hour);
  const noise = noiseLevel(cafe, hour);
  if (crowd === "quiet" && noise === "quiet") return "조용하고 한산한 시간이에요";
  if (crowd === "busy" || noise === "busy") return "붐비는 시간이라 집중이 어려울 수 있어요";
  if (crowd === "quiet") return "자리는 여유 있고 소음은 보통이에요";
  if (noise === "quiet") return "조용한 편이지만 자리는 적당히 차 있어요";
  return "무난하게 작업할 수 있는 시간이에요";
}

interface Reason {
  text: string;
  metric: keyof CafeMetrics;
}

/** 목적 가중치 순으로 정렬된 추천 이유 (최대 3개) */
export function fitReasons(cafe: Cafe, purpose: Purpose, hour: number, max = 3): string[] {
  const m = cafe.metrics;
  const out: Reason[] = [];
  if (isOpenAt(cafe, hour)) {
    if (crowdLevel(cafe, hour) === "quiet") out.push({ text: `${hour}시 한산`, metric: "crowdScore" });
    if (noiseLevel(cafe, hour) === "quiet") out.push({ text: "조용한 시간대", metric: "noiseScore" });
  }
  if (m.outletScore >= 80) out.push({ text: "콘센트 넉넉", metric: "outletScore" });
  if (m.wifiScore >= 85) out.push({ text: `Wi-Fi ${cafe.wifiMbps}Mbps`, metric: "wifiScore" });
  if (m.seatScore >= 82) out.push({ text: "좌석이 편해요", metric: "seatScore" });
  if (m.stayScore >= 85) out.push({ text: "오래 있어도 편함", metric: "stayScore" });
  if (m.noiseScore >= 85 && !out.some((r) => r.metric === "noiseScore"))
    out.push({ text: "평소 조용한 곳", metric: "noiseScore" });

  const w = PURPOSE_WEIGHTS[purpose];
  return out
    .sort((a, b) => w[b.metric] - w[a.metric])
    .slice(0, max)
    .map((r) => r.text);
}

/** 가기 전 알아둘 점 (없으면 null) */
export function fitCaution(cafe: Cafe, hour: number): string | null {
  if (!isOpenAt(cafe, hour)) return null;
  if (crowdLevel(cafe, hour) === "busy") return `${hour}시엔 붐비는 편이에요`;
  const next = hourlyAt(cafe, hour + 1);
  if (hour + 1 < cafe.close && levelOf(next.crowd) === "busy") return `${hour + 1}시부터 붐비기 시작해요`;
  if (cafe.close - hour <= 2) return `${cafe.close === 24 ? "자정" : `${cafe.close}시`}에 문을 닫아요`;
  return null;
}

/** 가장 한산한 시간 (영업 시간 안에서) */
/**
 * 가장 한산한 시간.
 * 문 닫기 직전은 쓸모가 없으니 최소 2시간 머물 수 있는 시간만 보고,
 * fromHour가 있으면 그 이후(오늘 남은 시간) 중에서 고른다. 같으면 이른 시간.
 */
export function calmestHour(cafe: Cafe, fromHour?: number): number {
  const lastStart = cafe.close - 2;
  const pick = (from: number) => {
    let best: { hour: number; crowd: number } | null = null;
    for (const p of cafe.hourly) {
      if (p.hour < from || p.hour > lastStart || !isOpenAt(cafe, p.hour)) continue;
      if (!best || p.crowd < best.crowd) best = p;
    }
    return best;
  };
  return (pick(fromHour ?? 0) ?? pick(0) ?? cafe.hourly.find((p) => isOpenAt(cafe, p.hour)) ?? cafe.hourly[0]).hour;
}
