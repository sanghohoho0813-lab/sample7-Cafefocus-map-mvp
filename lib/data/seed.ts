import type { Plan, UserReview } from "@/lib/types";
import { addDays, dateKey, visitLabel } from "@/lib/time";

/**
 * 샘플 계정 기록.
 * 처음 방문했거나 '데모 초기화'를 누르면 이 상태로 시작한다.
 * 날짜는 항상 오늘 기준 상대값이라 오래된 데모처럼 보이지 않는다.
 */
export function buildSeed(today: Date): { plans: Plan[]; reviews: UserReview[] } {
  const pastDate = dateKey(addDays(today, -2));
  const created = addDays(today, -3).toISOString();
  const completed = addDays(today, -2);
  completed.setHours(13, 10, 0, 0);

  const review: UserReview = {
    id: "r_seed_1",
    cafeId: "workroom-17",
    planId: "p_seed_1",
    createdAt: completed.toISOString(),
    visitLabel: visitLabel(pastDate, 10),
    purpose: "focus",
    stayMinutes: 180,
    rating: 5,
    noise: "quiet",
    outlet: "easy",
    wifi: "fast",
    text: "오전엔 도서관처럼 조용했어요. 창가 1인석은 콘센트가 바로 옆이라 반나절 작업하기 좋았습니다.",
  };

  const plan: Plan = {
    id: "p_seed_1",
    cafeId: "workroom-17",
    date: pastDate,
    startHour: 10,
    durationMin: 180,
    purpose: "focus",
    memo: "분기 보고서 초안",
    status: "completed",
    createdAt: created,
    completedAt: completed.toISOString(),
    reviewId: review.id,
  };

  return { plans: [plan], reviews: [review] };
}
