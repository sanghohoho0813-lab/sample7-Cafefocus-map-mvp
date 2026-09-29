"use client";

import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { effectiveHour, isLiveHour, timeSelLabel } from "@/lib/time";

/**
 * 지도·상세·비교·추천이 공유하는 판단 기준.
 * 같은 목적·같은 시간으로 점수를 내야 화면마다 숫자가 어긋나지 않는다.
 */
export function useFitContext() {
  const { prefs, timeSel } = useApp();
  const now = useNow();
  const hour = effectiveHour(timeSel, now);
  return {
    purpose: prefs.purpose,
    hour,
    now,
    timeSel,
    timeLabel: timeSelLabel(timeSel, now),
    /** 실제 현재 시각을 따라가고 있는지 (아니면 "14시 기준"처럼 표기) */
    isLive: timeSel === "now" && isLiveHour(now),
  };
}
