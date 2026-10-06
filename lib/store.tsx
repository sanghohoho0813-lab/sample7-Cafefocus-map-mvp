"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AreaKey,
  FilterKey,
  Plan,
  PlanInput,
  Prefs,
  Purpose,
  ReviewInput,
  TimeSel,
  UserReview,
} from "@/lib/types";
import { CAFE_MAP } from "@/lib/data/cafes";
import { buildSeed } from "@/lib/data/seed";
import { validatePlan } from "@/lib/plans";
import { PURPOSE_LABEL } from "@/lib/fit";
import { PRIORITIES, STAY_OPTIONS } from "@/lib/recommendation";

/*
 * 데모 모드 상태 저장소.
 * - 영구 저장(localStorage): 저장·최근 본·비교함·작업 계획·후기·선호 조건
 * - 세션 상태(메모리): 지도 기준 시간·지역·필터 (상세에 다녀와도 유지)
 */

const KEY = {
  favorites: "cf:favorites",
  recent: "cf:recent",
  compare: "cf:compare",
  plans: "cf:v2:plans",
  reviews: "cf:v2:reviews",
  prefs: "cf:v2:prefs",
  seeded: "cf:v2:seeded",
} as const;

const DEFAULT_PREFS: Prefs = { purpose: "focus", priorities: ["quiet", "outlet"], stay: "long" };

interface ToastItem {
  id: number;
  message: string;
  /** 이동(href) 또는 즉시 실행(onClick, 예: 되돌리기) */
  action?: { label: string; href?: string; onClick?: () => void };
}

export type CreatePlanResult = { ok: true; plan: Plan } | { ok: false; error: string };

interface AppState {
  hydrated: boolean;
  // 저장·최근·비교
  favorites: string[];
  recent: string[];
  compare: string[];
  toggleFavorite: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  addRecent: (id: string) => void;
  toggleCompare: (id: string) => boolean;
  inCompare: (id: string) => boolean;
  setCompareList: (ids: string[]) => void;
  clearCompare: () => void;
  // 작업 계획 · 후기
  plans: Plan[];
  reviews: UserReview[];
  createPlan: (input: PlanInput, now: Date | null) => CreatePlanResult;
  cancelPlan: (id: string) => void;
  submitReview: (input: ReviewInput) => UserReview;
  // 선호 조건 · 탐색 상태
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  setPurpose: (p: Purpose) => void;
  timeSel: TimeSel;
  setTimeSel: (t: TimeSel) => void;
  area: AreaKey | null;
  setArea: (a: AreaKey | null) => void;
  filters: FilterKey[];
  toggleFilter: (f: FilterKey) => void;
  setFilters: (f: FilterKey[]) => void;
  // 데모
  resetDemo: () => void;
  // 토스트
  toasts: ToastItem[];
  showToast: (message: string, action?: ToastItem["action"]) => void;
  dismissToast: (id: number) => void;
}

const AppContext = createContext<AppState | null>(null);

/* ---------------- 저장소 유틸 (손상된 값은 버린다) ---------------- */

function read<T>(key: string, guard: (v: unknown) => v is T, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return guard(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장소를 쓸 수 없는 환경(시크릿 모드 등) — 메모리 상태로만 동작
  }
}

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

const PURPOSE_KEYS = new Set<string>(Object.keys(PURPOSE_LABEL));
const PRIORITY_KEYS = new Set<string>(PRIORITIES.map((p) => p.key));
const STAY_KEYS = new Set<string>(STAY_OPTIONS.map((o) => o.key));
const STATUS_KEYS = new Set<string>(["planned", "completed", "cancelled"]);

const isObj = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object";

const isPlan = (p: unknown): p is Plan =>
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

const isReview = (r: unknown): r is UserReview =>
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
const isArray = (v: unknown): v is unknown[] => Array.isArray(v);
const keepValid = <T,>(list: unknown[], item: (v: unknown) => v is T): T[] => list.filter(item);

const isPrefs = (v: unknown): v is Prefs =>
  isObj(v) &&
  typeof v.purpose === "string" &&
  PURPOSE_KEYS.has(v.purpose) &&
  Array.isArray(v.priorities) &&
  v.priorities.every((k) => typeof k === "string" && PRIORITY_KEYS.has(k)) &&
  typeof v.stay === "string" &&
  STAY_KEYS.has(v.stay);

const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* ---------------- Provider ---------------- */

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [timeSel, setTimeSel] = useState<TimeSel>("now");
  const [area, setArea] = useState<AreaKey | null>(null);
  const [filters, setFilters] = useState<FilterKey[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  // 동기 검증용 최신 값 미러 (연속 호출·빠른 더블클릭에도 정확하게)
  const plansRef = useRef<Plan[]>([]);
  const favRef = useRef<string[]>([]);
  const compareRef = useRef<string[]>([]);

  const commitPlans = useCallback((next: Plan[]) => {
    plansRef.current = next;
    setPlans(next);
    write(KEY.plans, next);
  }, []);

  const commitReviews = useCallback((next: UserReview[]) => {
    setReviews(next);
    write(KEY.reviews, next);
  }, []);

  useEffect(() => {
    const fav = read(KEY.favorites, isStringArray, []);
    const rec = read(KEY.recent, isStringArray, []);
    const cmp = read(KEY.compare, isStringArray, []);
    favRef.current = fav.filter((id) => CAFE_MAP[id]);
    compareRef.current = cmp.filter((id) => CAFE_MAP[id]).slice(0, 3);
    setFavorites(favRef.current);
    setRecent(rec.filter((id) => CAFE_MAP[id]));
    setCompare(compareRef.current);
    setPrefsState(read(KEY.prefs, isPrefs, DEFAULT_PREFS));

    // 첫 방문이면 샘플 계정 기록을 채운다
    const seeded = read(KEY.seeded, (v): v is boolean => typeof v === "boolean", false);
    if (!seeded) {
      const seed = buildSeed(new Date());
      commitPlans(seed.plans);
      commitReviews(seed.reviews);
      write(KEY.seeded, true);
    } else {
      const p = keepValid(read(KEY.plans, isArray, []), isPlan);
      plansRef.current = p;
      setPlans(p);
      setReviews(keepValid(read(KEY.reviews, isArray, []), isReview));
    }
    setHydrated(true);
  }, [commitPlans, commitReviews]);

  /* ---- 토스트 ---- */
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, action?: ToastItem["action"]) => {
      const id = ++toastId.current;
      setToasts([{ id, message, action }]);
      window.setTimeout(() => dismissToast(id), 3200);
    },
    [dismissToast]
  );

  /* ---- 저장 · 최근 · 비교 ---- */
  const toggleFavorite = useCallback((id: string) => {
    const has = favRef.current.includes(id);
    const next = has ? favRef.current.filter((v) => v !== id) : [...favRef.current, id];
    favRef.current = next;
    setFavorites(next);
    write(KEY.favorites, next);
    return !has;
  }, []);

  const addRecent = useCallback((id: string) => {
    setRecent((prev) => {
      if (prev[0] === id) return prev;
      const next = [id, ...prev.filter((v) => v !== id)].slice(0, 6);
      write(KEY.recent, next);
      return next;
    });
  }, []);

  /** 비교함에 넣었으면 true, 뺐거나 가득 차서 못 넣었으면 false */
  const toggleCompare = useCallback(
    (id: string) => {
      const cur = compareRef.current;
      if (cur.includes(id)) {
        const next = cur.filter((v) => v !== id);
        compareRef.current = next;
        setCompare(next);
        write(KEY.compare, next);
        return false;
      }
      if (cur.length >= 3) {
        showToast("비교는 최대 3곳까지 담을 수 있어요.");
        return false;
      }
      const next = [...cur, id];
      compareRef.current = next;
      setCompare(next);
      write(KEY.compare, next);
      return true;
    },
    [showToast]
  );

  const setCompareList = useCallback((ids: string[]) => {
    const next = ids.filter((id) => CAFE_MAP[id]).slice(0, 3);
    compareRef.current = next;
    setCompare(next);
    write(KEY.compare, next);
  }, []);

  const clearCompare = useCallback(() => setCompareList([]), [setCompareList]);

  /* ---- 작업 계획 ---- */
  const createPlan = useCallback(
    (input: PlanInput, now: Date | null): CreatePlanResult => {
      const cafe = CAFE_MAP[input.cafeId];
      if (!cafe) return { ok: false, error: "카페 정보를 찾을 수 없어요." };
      const error = validatePlan(input, cafe, plansRef.current, now, (id) => CAFE_MAP[id]?.name ?? "다른 카페");
      if (error) return { ok: false, error };
      const plan: Plan = {
        ...input,
        memo: input.memo.trim(),
        id: uid("p"),
        status: "planned",
        createdAt: new Date().toISOString(),
      };
      commitPlans([...plansRef.current, plan]);
      return { ok: true, plan };
    },
    [commitPlans]
  );

  const cancelPlan = useCallback(
    (id: string) => {
      commitPlans(
        plansRef.current.map((p) =>
          p.id === id && p.status === "planned"
            ? { ...p, status: "cancelled", cancelledAt: new Date().toISOString() }
            : p
        )
      );
    },
    [commitPlans]
  );

  /** 후기 저장. 계획에서 왔다면 그 계획을 '완료'로 바꾼다. */
  const submitReview = useCallback(
    (input: ReviewInput) => {
      const review: UserReview = { ...input, text: input.text.trim(), id: uid("r"), createdAt: new Date().toISOString() };
      setReviews((prev) => {
        const next = [review, ...prev];
        write(KEY.reviews, next);
        return next;
      });
      if (input.planId) {
        commitPlans(
          plansRef.current.map((p) =>
            p.id === input.planId
              ? { ...p, status: "completed", completedAt: review.createdAt, reviewId: review.id }
              : p
          )
        );
      }
      return review;
    },
    [commitPlans]
  );

  /* ---- 선호 조건 ---- */
  const setPrefs = useCallback((p: Prefs) => {
    setPrefsState(p);
    write(KEY.prefs, p);
  }, []);

  const setPurpose = useCallback((purpose: Purpose) => {
    setPrefsState((prev) => {
      const next = { ...prev, purpose };
      write(KEY.prefs, next);
      return next;
    });
  }, []);

  const toggleFilter = useCallback((f: FilterKey) => {
    setFilters((prev) => (prev.includes(f) ? prev.filter((k) => k !== f) : [...prev, f]));
  }, []);

  /* ---- 데모 초기화: 샘플 계정 상태로 되돌린다 ---- */
  const resetDemo = useCallback(() => {
    const seed = buildSeed(new Date());
    favRef.current = [];
    compareRef.current = [];
    setFavorites([]);
    setCompare([]);
    setRecent([]);
    setPrefsState(DEFAULT_PREFS);
    setTimeSel("now");
    setArea(null);
    setFilters([]);
    write(KEY.favorites, []);
    write(KEY.compare, []);
    write(KEY.recent, []);
    write(KEY.prefs, DEFAULT_PREFS);
    commitPlans(seed.plans);
    commitReviews(seed.reviews);
  }, [commitPlans, commitReviews]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);
  const inCompare = useCallback((id: string) => compare.includes(id), [compare]);

  const value = useMemo<AppState>(
    () => ({
      hydrated,
      favorites,
      recent,
      compare,
      toggleFavorite,
      isFavorite,
      addRecent,
      toggleCompare,
      inCompare,
      setCompareList,
      clearCompare,
      plans,
      reviews,
      createPlan,
      cancelPlan,
      submitReview,
      prefs,
      setPrefs,
      setPurpose,
      timeSel,
      setTimeSel,
      area,
      setArea,
      filters,
      toggleFilter,
      setFilters,
      resetDemo,
      toasts,
      showToast,
      dismissToast,
    }),
    [
      hydrated, favorites, recent, compare, toggleFavorite, isFavorite, addRecent,
      toggleCompare, inCompare, setCompareList, clearCompare, plans, reviews,
      createPlan, cancelPlan, submitReview, prefs, setPrefs, setPurpose, timeSel,
      area, filters, toggleFilter, resetDemo, toasts, showToast, dismissToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
