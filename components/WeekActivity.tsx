import type { Plan } from "@/lib/types";
import { addDays, dateKey, formatDuration } from "@/lib/time";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 최근 7일 작업 막대 — 며칠에 얼마나 작업했는지 한눈에.
 * 마친 작업은 채운 막대, 아직 체크인하지 않은 계획은 점선 막대로 구분한다 (같은 날이면 위에 쌓는다).
 */
export default function WeekActivity({ plans, now }: { plans: Plan[]; now: Date | null }) {
  if (!now) return null;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(now, i - 6);
    const key = dateKey(d);
    const onDay = plans.filter((p) => p.date === key && p.status !== "cancelled");
    return {
      key,
      label: i === 6 ? "오늘" : WEEKDAY[d.getDay()],
      dateText: `${d.getMonth() + 1}월 ${d.getDate()}일`,
      done: onDay.filter((p) => p.status === "completed").reduce((s, p) => s + p.durationMin, 0),
      planned: onDay.filter((p) => p.status === "planned").reduce((s, p) => s + p.durationMin, 0),
      today: i === 6,
    };
  });
  const max = Math.max(180, ...days.map((d) => d.done + d.planned));
  const workedDays = days.filter((d) => d.done > 0).length;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-label text-coffee-600">최근 7일</p>
        <p className="text-caption text-coffee-400">
          <span className="num font-semibold text-coffee-700">{workedDays}일</span> 작업했어요
        </p>
      </div>
      <ol className="mt-3 grid h-[104px] grid-cols-7 items-end gap-2" aria-label="최근 7일 날짜별 작업 시간">
        {days.map((d) => {
          const total = d.done + d.planned;
          return (
            <li key={d.key} className="flex h-full flex-col items-center justify-end gap-1.5">
              <div className="flex w-full max-w-[30px] flex-1 flex-col justify-end" aria-hidden>
                {total > 0 && (
                  <span className={`num mb-1 block text-center text-[11px] font-semibold ${d.today ? "text-coffee-900" : "text-coffee-500"}`}>
                    {(total / 60).toFixed(total % 60 ? 1 : 0)}h
                  </span>
                )}
                {d.planned > 0 && (
                  <span
                    className="block w-full rounded-t-md border-2 border-dashed border-coffee-300 bg-white"
                    style={{ height: `${(d.planned / max) * 80}%`, borderBottomWidth: d.done ? 0 : undefined }}
                  />
                )}
                {d.done > 0 && (
                  <span
                    className={`block w-full ${d.planned ? "" : "rounded-t-md"} ${d.today ? "bg-coffee-800" : "bg-coffee-300"}`}
                    style={{ height: `${(d.done / max) * 80}%` }}
                  />
                )}
                {total === 0 && <span className="block h-1.5 w-full rounded-full bg-cream-200" />}
              </div>
              <span className={`text-caption ${d.today ? "font-bold text-coffee-900" : "text-coffee-400"}`} aria-hidden>
                {d.label}
              </span>
              <span className="sr-only">
                {d.dateText} {d.done ? `${formatDuration(d.done)} 작업` : "작업 없음"}
                {d.planned ? `, ${formatDuration(d.planned)} 예정` : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2.5 flex items-center gap-3 text-caption text-coffee-400" aria-hidden>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-coffee-300" />
          마친 작업
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border-2 border-dashed border-coffee-300" />
          예정
        </span>
      </p>
    </div>
  );
}
