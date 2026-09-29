import type { Cafe, Plan, PlanInput } from "@/lib/types";
import { dateKey, FIRST_HOUR, LAST_HOUR } from "@/lib/time";

export const DURATION_OPTIONS = [60, 120, 180, 240];

/** 이 카페에서 계획을 시작할 수 있는 시(hour) 목록 */
export function startHoursFor(cafe: Cafe): number[] {
  const from = Math.max(cafe.open, FIRST_HOUR);
  const to = Math.min(cafe.close - 1, LAST_HOUR);
  const out: number[] = [];
  for (let h = from; h <= to; h++) out.push(h);
  return out;
}

/** 오늘이면 지난 시간은 고를 수 없다 (현재 시각이 속한 시는 허용) */
export function isPastSlot(date: string, hour: number, now: Date | null): boolean {
  if (!now || date !== dateKey(now)) return false;
  return hour < now.getHours();
}

/** 시작 시각 기준으로 마감 전까지 가능한 최대 작업 시간(분) */
export function maxDurationFor(cafe: Cafe, startHour: number): number {
  return Math.max(0, (cafe.close - startHour) * 60);
}

function overlaps(a: { startHour: number; durationMin: number }, b: { startHour: number; durationMin: number }) {
  const aS = a.startHour * 60;
  const bS = b.startHour * 60;
  return aS < bS + b.durationMin && bS < aS + a.durationMin;
}

/** 같은 날 겹치는 예정 계획 */
export function findConflict(input: PlanInput, plans: Plan[]): Plan | null {
  return (
    plans.find(
      (p) => p.status === "planned" && p.date === input.date && overlaps(p, input)
    ) ?? null
  );
}

/**
 * 저장 전 최종 검증. 문제가 없으면 null.
 * 폼의 실시간 안내와 저장 시 가드가 같은 규칙을 쓴다.
 */
export function validatePlan(
  input: PlanInput,
  cafe: Cafe,
  plans: Plan[],
  now: Date | null,
  cafeName: (id: string) => string
): string | null {
  if (!startHoursFor(cafe).includes(input.startHour)) return "영업 시간 안에서 시작 시간을 골라주세요.";
  if (isPastSlot(input.date, input.startHour, now)) return "이미 지난 시간이에요. 다른 시간을 골라주세요.";
  if (input.durationMin > maxDurationFor(cafe, input.startHour)) {
    return `${cafe.close === 24 ? "자정" : `${cafe.close}시`} 마감 전까지 작업 시간을 줄여주세요.`;
  }
  if (input.memo.length > 60) return "메모는 60자 이내로 적어주세요.";
  const conflict = findConflict(input, plans);
  if (conflict) return `같은 시간에 ${cafeName(conflict.cafeId)} 작업 계획이 이미 있어요.`;
  return null;
}

/** 예정 계획 중 가장 가까운 것 (지난 날짜는 제외) */
export function nextPlan(plans: Plan[], now: Date | null): Plan | null {
  const today = now ? dateKey(now) : null;
  const upcoming = plans
    .filter((p) => p.status === "planned" && (!today || p.date >= today))
    .sort((a, b) => (a.date === b.date ? a.startHour - b.startHour : a.date < b.date ? -1 : 1));
  return upcoming[0] ?? null;
}

export function sortPlans(plans: Plan[], dir: "asc" | "desc" = "asc"): Plan[] {
  const s = [...plans].sort((a, b) =>
    a.date === b.date ? a.startHour - b.startHour : a.date < b.date ? -1 : 1
  );
  return dir === "asc" ? s : s.reverse();
}

/** 최근 7일(오늘 포함) 완료한 작업 시간(분) */
export function weeklyMinutes(plans: Plan[], now: Date | null): number {
  if (!now) return 0;
  const from = new Date(now);
  from.setDate(from.getDate() - 6);
  const fromKey = dateKey(from);
  const toKey = dateKey(now);
  return plans
    .filter((p) => p.status === "completed" && p.date >= fromKey && p.date <= toKey)
    .reduce((sum, p) => sum + p.durationMin, 0);
}
