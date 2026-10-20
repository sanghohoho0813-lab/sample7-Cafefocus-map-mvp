"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { History, Info, List, Map as MapIcon, RotateCcw } from "lucide-react";
import { distanceKm, hourlyAt } from "@/lib/scoring";
import type { CafeMetrics, Plan } from "@/lib/types";
import { AREA_MAP, CAFES, CAFE_MAP } from "@/lib/data/cafes";
import { applyFilters } from "@/lib/filters";
import { PURPOSE_LABEL, PURPOSE_WEIGHTS, rankByFit } from "@/lib/fit";
import { dateKey, formatDuration, hm, relativeDate } from "@/lib/time";
import { nextPlan } from "@/lib/plans";
import { HABIT_MIN_VISITS } from "@/lib/personal";
import { buildExploreQuery, parseExploreQuery } from "@/lib/exploreQuery";
import { useApp } from "@/lib/store";
import { useFitContext } from "@/lib/useFitContext";
import MapView from "@/components/MapView";
import CafeCard from "@/components/CafeCard";
import CafeMiniCard from "@/components/CafeMiniCard";
import ExploreControls from "@/components/ExploreControls";
import MobileBottomSheet, { type SheetState } from "@/components/MobileBottomSheet";
import EmptyState from "@/components/EmptyState";
import Sheet from "@/components/Sheet";

const METRIC_NAME: Record<keyof CafeMetrics, string> = {
  noiseScore: "소음 (시간대 예측 반영)",
  crowdScore: "혼잡 (시간대 예측 반영)",
  outletScore: "콘센트",
  wifiScore: "Wi-Fi",
  seatScore: "좌석·테이블",
  stayScore: "오래 머물기 편한 정도",
};

/* 저장소·현재 시각을 읽기 전 자리표시 — 실제 카드와 같은 모양·크기 */
function CardSkeleton({ photo = 84 }: { photo?: number }) {
  return (
    <div className="flex gap-3.5 rounded-2xl border border-cream-300/70 bg-white p-3" aria-hidden>
      <div className="shrink-0 animate-pulse rounded-xl bg-cream-200" style={{ width: photo, height: photo }} />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-2/3 animate-pulse rounded bg-cream-200" />
        <div className="h-3.5 w-1/2 animate-pulse rounded bg-cream-200" />
        <div className="h-6 w-3/4 animate-pulse rounded bg-cream-200" />
      </div>
    </div>
  );
}

function PickSkeleton() {
  return (
    <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-cream-300/70" aria-hidden>
      <div className="aspect-[2.15/1] w-full animate-pulse bg-cream-200" />
      <div className="space-y-2 px-4 pb-4 pt-3">
        <div className="h-5 w-1/2 animate-pulse rounded bg-cream-200" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-cream-200" />
        <div className="mt-3 h-11 w-full animate-pulse rounded-xl bg-cream-100" />
      </div>
    </div>
  );
}

/** 목록 정렬 — 지도 마커는 그대로, 목록과 아래 카드의 순서만 바뀐다 */
type SortKey = "fit" | "near" | "calm";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "fit", label: "추천순" },
  { key: "near", label: "가까운순" },
  { key: "calm", label: "한산한순" },
];

export default function HomePage() {
  const { area, filters, setFilters, plans, hydrated, setArea, timeSel, setTimeSel, setPurpose } = useApp();
  const { purpose, hour, now, timeLabel, timeWord, stayMin, stayFromHistory, habits } = useFitContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ---- 지도 상태 ↔ 주소 동기화 (새로고침·공유·뒤로가기에도 같은 화면) ----
  const [urlApplied, setUrlApplied] = useState(false);
  useEffect(() => {
    if (!hydrated || urlApplied) return;
    setUrlApplied(true);
    // 주소에 있는 값만 적용한다 — 없으면 다른 화면에 다녀오기 전 상태를 그대로 쓴다
    const q = parseExploreQuery(window.location.search);
    if (q.area !== undefined) setArea(q.area);
    if (q.time !== undefined) setTimeSel(q.time);
    if (q.filters !== undefined) setFilters(q.filters);
    if (q.purpose !== undefined && q.purpose !== purpose) setPurpose(q.purpose);
    if (q.cafe) setSelectedId(q.cafe);
  }, [hydrated, urlApplied, purpose, setArea, setTimeSel, setFilters, setPurpose]);

  // 복원이 반영된 다음 렌더부터 주소에 쓴다 (복원 전 값으로 주소를 덮지 않게)
  useEffect(() => {
    if (!urlApplied) return;
    const next = buildExploreQuery({ area, purpose, time: timeSel, filters, cafe: selectedId });
    if (next !== window.location.search) {
      // replaceState: 조건을 바꿀 때마다 기록이 쌓이지 않게 (Next App Router가 지원하는 방식)
      window.history.replaceState(null, "", `${window.location.pathname}${next}`);
    }
  }, [urlApplied, area, purpose, timeSel, filters, selectedId]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetState>("collapsed");
  const [aboutOpen, setAboutOpen] = useState(false);


  const ranked = useMemo(() => {
    const base = area ? CAFES.filter((c) => c.area === area) : CAFES;
    return rankByFit(applyFilters(base, filters, hour), purpose, hour, stayMin);
  }, [area, filters, hour, purpose, stayMin]);

  const { cafes, scores, openIds } = useMemo(
    () => ({
      cafes: ranked.map((r) => r.cafe),
      scores: Object.fromEntries(ranked.map((r) => [r.cafe.id, r.score])) as Record<string, number>,
      openIds: new Set(ranked.filter((r) => r.open).map((r) => r.cafe.id)),
    }),
    [ranked]
  );

  /** 카페별 가장 가까운 예정 계획 — 지도 마커와 카드에 함께 표시 */
  const planByCafe = useMemo(() => {
    const today = now ? dateKey(now) : "";
    const map: Record<string, Plan> = {};
    for (const p of plans) {
      if (p.status !== "planned" || (today && p.date < today)) continue;
      const cur = map[p.cafeId];
      if (!cur || p.date < cur.date || (p.date === cur.date && p.startHour < cur.startHour)) map[p.cafeId] = p;
    }
    return map;
  }, [plans, now]);
  const plannedIds = useMemo(() => new Set(Object.keys(planByCafe)), [planByCafe]);

  // 다가오는 내 작업 — 지도 위에 띄워, 계획이 곧바로 지도에 반영된 걸 느끼게 한다
  const upcoming = useMemo(() => {
    const p = hydrated ? nextPlan(plans, now) : null;
    if (!p || !CAFE_MAP[p.cafeId]) return null;
    return { cafeId: p.cafeId, label: `${relativeDate(p.date, now)} ${hm(p.startHour)} · ${CAFE_MAP[p.cafeId].name}` };
  }, [hydrated, plans, now]);

  const selected = selectedId ? cafes.find((c) => c.id === selectedId) ?? null : null;

  // 키보드: "/" 검색으로 이동, Esc 선택 해제 (입력 중이거나 시트가 열려 있으면 무시)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.closest("input, textarea, select, [contenteditable=true]");
      if (typing || e.metaKey || e.ctrlKey || e.altKey || document.querySelector("[role=dialog][aria-modal=true]")) return;
      if (e.key === "/") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>("[data-search-input]")?.focus();
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 조건이 바뀌어 고른 카페가 목록에서 빠지면 선택도 푼다 (주소에도 남지 않게)
  useEffect(() => {
    if (hydrated && now && selectedId && !selected) setSelectedId(null);
  }, [hydrated, now, selectedId, selected]);

  const selectCafe = (id: string | null) => {
    setSelectedId(id);
    if (!id) return;
    if (sheet === "expanded") setSheet("collapsed");
    // 데스크톱 목록에서 해당 카드가 보이도록 스크롤 (마커 ↔ 카드 동기화)
    requestAnimationFrame(() => {
      document
        .querySelector(`aside [data-cafe-card="${id}"]`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  };

  /** 목록에서 "지도에서 보기" — 모바일은 시트를 내려 지도로 돌아간다 */
  const locate = (id: string) => {
    setSheet("collapsed");
    selectCafe(id);
  };

  const onSearchCafe = (id: string) => {
    const cafe = CAFE_MAP[id];
    if (!cafe) return;
    setArea(cafe.area);
    setFilters([]);
    selectCafe(id);
  };

  const purposeLabel = PURPOSE_LABEL[purpose];
  // 저장된 목적과 실제 현재 시각을 안 뒤에 그린다 — 로드 직후 순위·점수가 바뀌어 보이는 것을 막는다
  const ready = hydrated && now !== null;

  // 지금 조건에서 가장 잘 맞는 곳 (영업 중일 때만)
  const pick = ranked[0]?.open ? ranked[0].cafe : null;
  const rest = pick ? cafes.slice(1) : cafes;

  const [sort, setSort] = useState<SortKey>("fit");
  const ordered = useMemo(() => {
    if (sort === "fit") return cafes;
    const arr = [...ranked];
    if (sort === "near") arr.sort((a, b) => distanceKm(a.cafe.lat, a.cafe.lng) - distanceKm(b.cafe.lat, b.cafe.lng));
    // 도착 시간 기준 한산한 곳부터 (영업 중인 곳 먼저)
    else arr.sort((a, b) => Number(b.open) - Number(a.open) || hourlyAt(a.cafe, hour).crowd - hourlyAt(b.cafe, hour).crowd);
    return arr.map((r) => r.cafe);
  }, [sort, ranked, cafes, hour]);
  const when = timeWord === "지금" ? "지금" : `${hour}시에`;

  const empty = (
    <EmptyState
      title="조건에 맞는 카페가 아직 없어요"
      description="조건을 줄이거나 다른 지역·시간을 골라보세요."
      action={
        <button type="button" onClick={() => setFilters([])} className="btn-secondary h-11">
          <RotateCcw size={16} />
          조건 모두 지우기
        </button>
      }
    />
  );

  const card = (cafe: (typeof cafes)[number], withHover: boolean, variant: "row" | "pick" = "row", actions = false) => (
    <CafeCard
      key={cafe.id}
      cafe={cafe}
      variant={variant}
      actions={actions}
      purpose={purpose}
      hour={hour}
      now={now}
      plan={planByCafe[cafe.id]}
      highlighted={cafe.id === selectedId || (withHover && cafe.id === hoveredId)}
      onHover={withHover ? setHoveredId : undefined}
      onLocate={locate}
    />
  );

  const list = (withHover: boolean) =>
    sort === "fit" ? (
      <>
        {pick && card(pick, withHover, "pick", true)}
        {pick && rest.length > 0 && (
          <p className="px-1 pb-0.5 pt-3 text-caption font-semibold text-coffee-400">
            다른 후보 <span className="num">{rest.length}</span>곳
          </p>
        )}
        {rest.map((c) => card(c, withHover))}
      </>
    ) : (
      // 다른 정렬에서는 고른 순서 그대로 — 맨 위 대표 카드 없이
      <>{ordered.map((c) => card(c, withHover))}</>
    );

  const sortControl = (
    <div role="radiogroup" aria-label="목록 정렬" className="flex gap-1.5">
      {SORTS.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={sort === o.key}
          onClick={() => setSort(o.key)}
          className={`chip h-8 px-3 text-caption font-semibold ${sort === o.key ? "chip-active" : "chip-idle"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  const areaName = area ? AREA_MAP[area].name : "모든 지역";
  const listHeading = (
    <div className="min-w-0">
      <h2 className="truncate text-title text-coffee-900">
        {when} {purposeLabel}하기 좋은 곳
      </h2>
      <p className="truncate text-caption text-coffee-400">
        {area ? `${areaName} · ` : ""}
        <span className="num">{ranked.length}</span>곳 · <span className="num">{formatDuration(stayMin)}</span> 기준
        {stayFromHistory && <span className="font-semibold text-coffee-600"> · 내 기록 반영</span>}
      </p>
    </div>
  );

  // 내 기록으로 자주 가는 지역이 있으면 한 번에 좁혀 볼 수 있게 제안 (자동으로 바꾸지는 않는다)
  const areaSuggestion =
    area === null && habits.topArea && habits.topAreaCount >= HABIT_MIN_VISITS ? (
      <button
        type="button"
        onClick={() => {
          setArea(habits.topArea);
          setSelectedId(null);
        }}
        className="inline-flex h-8 items-center gap-1 rounded-full bg-cream-100 px-3 text-caption font-semibold text-coffee-700 hover:bg-cream-200"
      >
        <History size={13} aria-hidden />
        자주 가는 {AREA_MAP[habits.topArea].name}만 보기
      </button>
    ) : null;

  // 접힘 상태에서는 고른 카페, 없으면 가장 잘 맞는 곳을 바로 보여준다
  const peek = selected ?? pick ?? cafes[0] ?? null;

  /* ---- 모바일: 지도 아래 가로 카드 ↔ 마커 ----
     마커를 누르면 그 카드로 넘어가고, 카드를 옆으로 넘기면 그 카페의 마커가 선택된다. */
  const slideRef = useRef<HTMLDivElement>(null);
  const slideAuto = useRef(false);
  const slideTimer = useRef<number | undefined>(undefined);
  const activeSlide = selectedId ?? ordered[0]?.id ?? null;
  useEffect(() => {
    const el = slideRef.current;
    if (!el || sheet !== "collapsed" || !activeSlide) return;
    const card = el.querySelector<HTMLElement>(`[data-slide-id="${activeSlide}"]`);
    if (!card) return;
    const target = card.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft || "0");
    if (Math.abs(el.scrollLeft - target) < 4) return;
    slideAuto.current = true;
    el.scrollTo({ left: target, behavior: "smooth" });
    window.clearTimeout(slideTimer.current);
    slideTimer.current = window.setTimeout(() => (slideAuto.current = false), 500);
  }, [activeSlide, sheet, ready, ordered]);
  useEffect(() => () => window.clearTimeout(slideTimer.current), []);

  const onSlideScroll = () => {
    const el = slideRef.current;
    if (!el) return;
    window.clearTimeout(slideTimer.current);
    slideTimer.current = window.setTimeout(() => {
      if (slideAuto.current) {
        slideAuto.current = false;
        return;
      }
      const first = el.querySelector<HTMLElement>("[data-slide-id]");
      if (!first) return;
      const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
      const idx = Math.min(Math.max(Math.round(el.scrollLeft / step), 0), ordered.length - 1);
      const id = ordered[idx]?.id;
      if (id && id !== activeSlide) setSelectedId(id);
    }, 140);
  };

  return (
    <div className="flex h-full flex-col">
      <ExploreControls
        resultCount={ranked.length}
        onSelectCafe={onSearchCafe}
        onAreaChange={() => setSelectedId(null)}
      />

      <div className="relative flex min-h-0 flex-1">
        {/* ---------- 지도 (주 캔버스) ---------- */}
        <div className="relative min-w-0 flex-1">
          <MapView
            cafes={ready ? cafes : []}
            scores={scores}
            openIds={openIds}
            plannedIds={plannedIds}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={selectCafe}
            area={area}
            purposeLabel={purposeLabel}
            onLegendClick={() => setAboutOpen(true)}
            upcoming={upcoming}
            bestId={pick?.id ?? null}
            bottomInset={peek ? 262 : 132}
          >
            {selected && (
              <div className="absolute bottom-4 left-4 z-30 hidden lg:block">
                <CafeMiniCard cafe={selected} purpose={purpose} hour={hour} onClose={() => setSelectedId(null)} />
              </div>
            )}
          </MapView>

          {/* ---------- 모바일 목록 시트 ---------- */}
          <MobileBottomSheet
            state={sheet}
            onStateChange={setSheet}
            collapsedHeight={peek ? 262 : 132}
            header={
              <div className="flex items-center justify-between gap-3">
                {listHeading}
                <button
                  type="button"
                  onClick={() => setSheet(sheet === "expanded" ? "collapsed" : "expanded")}
                  className="btn h-9 shrink-0 rounded-full border border-cream-300 bg-white px-3 text-label text-coffee-700"
                >
                  {sheet === "expanded" ? <MapIcon size={15} /> : <List size={15} />}
                  {sheet === "expanded" ? "지도" : "목록"}
                </button>
              </div>
            }
          >
            {!ready ? (
              <div className="pr-5">
                <CardSkeleton photo={96} />
              </div>
            ) : ranked.length === 0 ? (
              empty
            ) : sheet === "collapsed" && peek ? (
              // 접힘: 순위대로 옆으로 넘기는 카드 — 지금 보이는 카드가 곧 지도에서 선택된 곳
              <div
                ref={slideRef}
                onScroll={onSlideScroll}
                className="no-scrollbar relative -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-pl-4 px-4 pb-1 pt-0.5"
                role="group"
                aria-label="지도에 표시된 카페 — 옆으로 넘기면 지도에서도 함께 선택돼요"
              >
                {ordered.map((c) => (
                  <div key={c.id} data-slide-id={c.id} className="w-[calc(100%-20px)] shrink-0 snap-start">
                    <CafeCard
                      cafe={c}
                      variant="slide"
                      purpose={purpose}
                      hour={hour}
                      now={now}
                      plan={planByCafe[c.id]}
                      highlighted={c.id === selectedId}
                      badge={c.id === pick?.id ? "추천" : undefined}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {sortControl}
                  {areaSuggestion}
                </div>
                {list(false)}
              </div>
            )}
          </MobileBottomSheet>
        </div>

        {/* ---------- 데스크톱 목록 패널 ---------- */}
        <aside className="hidden w-[380px] shrink-0 flex-col border-l border-cream-300/70 bg-cream-50 lg:flex xl:w-[440px] min-[1440px]:w-[500px]">
          <div className="border-b border-cream-300/70 px-5 py-3.5">
            <div className="flex items-center justify-between gap-3">
              {listHeading}
              <button type="button" onClick={() => setAboutOpen(true)} className="btn-quiet h-9 shrink-0 px-2 text-label">
                <Info size={15} />
                기준
              </button>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {sortControl}
              {areaSuggestion}
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4 pb-24">
            {!ready ? (
              <>
                <PickSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : ranked.length === 0 ? (
              empty
            ) : (
              list(true)
            )}
          </div>
        </aside>
      </div>

      <Sheet
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title="적합도는 이렇게 계산해요"
        description={`지금 기준: ${purposeLabel} · ${timeLabel.replace(" 기준", "")} · ${formatDuration(stayMin)}`}
      >
        <div className="space-y-4 text-body text-coffee-600">
          <p>
            고른 <b className="text-coffee-800">목적</b>에 따라 항목별 비중을 달리해 0~100점으로 종합해요. 소음·혼잡은 도착
            시간부터 <b className="text-coffee-800">머무는 동안</b>의 예측을 함께 봐요.
          </p>
          <ul className="space-y-2">
            {(Object.entries(PURPOSE_WEIGHTS[purpose]) as [keyof CafeMetrics, number][])
              .filter(([, w]) => w > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([k, w]) => (
                <li key={k} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 text-meta text-coffee-600">{METRIC_NAME[k]}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-200">
                    <span
                      className="block h-full rounded-full bg-coffee-600"
                      style={{ width: `${(w / Math.max(...Object.values(PURPOSE_WEIGHTS[purpose]))) * 100}%` }}
                    />
                  </span>
                  <span className="num w-10 text-right text-meta font-semibold text-coffee-800">
                    {Math.round(w * 100)}%
                  </span>
                </li>
              ))}
          </ul>
          <p className="text-meta text-coffee-600">
            지금은 <b className="num text-coffee-800">{formatDuration(stayMin)}</b> 머무는 기준이에요
            {stayFromHistory
              ? " — 내 작업 기록의 평균 시간이에요."
              : ". 작업 기록이 2건 이상 쌓이면 내 평균 시간으로 바뀌어요."}{" "}
            마감까지 시간이 부족하면 감점하고, 오래 머물기 편한 곳은 조금 더해요.
          </p>
          <p className="rounded-xl bg-cream-100 px-4 py-3 text-meta text-coffee-500">
            지금은 데모 데이터로 계산한 예측값이에요. 실제 서비스에서는 방문자 체크인과 공공·매장 데이터로 갱신할 수
            있어요.
          </p>
        </div>
      </Sheet>
    </div>
  );
}
