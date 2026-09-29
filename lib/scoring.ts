import type { Cafe, HourlyPoint } from "@/lib/types";
import { DEMO_LOCATION, HOURS } from "@/lib/data/cafes";

/* ---------------- 시간대 상태 ---------------- */

export type LevelKey = "quiet" | "normal" | "busy";

export function levelOf(value: number): LevelKey {
  if (value < 40) return "quiet";
  if (value < 62) return "normal";
  return "busy";
}

export const NOISE_LABEL: Record<LevelKey, string> = {
  quiet: "조용해요",
  normal: "보통이에요",
  busy: "시끄러워요",
};

export const CROWD_LABEL: Record<LevelKey, string> = {
  quiet: "한산해요",
  normal: "보통이에요",
  busy: "혼잡해요",
};

export function hourlyAt(cafe: Cafe, hour: number): HourlyPoint {
  const clamped = Math.min(Math.max(hour, HOURS[0]), HOURS[HOURS.length - 1]);
  return (
    cafe.hourly.find((h) => h.hour === clamped) ?? cafe.hourly[0]
  );
}

/* ---------------- 거리/포맷 ---------------- */

export function distanceKm(
  lat: number,
  lng: number,
  from: { lat: number; lng: number } = DEMO_LOCATION
): number {
  const R = 6371;
  const dLat = ((lat - from.lat) * Math.PI) / 180;
  const dLng = ((lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export function formatStay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}h ${m}m`;
}

export function formatHours(cafe: Cafe): string {
  const c = cafe.close === 24 ? "24:00" : `${String(cafe.close).padStart(2, "0")}:00`;
  return `${String(cafe.open).padStart(2, "0")}:00 - ${c}`;
}

export function isOpenAt(cafe: Cafe, hour: number): boolean {
  return hour >= cafe.open && hour < cafe.close;
}

export function metricLabel(value: number): string {
  if (value >= 85) return "매우 좋음";
  if (value >= 75) return "좋음";
  if (value >= 60) return "보통";
  return "아쉬움";
}

export function outletLabel(value: number): string {
  if (value >= 85) return "매우 많음";
  if (value >= 75) return "많음";
  if (value >= 60) return "보통";
  return "적음";
}

export function noiseLabel(value: number): string {
  if (value >= 85) return "매우 조용함";
  if (value >= 75) return "조용함";
  if (value >= 60) return "보통";
  return "다소 소란";
}
