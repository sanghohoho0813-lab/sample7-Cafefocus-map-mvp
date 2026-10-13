import type { Cafe, CafeMetrics, Purpose, StayLength } from "@/lib/types";
import { hourlyAt, isOpenAt, levelOf, type LevelKey } from "@/lib/scoring";
import { FIRST_HOUR, LAST_HOUR, formatDuration } from "@/lib/time";

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

/** 머무는 시간 선택지 → 분 */
export const STAY_MINUTES: Record<StayLength, number> = { short: 60, medium: 120, long: 180 };

/** 기본 체류 시간 — 별도 정보가 없을 때 */
export const DEFAULT_STAY_MIN = 120;

/** 머무는 동안 지나는 시간들 (도착 시간 포함, 영업·데이터 범위 안에서) */
function stayWindow(cafe: Cafe, hour: number, stayMin: number): number[] {
  const n = Math.max(1, Math.ceil(stayMin / 60));
  const out: number[] = [];
  for (let h = hour; h < hour + n; h++) {
    if (h > LAST_HOUR || !isOpenAt(cafe, h)) break;
    out.push(h);
  }
  return out.length ? out : [hour];
}

/**
 * 시간대 예측을 반영한 유효 지표.
 * 소음·혼잡은 "도착 시간"만이 아니라 머무는 동안의 예측을 함께 본다 (도착 시간은 두 배 가중).
 * 그래야 "15시 이후 붐빔"처럼 작업 도중의 변화가 점수에 들어간다.
 */
export function effectiveMetrics(cafe: Cafe, hour: number, stayMin = 60): CafeMetrics {
  const win = stayWindow(cafe, hour, stayMin);
  let noise = 0;
  let crowd = 0;
  let w = 0;
  win.forEach((h, i) => {
    const k = i === 0 ? 2 : 1;
    const p = hourlyAt(cafe, h);
    noise += p.noise * k;
    crowd += p.crowd * k;
    w += k;
  });
  return {
    ...cafe.metrics,
    noiseScore: Math.round(cafe.metrics.noiseScore * 0.5 + (100 - noise / w) * 0.5),
    crowdScore: Math.round(cafe.metrics.crowdScore * 0.4 + (100 - crowd / w) * 0.6),
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

/* ---------------- 점수와 그 근거 ---------------- */

export const FACTOR_LABEL: Record<keyof CafeMetrics, string> = {
  noiseScore: "조용함",
  crowdScore: "자리 여유",
  outletScore: "콘센트",
  wifiScore: "Wi-Fi",
  seatScore: "좌석·테이블",
  stayScore: "오래 머물기",
};

export interface FitFactor {
  key: keyof CafeMetrics;
  label: string;
  /** 목적별 비중 (0~1) */
  weight: number;
  /** 시간대를 반영한 항목 점수 (0~100) */
  value: number;
}

export interface FitExplanation {
  /** 최종 적합도 (0~100) */
  score: number;
  /** 항목 가중합 */
  base: number;
  /** 체류 시간 보정 (마감까지 부족하면 감점, 장시간에 편한 곳은 가점) */
  stayAdjust: number;
  /** 보정 이유 — 화면의 "왜 이 점수?"에 그대로 쓴다 */
  stayNote: string | null;
  open: boolean;
  /** 비중 큰 순 */
  factors: FitFactor[];
  /** 지금 조건에서 좋은 점 (목적에서 중요한 순) */
  pros: string[];
  /** 가기 전 알아둘 점 (심각한 순) */
  cons: string[];
}

export interface FitOptions {
  /** 머물 시간(분) — 마감·작업 중 혼잡 변화 판단에 쓴다 */
  stayMin?: number;
  /** 시간 표현: "지금" 또는 "15시" (문장에 그대로 들어간다) */
  timeWord?: string;
}

const closeWord = (close: number) => (close >= 24 ? "자정" : `${close}시`);

/**
 * 적합도와 그 근거를 한 번에 계산한다.
 * 점수·이유·주의가 같은 계산에서 나오므로 화면마다 설명이 어긋나지 않는다.
 */
export function explainFit(cafe: Cafe, purpose: Purpose, hour: number, opts: FitOptions = {}): FitExplanation {
  const stayMin = opts.stayMin ?? DEFAULT_STAY_MIN;
  const tw = opts.timeWord ?? `${hour}시`;
  const weights = PURPOSE_WEIGHTS[purpose];
  const eff = effectiveMetrics(cafe, hour, stayMin);
  const base = weighted(eff, weights);
  const open = isOpenAt(cafe, hour);
  const m = cafe.metrics;

  // ---- 체류 보정 ----
  const need = stayMin / 60;
  const hoursLeft = Math.max(0, cafe.close - hour);
  let stayAdjust = 0;
  let stayNote: string | null = null;
  if (open && hoursLeft < need) {
    stayAdjust -= Math.min(20, Math.round((need - hoursLeft) * 8));
    stayNote = `${closeWord(cafe.close)} 마감이라 ${formatDuration(hoursLeft * 60)}만 머물 수 있어요`;
  } else if (stayMin >= 180) {
    stayAdjust += Math.round((m.stayScore - 75) / 8);
    stayNote = `${formatDuration(stayMin)} 이상 머물기 ${m.stayScore >= 75 ? "편한" : "부담스러운"} 곳이에요`;
  }
  const score = Math.max(0, Math.min(100, base + stayAdjust));

  const factors: FitFactor[] = (Object.keys(weights) as (keyof CafeMetrics)[])
    .filter((k) => weights[k] > 0)
    .map((k) => ({ key: k, label: FACTOR_LABEL[k], weight: weights[k], value: eff[k] }))
    .sort((a, b) => b.weight - a.weight);

  // ---- 좋은 점: 지금 조건(시간·체류)에 맞춘 문장 ----
  const pros: { text: string; w: number }[] = [];
  if (open) {
    const win = stayWindow(cafe, hour, stayMin);
    const calmAll = win.every((h) => levelOf(hourlyAt(cafe, h).noise) === "quiet");
    if (calmAll) pros.push({ text: `${tw} 조용한 편`, w: weights.noiseScore });
    else if (m.noiseScore >= 85) pros.push({ text: "평소 조용한 곳", w: weights.noiseScore * 0.8 });
    if (levelOf(hourlyAt(cafe, hour).crowd) === "quiet") pros.push({ text: `${tw} 자리 여유`, w: weights.crowdScore });
    if (stayMin >= 120 && hoursLeft >= need && m.stayScore >= 78)
      pros.push({ text: `${formatDuration(stayMin)} 이상 작업에 적합`, w: weights.stayScore + (stayMin >= 180 ? 0.12 : 0.04) });
  }
  if (m.outletScore >= 80) pros.push({ text: "콘센트 충분", w: weights.outletScore });
  if (m.wifiScore >= 85) pros.push({ text: `Wi-Fi ${cafe.wifiMbps}Mbps`, w: weights.wifiScore });
  if (m.seatScore >= 82) pros.push({ text: "좌석·테이블 넉넉", w: weights.seatScore });

  // ---- 주의: 작업 도중 바뀌는 것까지 ----
  const cons: string[] = [];
  if (open) {
    if (hoursLeft < need) cons.push(`${closeWord(cafe.close)} 마감 · ${formatDuration(hoursLeft * 60)}만 가능`);
    const arrival = levelOf(hourlyAt(cafe, hour).crowd);
    if (arrival === "busy") cons.push(`${tw} 붐비는 편`);
    else {
      const last = Math.min(hour + Math.ceil(need) - 1, cafe.close - 1, LAST_HOUR);
      for (let h = hour + 1; h <= last; h++) {
        if (levelOf(hourlyAt(cafe, h).crowd) === "busy") {
          cons.push(`${h}시 이후 혼잡 예상`);
          break;
        }
      }
    }
    if (levelOf(hourlyAt(cafe, hour).noise) === "busy" && weights.noiseScore >= 0.2) cons.push(`${tw} 시끄러운 편`);
  }
  if (weights.outletScore >= 0.15 && m.outletScore < 60) cons.push("콘센트 적은 편");
  if (weights.wifiScore >= 0.15 && m.wifiScore < 60) cons.push("Wi-Fi 느린 편");
  if (weights.seatScore >= 0.2 && m.seatScore < 60) cons.push("좌석이 좁은 편");

  return {
    score,
    base,
    stayAdjust,
    stayNote,
    open,
    factors,
    pros: pros.sort((a, b) => b.w - a.w).map((p) => p.text),
    cons: cons.slice(0, 2),
  };
}

/** 목적·시간(·체류) 기준 적합도 (0~100) */
export function fitScore(cafe: Cafe, purpose: Purpose, hour: number, stayMin = DEFAULT_STAY_MIN): number {
  return explainFit(cafe, purpose, hour, { stayMin }).score;
}

export interface FitResult {
  cafe: Cafe;
  score: number;
  open: boolean;
}

/** 영업 중인 곳을 적합도순으로, 영업 외 카페는 뒤로 */
export function rankByFit(cafes: Cafe[], purpose: Purpose, hour: number, stayMin = DEFAULT_STAY_MIN): FitResult[] {
  return cafes
    .map((cafe) => ({ cafe, score: fitScore(cafe, purpose, hour, stayMin), open: isOpenAt(cafe, hour) }))
    .sort((a, b) => {
      if (a.open !== b.open) return a.open ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      return a.cafe.stationDistanceM - b.cafe.stationDistanceM;
    });
}

/**
 * 이 카페에서 가장 추천하는 도착 시간.
 * fromHour 이후(오늘 남은 시간)에서, 머물 시간을 채울 수 있는 시간 중 적합도가 가장 높은 때. 같으면 이른 시간.
 */
export function bestHour(
  cafe: Cafe,
  purpose: Purpose,
  fromHour: number = FIRST_HOUR,
  stayMin = DEFAULT_STAY_MIN
): { hour: number; score: number } | null {
  let best: { hour: number; score: number } | null = null;
  for (let h = Math.max(fromHour, FIRST_HOUR); h <= LAST_HOUR; h++) {
    if (!isOpenAt(cafe, h)) continue;
    const s = fitScore(cafe, purpose, h, stayMin);
    if (!best || s > best.score) best = { hour: h, score: s };
  }
  return best;
}

export type DecisionTone = "go" | "ok" | "wait" | "closed";

/**
 * "그래서 갈 만한가?"에 대한 한 문장.
 * 점수 구간과 주의점으로 정한다 — 화면 맨 위의 결론으로 쓴다.
 */
export function decision(cafe: Cafe, ex: FitExplanation, hour: number, timeWord = `${hour}시에`): { tone: DecisionTone; title: string } {
  if (!ex.open) {
    return { tone: "closed", title: hour < cafe.open ? `${cafe.open}시에 문을 열어요` : "이 시간엔 영업이 끝났어요" };
  }
  if (ex.score >= 80) return { tone: "go", title: `${timeWord} 가기 좋아요` };
  if (ex.score >= 68) return { tone: "ok", title: `${timeWord} 갈 만해요` };
  return { tone: "wait", title: `${timeWord}는 추천하지 않아요` };
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

/** 지금 조건에서 좋은 점 (목적에서 중요한 순, 최대 max개) — explainFit의 요약 */
export function fitReasons(cafe: Cafe, purpose: Purpose, hour: number, max = 3, opts: FitOptions = {}): string[] {
  return explainFit(cafe, purpose, hour, opts).pros.slice(0, max);
}

/** 가기 전 알아둘 점 하나 (없으면 null) — explainFit의 요약 */
export function fitCaution(cafe: Cafe, purpose: Purpose, hour: number, opts: FitOptions = {}): string | null {
  return explainFit(cafe, purpose, hour, opts).cons[0] ?? null;
}

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
