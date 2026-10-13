"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { effectiveHour, isLiveHour, timeSelLabel } from "@/lib/time";
import { habitsFrom, stayFor } from "@/lib/personal";

/**
 * 지도·상세·비교·추천이 공유하는 판단 기준.
 * 같은 목적·같은 시간·같은 체류 시간으로 점수를 내야 화면마다 숫자와 이유가 어긋나지 않는다.
 */
export function useFitContext() {
  const { prefs, timeSel, plans, reviews, hydrated } = useApp();
  const now = useNow();
  const hour = effectiveHour(timeSel, now);
  const isLive = timeSel === "now" && isLiveHour(now);

  // 내 작업 기록 → 보통 머무는 시간 (기록이 부족하면 선호 조건)
  const habits = useMemo(() => habitsFrom(hydrated ? plans : [], hydrated ? reviews : []), [plans, reviews, hydrated]);
  const stay = stayFor(habits, prefs);

  return {
    purpose: prefs.purpose,
    hour,
    now,
    timeSel,
    timeLabel: timeSelLabel(timeSel, now),
    /** 실제 현재 시각을 따라가고 있는지 (아니면 "14시 기준"처럼 표기) */
    isLive,
    /** 문장에 넣는 시간 표현: "지금" / "15시" */
    timeWord: isLive ? "지금" : `${hour}시`,
    /** 점수 계산에 쓰는 체류 시간(분)과 그 출처 */
    stayMin: stay.minutes,
    stayFromHistory: stay.fromHistory,
    habits,
  };
}
