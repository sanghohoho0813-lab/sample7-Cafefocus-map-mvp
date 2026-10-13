import type { AreaKey, Cafe, Plan, Prefs, Purpose, UserReview } from "@/lib/types";
import { CAFE_MAP } from "@/lib/data/cafes";
import { STAY_MINUTES } from "@/lib/fit";

/**
 * 내 작업 패턴.
 * 사용자가 실제로 남긴 기록(작업 계획·체크인)만으로 계산한다 — 추측하거나 숨겨서 바꾸지 않는다.
 * 지도·추천은 여기서 "보통 머무는 시간"을 가져와 점수에 쓰고, 화면에 그 사실을 밝힌다.
 */
export type LikeKey = "quiet" | "outlet" | "wifi" | "seat";

export interface Habits {
  /** 취소하지 않은 작업 수 */
  visits: number;
  topArea: AreaKey | null;
  topAreaCount: number;
  topPurpose: Purpose | null;
  /** 30분 단위로 반올림한 평균 작업 시간 */
  avgStayMin: number | null;
  /** 만족(★4 이상)한 체크인에서 좋았다고 답한 조건 — 많이 나온 순 */
  likes: LikeKey[];
  /** 카페별 가장 최근 별점 */
  ratedCafes: Record<string, number>;
}

/** 이만큼 기록이 쌓여야 "보통 머무는 시간"을 기록에서 가져온다 */
export const HABIT_MIN_VISITS = 2;

function top<K extends string>(counts: Map<K, number>): [K, number] | null {
  let best: [K, number] | null = null;
  for (const [k, n] of counts) if (!best || n > best[1]) best = [k, n];
  return best;
}

export function habitsFrom(plans: Plan[], reviews: UserReview[]): Habits {
  const kept = plans.filter((p) => p.status !== "cancelled" && CAFE_MAP[p.cafeId]);
  const areas = new Map<AreaKey, number>();
  const purposes = new Map<Purpose, number>();
  for (const p of kept) {
    const a = CAFE_MAP[p.cafeId].area;
    areas.set(a, (areas.get(a) ?? 0) + 1);
    purposes.set(p.purpose, (purposes.get(p.purpose) ?? 0) + 1);
  }
  const area = top(areas);
  const purpose = top(purposes);
  const avg = kept.length ? kept.reduce((s, p) => s + p.durationMin, 0) / kept.length : null;

  const likeCount = new Map<LikeKey, number>();
  const ratedCafes: Record<string, number> = {};
  // 최신 기록이 우선하도록 오래된 것부터 덮어쓴다
  for (const r of [...reviews].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    ratedCafes[r.cafeId] = r.rating;
    if (r.rating < 4) continue;
    const add = (k: LikeKey) => likeCount.set(k, (likeCount.get(k) ?? 0) + 1);
    if (r.noise === "quiet") add("quiet");
    if (r.outlet === "easy") add("outlet");
    if (r.wifi === "fast") add("wifi");
    if (r.seat === "comfy") add("seat");
  }

  return {
    visits: kept.length,
    topArea: area?.[0] ?? null,
    topAreaCount: area?.[1] ?? 0,
    topPurpose: purpose?.[0] ?? null,
    avgStayMin: avg === null ? null : Math.min(240, Math.max(60, Math.round(avg / 30) * 30)),
    likes: [...likeCount.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k),
    ratedCafes,
  };
}

/** 점수 계산에 쓸 체류 시간 — 기록이 충분하면 기록, 아니면 선호 조건 */
export function stayFor(habits: Habits, prefs: Prefs): { minutes: number; fromHistory: boolean } {
  if (habits.visits >= HABIT_MIN_VISITS && habits.avgStayMin) return { minutes: habits.avgStayMin, fromHistory: true };
  return { minutes: STAY_MINUTES[prefs.stay], fromHistory: false };
}

export const LIKE_LABEL: Record<LikeKey, string> = {
  quiet: "조용함",
  outlet: "콘센트",
  wifi: "Wi-Fi",
  seat: "편한 좌석",
};

/** 카드에 붙이는 내 기록 한 줄 (없으면 null) */
export function personalNote(cafe: Cafe, habits: Habits): string | null {
  const rated = habits.ratedCafes[cafe.id];
  if (rated) return `지난번 ★${rated}`;
  if (habits.topArea === cafe.area && habits.topAreaCount >= HABIT_MIN_VISITS) return "자주 가는 지역";
  return null;
}
