"use client";

import type { Cafe } from "@/lib/types";
import {
  levelOf,
  NOISE_LABEL,
  CROWD_LABEL,
  LEVEL_TEXT_CLASS,
} from "@/lib/scoring";

/**
 * 시간대별 소음/혼잡 바 차트.
 * 바를 누르면 해당 시간 기준으로 상태가 갱신된다.
 */
export default function HourlyChart({
  cafe,
  metric,
  selectedHour,
  onSelect,
  height = 72,
}: {
  cafe: Cafe;
  metric: "noise" | "crowd";
  selectedHour: number;
  onSelect: (hour: number) => void;
  height?: number;
}) {
  const selected = cafe.hourly.find((h) => h.hour === selectedHour);
  const value = selected ? selected[metric] : 0;
  const level = levelOf(value);
  const labelMap = metric === "noise" ? NOISE_LABEL : CROWD_LABEL;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] text-coffee-400">
          {String(selectedHour).padStart(2, "0")}:00 기준
        </span>
        <span className={`text-[13px] font-bold ${LEVEL_TEXT_CLASS[level]}`}>
          {labelMap[level]}
        </span>
      </div>
      <div
        className="flex items-end gap-[3px]"
        style={{ height }}
        role="group"
        aria-label="시간대별 그래프"
      >
        {cafe.hourly.map((p) => {
          const v = p[metric];
          const isSel = p.hour === selectedHour;
          const lv = levelOf(v);
          const barColor = isSel
            ? "bg-coffee-700"
            : lv === "busy"
              ? "bg-coffee-300/80"
              : lv === "normal"
                ? "bg-forest-300/80"
                : "bg-forest-200";
          return (
            <button
              key={p.hour}
              onClick={() => onSelect(p.hour)}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
              aria-label={`${p.hour}시 ${labelMap[levelOf(v)]}`}
              aria-pressed={isSel}
            >
              <div
                className={`w-full min-w-[6px] rounded-t-[3px] transition-all duration-200 group-hover:opacity-80 ${barColor}`}
                style={{ height: `${Math.max(v, 8)}%` }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[9.5px] text-coffee-300">
        {cafe.hourly
          .filter((p) => p.hour % 3 === 0)
          .map((p) => (
            <span key={p.hour}>{String(p.hour).padStart(2, "0")}</span>
          ))}
      </div>
    </div>
  );
}
