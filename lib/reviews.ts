import type { Cafe, NoiseFeel, OutletFeel, SeatFeel, UserReview, WifiFeel } from "@/lib/types";
import { PURPOSE_LABEL } from "@/lib/fit";
import { formatDuration } from "@/lib/time";

export const NOISE_FEEL: { key: NoiseFeel; label: string; tag: string }[] = [
  { key: "quiet", label: "조용함", tag: "조용했어요" },
  { key: "normal", label: "보통", tag: "소음 보통" },
  { key: "loud", label: "시끄러움", tag: "시끄러웠어요" },
];

export const OUTLET_FEEL: { key: OutletFeel; label: string; tag: string }[] = [
  { key: "easy", label: "넉넉함", tag: "콘센트 여유" },
  { key: "some", label: "몇 자리만", tag: "콘센트 조금" },
  { key: "none", label: "없음", tag: "콘센트 없음" },
];

export const WIFI_FEEL: { key: WifiFeel; label: string; tag: string }[] = [
  { key: "fast", label: "빠름", tag: "Wi-Fi 빠름" },
  { key: "ok", label: "쓸 만함", tag: "Wi-Fi 보통" },
  { key: "slow", label: "느림", tag: "Wi-Fi 느림" },
];

export const SEAT_FEEL: { key: SeatFeel; label: string; tag: string }[] = [
  { key: "comfy", label: "편함", tag: "좌석 편함" },
  { key: "ok", label: "보통", tag: "좌석 보통" },
  { key: "tight", label: "불편함", tag: "좌석 불편" },
];

const tagOf = <K extends string>(list: { key: K; tag: string }[], key: K) =>
  list.find((x) => x.key === key)?.tag ?? "";

export interface DisplayReview {
  id: string;
  author: string;
  mine: boolean;
  rating: number;
  meta: string;
  text: string;
  tags: string[];
}

/** 내가 남긴 후기를 맨 앞에, 그다음 기존 방문자 후기 */
export function reviewsForCafe(cafe: Cafe, mine: UserReview[]): DisplayReview[] {
  const own: DisplayReview[] = mine
    .filter((r) => r.cafeId === cafe.id)
    .map((r) => ({
      id: r.id,
      author: "나",
      mine: true,
      rating: r.rating,
      meta: `${r.visitLabel} · ${PURPOSE_LABEL[r.purpose]} · ${formatDuration(r.stayMinutes)}`,
      text: r.text,
      tags: reviewSummaryTags(r),
    }));
  const others: DisplayReview[] = cafe.reviews.map((r) => ({
    id: r.id,
    author: r.author,
    mine: false,
    rating: r.rating,
    meta: `${r.visitTime} · ${r.purpose} · ${formatDuration(r.stayMinutes)}`,
    text: r.text,
    tags: r.tags,
  }));
  return [...own, ...others];
}

export function reviewSummaryTags(r: UserReview): string[] {
  return [
    tagOf(NOISE_FEEL, r.noise),
    tagOf(OUTLET_FEEL, r.outlet),
    tagOf(WIFI_FEEL, r.wifi),
    ...(r.seat ? [tagOf(SEAT_FEEL, r.seat)] : []),
  ].filter(Boolean);
}

/* ---------------- 작업자 체크인 요약 ----------------
 * 일반 리뷰(맛·친절)가 아니라 "작업 환경이 실제로 어땠는지"를 비율로 보여준다.
 * 데모 기준값은 카페 지표에서 결정적으로 만들고(가짜 무작위 없음), 내 체크인을 더해 갱신한다.
 */
export interface CheckinStat {
  key: "quiet" | "outlet" | "wifi" | "seat";
  label: string;
  /** 긍정 응답 비율 (0~100) */
  percent: number;
}

export interface CheckinSummary {
  count: number;
  mine: number;
  /** 작업 만족도 평균 (1~5) */
  satisfaction: number;
  stats: CheckinStat[];
}

export function checkinSummary(cafe: Cafe, mine: UserReview[]): CheckinSummary {
  const own = mine.filter((r) => r.cafeId === cafe.id);
  const base = Math.max(12, Math.round(cafe.reviewCount * 0.3));
  const m = cafe.metrics;
  const pct = (v: number) => Math.max(5, Math.min(97, Math.round(v * 1.05 - 8)));
  const demo: Record<CheckinStat["key"], number> = {
    quiet: pct(m.noiseScore),
    outlet: pct(m.outletScore),
    wifi: pct(m.wifiScore),
    seat: pct(m.seatScore),
  };
  const positive: Record<CheckinStat["key"], (r: UserReview) => boolean | null> = {
    quiet: (r) => r.noise === "quiet",
    outlet: (r) => r.outlet === "easy",
    wifi: (r) => r.wifi === "fast",
    seat: (r) => (r.seat ? r.seat === "comfy" : null),
  };
  const merge = (key: CheckinStat["key"]) => {
    const answers = own.map(positive[key]).filter((v): v is boolean => v !== null);
    const yes = answers.filter(Boolean).length;
    return Math.round((demo[key] * base + yes * 100) / (base + answers.length));
  };
  const satisfaction = (cafe.rating * base + own.reduce((s, r) => s + r.rating, 0)) / (base + own.length);
  return {
    count: base + own.length,
    mine: own.length,
    satisfaction: Math.round(satisfaction * 10) / 10,
    stats: [
      { key: "quiet", label: "조용했어요", percent: merge("quiet") },
      { key: "outlet", label: "콘센트를 쉽게 찾았어요", percent: merge("outlet") },
      { key: "wifi", label: "Wi-Fi가 빨랐어요", percent: merge("wifi") },
      { key: "seat", label: "좌석이 편했어요", percent: merge("seat") },
    ],
  };
}
