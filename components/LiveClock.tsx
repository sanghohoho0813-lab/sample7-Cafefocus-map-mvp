"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * 오늘 날짜·요일·현재 시각(초 단위)을 실시간으로 표시한다.
 * SSR/CSR 시각 차이로 인한 hydration 불일치를 피하려고 마운트 이후에만 렌더한다.
 */
export default function LiveClock({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // 마운트 전에는 레이아웃이 흔들리지 않도록 같은 크기의 자리만 잡아둔다.
  if (!now) {
    return (
      <div
        className={`flex shrink-0 items-center gap-2 rounded-full border border-cream-300 bg-white px-3.5 py-2 shadow-sm ${className}`}
        aria-hidden
      >
        <CalendarDays size={17} className="text-violet-500" />
        <span className="text-[15.5px] font-semibold text-coffee-300">
          —월 —일 (—)
        </span>
        <span className="font-mono text-[16.5px] font-bold tabular-nums text-coffee-300">
          --:--:--
        </span>
      </div>
    );
  }

  const dateText = `${now.getMonth() + 1}월 ${now.getDate()}일 (${WEEKDAYS[now.getDay()]})`;
  const timeText = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  return (
    <div
      className={`flex shrink-0 items-center gap-1.5 rounded-full border border-cream-300 bg-white px-3 py-2 shadow-sm sm:gap-2 sm:px-3.5 ${className}`}
      role="status"
      aria-label={`오늘 ${dateText} ${timeText}`}
    >
      <CalendarDays size={17} className="shrink-0 text-violet-500" />
      <span className="whitespace-nowrap text-[14.5px] font-semibold text-coffee-700 sm:text-[15.5px]">
        {dateText}
      </span>
      <span className="whitespace-nowrap font-mono text-[15.5px] font-bold tabular-nums text-coffee-900 sm:text-[16.5px]">
        {timeText}
      </span>
    </div>
  );
}
