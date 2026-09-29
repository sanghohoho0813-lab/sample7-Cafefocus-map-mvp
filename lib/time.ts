import type { TimeSel } from "@/lib/types";

/** 시간대별 데이터가 존재하는 범위 */
export const FIRST_HOUR = 9;
export const LAST_HOUR = 21;
export const DATA_HOURS = Array.from(
  { length: LAST_HOUR - FIRST_HOUR + 1 },
  (_, i) => FIRST_HOUR + i
);

/** 마운트 전(SSR·정적 HTML)에 쓰는 고정 기준 시각. hydration 불일치를 막는다. */
const SSR_HOUR = 15;

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** 현재 시각이 데이터 범위(9~21시) 안에 있는지 */
export function isLiveHour(now: Date | null): boolean {
  if (!now) return false;
  const h = now.getHours();
  return h >= FIRST_HOUR && h <= LAST_HOUR;
}

/**
 * 화면 전체가 공유하는 기준 시(hour).
 * "now"인데 새벽·심야라면 가장 가까운 데이터 시간으로 보정한다.
 */
export function effectiveHour(sel: TimeSel, now: Date | null): number {
  if (sel !== "now") return sel;
  if (!now) return SSR_HOUR;
  const h = now.getHours();
  if (h < FIRST_HOUR) return FIRST_HOUR;
  if (h > LAST_HOUR) return LAST_HOUR;
  return h;
}

/** 기준 시간 선택 컨트롤에 보여줄 문구 */
export function timeSelLabel(sel: TimeSel, now: Date | null): string {
  if (sel !== "now") return `${sel}시 기준`;
  if (!now) return "지금";
  if (isLiveHour(now)) return `지금 ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  return now.getHours() < FIRST_HOUR ? "오전 9시 기준" : "밤 9시 기준";
}

/** 짧은 시간 표기: 14 → "14:00" */
export const hm = (h: number) => `${pad2(h)}:00`;

/* ---------------- 날짜 ---------------- */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 로컬 날짜 키 YYYY-MM-DD */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** "9월 29일 (화)" */
export function formatDate(key: string): string {
  const d = fromDateKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

/** 오늘·내일·어제는 상대 표기, 그 외는 날짜 */
export function relativeDate(key: string, today: Date | null): string {
  if (!today) return formatDate(key);
  const diff = Math.round(
    (fromDateKey(key).getTime() - fromDateKey(dateKey(today)).getTime()) / 86_400_000
  );
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  if (diff === -1) return "어제";
  return formatDate(key);
}

/** 후기용 방문 시간대 라벨: "평일 오후" */
export function visitLabel(key: string, hour: number): string {
  const day = fromDateKey(key).getDay();
  const weekday = day === 0 || day === 6 ? "주말" : "평일";
  const part = hour < 12 ? "오전" : hour < 18 ? "오후" : "저녁";
  return `${weekday} ${part}`;
}

/** 90 → "1시간 30분" */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** 작업 시간 구간 표기: 14시 + 120분 → "14:00–16:00" */
export function timeRange(startHour: number, durationMin: number): string {
  const endMin = startHour * 60 + durationMin;
  return `${hm(startHour)}–${pad2(Math.floor(endMin / 60))}:${pad2(endMin % 60)}`;
}
