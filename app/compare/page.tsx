"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Scale, X, Plus, Star } from "lucide-react";
import { CAFES, AREA_MAP } from "@/lib/data/cafes";
import {
  workScore,
  demoHour,
  distanceKm,
  formatDistance,
  formatStay,
  formatHours,
  hourlyAt,
  levelOf,
  NOISE_LABEL,
  CROWD_LABEL,
  noiseLabel,
  outletLabel,
  metricLabel,
  scoreBgClass,
} from "@/lib/scoring";
import CafePhoto from "@/components/CafePhoto";
import EmptyState from "@/components/EmptyState";
import { useApp } from "@/lib/store";
import type { Cafe } from "@/lib/types";

interface RowDef {
  label: string;
  value: (c: Cafe, hour: number) => string;
  /** 클수록 좋은 수치. 최고값 강조에 사용 */
  num?: (c: Cafe, hour: number) => number;
}

const ROWS: RowDef[] = [
  { label: "거리", value: (c) => formatDistance(distanceKm(c.lat, c.lng)), num: (c) => -distanceKm(c.lat, c.lng) },
  { label: "소음", value: (c) => noiseLabel(c.metrics.noiseScore), num: (c) => c.metrics.noiseScore },
  { label: "지금 혼잡도", value: (c, h) => CROWD_LABEL[levelOf(hourlyAt(c, h).crowd)], num: (c, h) => -hourlyAt(c, h).crowd },
  { label: "Wi-Fi", value: (c) => `${c.wifiMbps}Mbps`, num: (c) => c.wifiMbps },
  { label: "콘센트", value: (c) => outletLabel(c.metrics.outletScore), num: (c) => c.metrics.outletScore },
  { label: "테이블·좌석", value: (c) => (c.amenities.bigTable ? "넓음" : metricLabel(c.metrics.seatScore)), num: (c) => c.metrics.seatScore },
  { label: "평균 체류", value: (c) => formatStay(c.avgStayMinutes), num: (c) => c.avgStayMinutes },
  { label: "영업시간", value: (c) => formatHours(c) },
];

export default function ComparePage() {
  const { compare, toggleCompare, clearCompare, hydrated, favorites } = useApp();
  const [hour, setHour] = useState(15);
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => setHour(demoHour(new Date())), []);

  const cafes = compare
    .map((id) => CAFES.find((c) => c.id === id))
    .filter((c): c is Cafe => Boolean(c));

  const candidates = useMemo(() => {
    const favs = CAFES.filter((c) => favorites.includes(c.id) && !compare.includes(c.id));
    const rest = CAFES.filter((c) => !favorites.includes(c.id) && !compare.includes(c.id)).sort(
      (a, b) => workScore(b.metrics) - workScore(a.metrics)
    );
    return [...favs, ...rest].slice(0, 10);
  }, [favorites, compare]);

  const bestOf = (row: RowDef): number | null => {
    if (!row.num || cafes.length < 2) return null;
    let bestIdx = 0;
    let bestVal = -Infinity;
    cafes.forEach((c, i) => {
      const v = row.num!(c, hour);
      if (v > bestVal) {
        bestVal = v;
        bestIdx = i;
      }
    });
    return bestIdx;
  };

  const scores = cafes.map((c) => workScore(c.metrics));
  const bestScoreIdx = scores.indexOf(Math.max(...scores));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 lg:px-6 lg:py-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-coffee-800">카페 비교</h1>
            <p className="mt-0.5 text-[17px] text-coffee-400">
              최대 3곳까지 작업환경을 나란히 비교할 수 있어요. ({hour}시 기준)
            </p>
          </div>
          {hydrated && cafes.length > 0 && (
            <button
              onClick={clearCompare}
              className="text-[16.5px] font-semibold text-coffee-400 underline-offset-2 transition-colors hover:text-coffee-700 hover:underline"
            >
              전체 비우기
            </button>
          )}
        </div>

        {hydrated && cafes.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="비교할 카페를 담아보세요."
            description="카페 카드나 상세 페이지에서 '비교'를 누르면 여기서 나란히 볼 수 있어요."
            action={
              <Link
                href="/"
                className="rounded-full bg-coffee-700 px-4 py-2 text-[17px] font-semibold text-cream-50 transition-colors hover:bg-coffee-600"
              >
                지도에서 카페 찾기
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto pb-6">
            <div
              className="grid min-w-[560px] gap-3"
              style={{
                gridTemplateColumns: `repeat(${cafes.length + (cafes.length < 3 ? 1 : 0)}, minmax(170px, 1fr))`,
              }}
            >
              {cafes.map((cafe, i) => {
                const score = scores[i];
                return (
                  <div
                    key={cafe.id}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-card animate-fade-up ${
                      i === bestScoreIdx && cafes.length > 1
                        ? "border-forest-500 ring-2 ring-forest-500/15"
                        : "border-cream-200"
                    }`}
                  >
                    <div className="relative">
                      <CafePhoto
                        cafe={cafe}
                        className="aspect-[4/3] w-full"
                        sizes="(max-width: 768px) 50vw, 300px"
                      />
                      <button
                        onClick={() => toggleCompare(cafe.id)}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-coffee-500 shadow-card transition-transform active:scale-90"
                        aria-label={`${cafe.name} 비교 제외`}
                      >
                        <X size={16.5} />
                      </button>
                      {i === bestScoreIdx && cafes.length > 1 && (
                        <span className="absolute left-2 top-2 rounded-full bg-forest-600 px-2 py-0.5 text-[13px] font-bold text-white">
                          작업점수 1위
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <Link href={`/cafe/${cafe.id}`} className="block">
                        <h3 className="truncate text-[18px] font-bold text-coffee-800 hover:underline">
                          {cafe.name}
                        </h3>
                      </Link>
                      <div className="mt-0.5 flex items-center gap-1 text-[15px] text-coffee-400">
                        <Star size={13} className="fill-amber2-400 text-amber2-400" />
                        {cafe.rating.toFixed(1)} · {AREA_MAP[cafe.area].name}
                      </div>
                      <div
                        className={`mt-2.5 flex items-center justify-center gap-1.5 rounded-xl py-2 text-white ${scoreBgClass(score)}`}
                      >
                        <span className="text-[24.5px] font-bold leading-none">{score}</span>
                        <span className="text-[13.5px] opacity-80">작업점수</span>
                      </div>
                      <dl className="mt-2 divide-y divide-cream-200">
                        {ROWS.map((row) => {
                          const best = bestOf(row);
                          const highlight = best === i;
                          return (
                            <div key={row.label} className="py-2">
                              <dt className="text-[13.5px] text-coffee-300">{row.label}</dt>
                              <dd
                                className={`mt-0.5 text-[16.5px] font-semibold ${
                                  highlight ? "text-forest-600" : "text-coffee-700"
                                }`}
                              >
                                {row.value(cafe, hour)}
                                {highlight && <span className="ml-1 text-[13px]">●</span>}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    </div>
                  </div>
                );
              })}

              {/* 추가 슬롯 */}
              {cafes.length < 3 && (
                <div className="relative flex min-h-[300px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cream-300 bg-white/50 p-4 text-center">
                  <button
                    onClick={() => setPickerOpen((v) => !v)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-coffee-700 text-cream-50 shadow-card transition-transform hover:scale-105 active:scale-95"
                    aria-label="비교할 카페 추가"
                  >
                    <Plus size={24} />
                  </button>
                  <span className="text-[16.5px] font-medium text-coffee-400">
                    카페 추가하기
                  </span>
                  {pickerOpen && (
                    <div className="absolute inset-x-3 top-1/2 z-30 max-h-64 -translate-y-1/2 overflow-y-auto rounded-2xl border border-cream-200 bg-white py-1.5 shadow-card-lg animate-fade-up">
                      {candidates.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            toggleCompare(c.id);
                            setPickerOpen(false);
                          }}
                          className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left transition-colors hover:bg-cream-100"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[17px] font-semibold text-coffee-800">
                              {c.name}
                            </span>
                            <span className="text-[14.5px] text-coffee-400">
                              {AREA_MAP[c.area].name}
                              {favorites.includes(c.id) && " · 즐겨찾기"}
                            </span>
                          </span>
                          <span className="shrink-0 text-[16.5px] font-bold text-forest-600">
                            {workScore(c.metrics)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
