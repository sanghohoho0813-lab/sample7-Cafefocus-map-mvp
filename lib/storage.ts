import type { Plan, Prefs, UserReview } from "@/lib/types";
import { CAFE_MAP } from "@/lib/data/cafes";
import { PURPOSE_LABEL } from "@/lib/fit";
import { PRIORITIES, STAY_OPTIONS } from "@/lib/recommendation";

/*
 * localStorage 읽기·쓰기와 저장값 검증.
 * 사용자가 값을 고치거나 이전 버전 데이터가 남아 있어도 앱이 깨지지 않도록,
 * 읽을 때 항목 단위로 검증하고 손상된 항목만 버린다.
 */

export function read<T>(key: string, guard: (v: unknown) => v is T, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return guard(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장소를 쓸 수 없는 환경(시크릿 모드 등) — 메모리 상태로만 동작
  }
}

export const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

const PURPOSE_KEYS = new Set<string>(Object.keys(PURPOSE_LABEL));
const PRIORITY_KEYS = new Set<string>(PRIORITIES.map((p) => p.key));
const STAY_KEYS = new Set<string>(STAY_OPTIONS.map((o) => o.key));
const STATUS_KEYS = new Set<string>(["planned", "completed", "cancelled"]);

const isObj = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object";

export const isPlan = (p: unknown): p is Plan =>
  isObj(p) &&
  typeof p.id === "string" &&
  typeof p.cafeId === "string" &&
  Boolean(CAFE_MAP[p.cafeId]) &&
  typeof p.date === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(p.date) &&
  typeof p.startHour === "number" &&
  p.startHour >= 0 &&
  p.startHour <= 23 &&
  typeof p.durationMin === "number" &&
  p.durationMin > 0 &&
  typeof p.purpose === "string" &&
  PURPOSE_KEYS.has(p.purpose) &&
  typeof p.status === "string" &&
  STATUS_KEYS.has(p.status);

export const isReview = (r: unknown): r is UserReview =>
  isObj(r) &&
  typeof r.id === "string" &&
  typeof r.cafeId === "string" &&
  Boolean(CAFE_MAP[r.cafeId]) &&
  typeof r.rating === "number" &&
  r.rating >= 1 &&
  r.rating <= 5 &&
  typeof r.purpose === "string" &&
  PURPOSE_KEYS.has(r.purpose);

/** 배열 안의 손상된 항목만 버린다 (하나가 깨졌다고 전체 기록을 잃지 않게) */
export const isArray = (v: unknown): v is unknown[] => Array.isArray(v);
export const keepValid = <T,>(list: unknown[], item: (v: unknown) => v is T): T[] => list.filter(item);

export const isPrefs = (v: unknown): v is Prefs =>
  isObj(v) &&
  typeof v.purpose === "string" &&
  PURPOSE_KEYS.has(v.purpose) &&
  Array.isArray(v.priorities) &&
  v.priorities.every((k) => typeof k === "string" && PRIORITY_KEYS.has(k)) &&
  typeof v.stay === "string" &&
  STAY_KEYS.has(v.stay);
