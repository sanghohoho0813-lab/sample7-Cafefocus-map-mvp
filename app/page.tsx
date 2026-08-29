"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Clock, ListFilter, Sparkles } from "lucide-react";
import Link from "next/link";
import type { AreaKey, FilterKey } from "@/lib/types";
import { AREAS, AREA_MAP, CAFES, HOURS } from "@/lib/data/cafes";
import { applyFilters } from "@/lib/filters";
import { workScore, demoHour, distanceKm } from "@/lib/scoring";
import MapView from "@/components/MapView";
import CafeCard from "@/components/CafeCard";
import CafeMiniCard from "@/components/CafeMiniCard";
import FilterChips from "@/components/FilterChips";
import SearchBox from "@/components/SearchBox";
import LiveClock from "@/components/LiveClock";
import MobileBottomSheet, { type SheetState } from "@/components/MobileBottomSheet";
import EmptyState from "@/components/EmptyState";
import { useApp } from "@/lib/store";

function CardSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl border border-cream-200 bg-white p-3">
      <div className="h-24 w-24 shrink-0 animate-pulse rounded-xl bg-cream-200" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-2/3 animate-pulse rounded bg-cream-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-cream-200" />
        <div className="flex gap-1.5">
          <div className="h-5 w-16 animate-pulse rounded bg-cream-200" />
          <div className="h-5 w-16 animate-pulse rounded bg-cream-200" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { addRecent } = useApp();
  // 첫 화면에서는 전체 지역의 카페를 모두 보여준다.
  const [area, setArea] = useState<AreaKey | null>(null);
  const [filters, setFilters] = useState<FilterKey[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hour, setHour] = useState(15);
  // 실제 현재 시각(시). 정적 프리렌더 HTML과 어긋나지 않도록 마운트 후에 채운다.
  const [nowHour, setNowHour] = useState(15);
  const [isNow, setIsNow] = useState(true);
  const [sheet, setSheet] = useState<SheetState>("collapsed");
  const [ready, setReady] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);

  useEffect(() => {
    const h = demoHour(new Date());
    setHour(h);
    setNowHour(h);
    const t = window.setTimeout(() => setReady(true), 550);
    return () => window.clearTimeout(t);
  }, []);

  const visible = useMemo(() => {
    const base = area ? CAFES.filter((c) => c.area === area) : CAFES;
    const filtered = applyFilters(base, filters, hour);
    return [...filtered].sort((a, b) => {
      const diff = workScore(b.metrics) - workScore(a.metrics);
      if (diff !== 0) return diff;
      return distanceKm(a.lat, a.lng) - distanceKm(b.lat, b.lng);
    });
  }, [area, filters, hour]);

  const selected = selectedId
    ? visible.find((c) => c.id === selectedId) ?? null
    : null;

  const toggleFilter = (key: FilterKey) => {
    setFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectCafe = (id: string | null) => {
    setSelectedId(id);
    if (id) {
      addRecent(id);
      setSheet((s) => (s === "expanded" ? "half" : s));
    }
  };

  const onSearchCafe = (id: string) => {
    const cafe = CAFES.find((c) => c.id === id);
    if (cafe) {
      setArea(cafe.area);
      setFilters([]);
      selectCafe(id);
    }
  };

  const areaLabel = area ? AREA_MAP[area].name : "모든 지역";
  const quietCount = visible.filter((c) => c.metrics.noiseScore >= 78).length;

  return (
    <div className="flex h-full flex-col">
      {/* ---- 상단 컨트롤 바 ---- */}
      <div className="z-40 shrink-0 space-y-2.5 border-b border-cream-200 bg-cream-50/95 px-3 pb-2.5 pt-2.5 backdrop-blur lg:px-5 lg:pt-3">
        {/* 오늘 날짜 · 실시간 시각 (xl 미만에서는 이 줄에 표시) */}
        <div className="flex items-center justify-between gap-2 xl:hidden">
          <LiveClock />
          <span className="hidden truncate text-[14.5px] font-medium text-coffee-400 sm:block">
            지금 일하기 좋은 카페를 찾아보세요.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SearchBox
            onSelectArea={(k) => {
              setArea(k);
              setSelectedId(null);
            }}
            onSelectCafe={onSearchCafe}
            className="min-w-0 flex-1 lg:max-w-md"
          />
          {/* 지역 선택 */}
          <div className="relative shrink-0">
            <button
              onClick={() => setAreaOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-cream-300 bg-white px-3.5 py-2.5 text-[17px] font-semibold text-coffee-700 shadow-sm transition-colors hover:border-coffee-300"
              aria-haspopup="listbox"
              aria-expanded={areaOpen}
            >
              {areaLabel}
              <ChevronDown size={17.5} className={`transition-transform ${areaOpen ? "rotate-180" : ""}`} />
            </button>
            {areaOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-2xl border border-cream-200 bg-white py-1.5 shadow-card-lg animate-fade-up" role="listbox">
                <button
                  onClick={() => {
                    setArea(null);
                    setAreaOpen(false);
                    setSelectedId(null);
                  }}
                  className={`block w-full px-4 py-2 text-left text-[17px] transition-colors hover:bg-cream-100 ${area === null ? "font-bold text-coffee-800" : "text-coffee-500"}`}
                >
                  모든 지역
                </button>
                {AREAS.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => {
                      setArea(a.key);
                      setAreaOpen(false);
                      setSelectedId(null);
                    }}
                    className={`block w-full px-4 py-2 text-left text-[17px] transition-colors hover:bg-cream-100 ${area === a.key ? "font-bold text-coffee-800" : "text-coffee-500"}`}
                  >
                    {a.name}
                    <span className="ml-1 text-[14.5px] text-coffee-300">{a.station}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 오늘 날짜 · 실시간 시각 */}
          <LiveClock className="hidden xl:flex" />
          {/* 시간대 선택 */}
          <label className="hidden shrink-0 items-center gap-1.5 rounded-full border border-cream-300 bg-white px-3 py-2 text-[17px] font-semibold text-coffee-700 shadow-sm sm:flex">
            <Clock size={17} className="text-violet-500" />
            <select
              value={hour}
              onChange={(e) => {
                setHour(Number(e.target.value));
                setIsNow(Number(e.target.value) === nowHour);
              }}
              className="cursor-pointer bg-transparent outline-none"
              aria-label="기준 시간대"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h === nowHour ? `지금 ${h}시` : `${h}시`}
                </option>
              ))}
            </select>
          </label>
        </div>
        <FilterChips
          active={filters}
          onToggle={toggleFilter}
          onReset={() => setFilters([])}
          className="-mx-3 px-3 lg:mx-0 lg:px-0"
        />
      </div>

      {/* ---- 본문: 지도 + 리스트 ---- */}
      <div className="relative flex min-h-0 flex-1">
        {/* 지도 */}
        <div className="relative min-w-0 flex-1">
          <MapView
            cafes={visible}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={selectCafe}
            hour={hour}
            area={area}
          >
            {/* 상태 배너 */}
            <div className="pointer-events-none absolute left-3 top-3 z-20 hidden items-center gap-2 whitespace-nowrap rounded-full border border-cream-200 bg-white/95 px-4 py-2 text-[16.5px] text-coffee-600 shadow-card backdrop-blur md:flex">
              <Sparkles size={16.5} className="shrink-0 text-forest-500" />
              <span>
                {isNow ? "지금 " : ""}
                <b className="text-coffee-800">{hour}시</b> · 작업 카페{" "}
                <b className="text-forest-600">{visible.length}곳</b>
                {quietCount > 0 && (
                  <>
                    {" "}· 조용한 곳 <b className="text-forest-600">{quietCount}곳</b>
                  </>
                )}
              </span>
            </div>

            {/* 데스크톱: 선택 카페 미니 카드 */}
            {selected && (
              <div className="absolute bottom-4 left-4 z-30 hidden lg:block">
                <CafeMiniCard cafe={selected} hour={hour} onClose={() => setSelectedId(null)} />
              </div>
            )}
          </MapView>

          {/* 모바일 Bottom Sheet */}
          <MobileBottomSheet
            state={sheet}
            onStateChange={setSheet}
            collapsedHeight={selected && sheet === "collapsed" ? "290px" : "148px"}
            header={
              <div className="flex items-center justify-between">
                <span className="text-[17px] font-bold text-coffee-800">
                  {areaLabel} 작업 카페 {visible.length}
                </span>
                <span className="flex items-center gap-1 text-[15px] text-coffee-400">
                  <ListFilter size={15} />
                  작업점수순
                </span>
              </div>
            }
          >
            {selected && sheet === "collapsed" ? (
              <div className="-mx-1 pt-1">
                <CafeCard cafe={selected} hour={hour} variant="row" highlighted />
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {!ready ? (
                  <>
                    <CardSkeleton />
                    <CardSkeleton />
                  </>
                ) : visible.length === 0 ? (
                  <EmptyState
                    title="조건에 맞는 카페가 아직 없어요."
                    description="필터를 조금 풀면 더 많은 작업 카페를 볼 수 있어요."
                    action={
                      <button
                        onClick={() => setFilters([])}
                        className="rounded-full bg-coffee-700 px-4 py-2 text-[17px] font-semibold text-cream-50"
                      >
                        필터 초기화
                      </button>
                    }
                  />
                ) : (
                  visible.map((cafe) => (
                    <div key={cafe.id} onClick={() => addRecent(cafe.id)}>
                      <CafeCard
                        cafe={cafe}
                        hour={hour}
                        variant="row"
                        highlighted={cafe.id === selectedId}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </MobileBottomSheet>
        </div>

        {/* 데스크톱 리스트 패널 */}
        <aside className="hidden w-[520px] shrink-0 flex-col border-l border-cream-200 bg-cream-50 lg:flex xl:w-[560px]">
          <div className="flex items-center justify-between border-b border-cream-200 px-4 py-3">
            <h2 className="text-[18px] font-bold text-coffee-800">
              {areaLabel} 주변 추천 카페{" "}
              <span className="text-forest-600">{visible.length}</span>
            </h2>
            <span className="flex items-center gap-1 text-[15px] text-coffee-400">
              <ListFilter size={15} />
              작업점수순
            </span>
          </div>
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3.5">
            {!ready ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : visible.length === 0 ? (
              <EmptyState
                title="조건에 맞는 카페가 아직 없어요."
                description="필터를 초기화하거나 다른 지역을 선택해 보세요."
                action={
                  <button
                    onClick={() => setFilters([])}
                    className="rounded-full bg-coffee-700 px-4 py-2 text-[17px] font-semibold text-cream-50 transition-colors hover:bg-coffee-600"
                  >
                    필터 초기화
                  </button>
                }
              />
            ) : (
              <>
                {visible.map((cafe) => (
                  <div key={cafe.id} onClick={() => addRecent(cafe.id)}>
                    <CafeCard
                      cafe={cafe}
                      hour={hour}
                      variant="row"
                      highlighted={cafe.id === selectedId || cafe.id === hoveredId}
                      onHover={setHoveredId}
                    />
                  </div>
                ))}
                <Link
                  href="/recommend"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-coffee-200 bg-white/60 py-4 text-[17px] font-semibold text-coffee-500 transition-colors hover:border-coffee-400 hover:text-coffee-700"
                >
                  <Sparkles size={19} className="text-forest-500" />
                  조건이 애매하다면? 내게 맞는 카페 찾기
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
