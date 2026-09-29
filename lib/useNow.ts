"use client";

import { useEffect, useState } from "react";

/**
 * 현재 시각. 마운트 전에는 null이고(정적 HTML과 불일치 방지), 이후 30초마다 갱신된다.
 * 초 단위 시계는 지도보다 눈에 띄므로 쓰지 않는다.
 */
export function useNow(intervalMs = 30_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
