import type { Cafe, NoiseFeel, OutletFeel, UserReview, WifiFeel } from "@/lib/types";
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
      tags: [tagOf(NOISE_FEEL, r.noise), tagOf(OUTLET_FEEL, r.outlet), tagOf(WIFI_FEEL, r.wifi)],
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
  return [tagOf(NOISE_FEEL, r.noise), tagOf(OUTLET_FEEL, r.outlet), tagOf(WIFI_FEEL, r.wifi)];
}
