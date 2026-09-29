"use client";

import type { Cafe } from "@/lib/types";
import { isOpenAt, levelOf, NOISE_LABEL, CROWD_LABEL, type LevelKey } from "@/lib/scoring";

/* 단일 색상 농도로 붐빔 정도를 표현 (색 수를 늘리지 않는다) */
const BAR: Record<LevelKey, string> = {
  quiet: "bg-coffee-200",
  normal: "bg-coffee-300",
  busy: "bg-coffee-500",
};

/**
 * 시간대별 혼잡/소음 막대 그래프.
 * 막대를 누르면 그 시간을 기준으로 위쪽 결론이 다시 계산된다.
 */
export default function HourlyChart({
  cafe,
  metric,
  selectedHour,
  onSelect,
  height = 96,
}: {
  cafe: Cafe;
  metric: "noise" | "crowd";
  selectedHour: number;
  onSelect: (hour: number) => void;
  height?: number;
}) {
  const labelMap = metric === "noise" ? NOISE_LABEL : CROWD_LABEL;

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }} role="group" aria-label={`시간대별 ${metric === "noise" ? "소음" : "혼잡도"}`}>
        {cafe.hourly.map((p) => {
          const v = p[metric];
          const lv = levelOf(v);
          const open = isOpenAt(cafe, p.hour);
          const sel = p.hour === selectedHour;
          return (
            <button
              key={p.hour}
              type="button"
              onClick={() => onSelect(p.hour)}
              className="group flex h-full min-w-0 flex-1 items-end rounded-t focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coffee-600"
              aria-label={`${p.hour}시 ${open ? labelMap[lv] : "영업 외"}`}
              aria-pressed={sel}
            >
              <span
                className={`block w-full rounded-t-[4px] transition-colors duration-200 ${
                  sel ? "bg-coffee-900" : open ? `${BAR[lv]} group-hover:bg-coffee-400` : "bg-cream-300"
                }`}
                style={{ height: `${Math.max(v, 8)}%` }}
              />
            </button>
          );
        })}
      </div>
      {/* 축: 막대와 같은 격자에 3시간 간격 표기 */}
      <div className="mt-1.5 flex gap-1" aria-hidden>
        {cafe.hourly.map((p) => (
          <span
            key={p.hour}
            className={`num min-w-0 flex-1 text-center text-caption ${
              p.hour === selectedHour ? "font-bold text-coffee-900" : "text-coffee-400"
            }`}
          >
            {p.hour === selectedHour || p.hour % 3 === 0 ? p.hour : ""}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-coffee-500" aria-hidden>
        {(["quiet", "normal", "busy"] as LevelKey[]).map((lv) => (
          <span key={lv} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${BAR[lv]}`} />
            {labelMap[lv].replace("해요", "").replace("이에요", "").replace("워요", "움")}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-cream-300" />
          영업 외
        </span>
      </div>
    </div>
  );
}
