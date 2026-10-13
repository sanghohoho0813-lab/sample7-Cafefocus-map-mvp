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
    seat: "comfy",
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

  // 두 번째 방문: 같은 동네, 오후 2시간 — 내 작업 패턴(자주 가는 지역·보통 머무는 시간)이 첫 화면부터 보이게
  const pastDate2 = dateKey(addDays(today, -5));
  const completed2 = addDays(today, -5);
  completed2.setHours(16, 20, 0, 0);
  const review2: UserReview = {
    id: "r_seed_2",
    cafeId: "cafe-morrow",
    planId: "p_seed_2",
    createdAt: completed2.toISOString(),
    visitLabel: visitLabel(pastDate2, 14),
    purpose: "focus",
    stayMinutes: 120,
    rating: 4,
    noise: "normal",
    outlet: "easy",
    wifi: "ok",
    seat: "comfy",
    text: "3시 넘어가니 조금 붐볐지만 창가 테이블은 넓고 콘센트가 가까웠어요.",
  };
  const plan2: Plan = {
    id: "p_seed_2",
    cafeId: "cafe-morrow",
    date: pastDate2,
    startHour: 14,
    durationMin: 120,
    purpose: "focus",
    memo: "제안서 수정",
    status: "completed",
    createdAt: addDays(today, -6).toISOString(),
    completedAt: completed2.toISOString(),
    reviewId: review2.id,
  };

  return { plans: [plan, plan2], reviews: [review, review2] };
}
