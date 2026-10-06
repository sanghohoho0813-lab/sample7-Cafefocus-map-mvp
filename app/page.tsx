"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, List, Map as MapIcon, RotateCcw } from "lucide-react";
import type { CafeMetrics, Plan } from "@/lib/types";
import { CAFES, CAFE_MAP } from "@/lib/data/cafes";
import { applyFilters } from "@/lib/filters";
import { PURPOSE_LABEL, PURPOSE_WEIGHTS, rankByFit } from "@/lib/fit";
import { dateKey } from "@/lib/time";
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

function CardSkeleton() {
  return (
    <div className="flex gap-3.5 rounded-2xl border border-cream-300/80 bg-white p-3" aria-hidden>
      <div className="h-[84px] w-[84px] shrink-0 animate-pulse rounded-xl bg-cream-200" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-2/3 animate-pulse rounded bg-cream-200" />
        <div className="h-3.5 w-1/2 animate-pulse rounded bg-cream-200" />
        <div className="h-6 w-3/4 animate-pulse rounded bg-cream-200" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { area, filters, setFilters, plans, hydrated, setArea, timeSel, setTimeSel, setPurpose } = useApp();
  const { purpose, hour, now, timeLabel } = useFitContext();
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
    return rankByFit(applyFilters(base, filters, hour), purpose, hour);
  }, [area, filters, hour, purpose]);

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

  const empty = (
    <EmptyState
      title="조건에 맞는 카페가 아직 없어요"
      description="필터를 줄이거나 다른 지역·시간을 골라보세요."
      action={
        <button type="button" onClick={() => setFilters([])} className="btn-secondary h-11">
          <RotateCcw size={16} />
          필터 초기화
        </button>
      }
    />
  );

  const listItems = (withHover: boolean) =>
    ranked.map(({ cafe }) => (
      <CafeCard
        key={cafe.id}
        cafe={cafe}
        purpose={purpose}
        hour={hour}
        now={now}
        plan={planByCafe[cafe.id]}
        highlighted={cafe.id === selectedId || (withHover && cafe.id === hoveredId)}
        onHover={withHover ? setHoveredId : undefined}
      />
    ));

  const listHeading = (
    <div className="min-w-0">
      <h2 className="truncate text-title text-coffee-900">
        <span className="num">{ranked.length}곳</span>
        <span className="font-semibold text-coffee-500"> · {purposeLabel} 적합도순</span>
      </h2>
      <p className="truncate text-caption text-coffee-400">{timeLabel.replace(" 기준", "")} 기준 · 데모 예측값</p>
    </div>
  );

  // 접힘 상태에서는 고른 카페, 없으면 1위 카페를 바로 보여준다
  const peek = selected ?? cafes[0] ?? null;

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
            collapsedHeight={peek ? 236 : 132}
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
              <CardSkeleton />
            ) : ranked.length === 0 ? (
              empty
            ) : sheet === "collapsed" && peek ? (
              <CafeCard
                cafe={peek}
                purpose={purpose}
                hour={hour}
                now={now}
                plan={planByCafe[peek.id]}
                highlighted={peek.id === selectedId}
              />
            ) : (
              <div className="space-y-2.5">{listItems(false)}</div>
            )}
          </MobileBottomSheet>
        </div>

        {/* ---------- 데스크톱 목록 패널 ---------- */}
        <aside className="hidden w-[380px] shrink-0 flex-col border-l border-cream-300/70 bg-cream-50 lg:flex xl:w-[440px] min-[1440px]:w-[500px]">
          <div className="flex items-center justify-between gap-3 border-b border-cream-300/70 px-5 py-3.5">
            {listHeading}
            <button type="button" onClick={() => setAboutOpen(true)} className="btn-quiet h-9 shrink-0 px-2 text-label">
              <Info size={15} />
              기준 보기
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4 pb-24">
            {!ready ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : ranked.length === 0 ? (
              empty
            ) : (
              listItems(true)
            )}
          </div>
        </aside>
      </div>

      <Sheet
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title="적합도는 이렇게 계산해요"
        description={`지금 기준: ${purposeLabel} · ${timeLabel.replace(" 기준", "")}`}
      >
        <div className="space-y-4 text-body text-coffee-600">
          <p>
            선택한 <b className="text-coffee-800">목적</b>과 <b className="text-coffee-800">시간대</b>를 기준으로 작업
            환경을 0~100점으로 종합한 값이에요. 목적이 바뀌면 항목별 비중이 달라져요.
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
          <p className="rounded-xl bg-cream-100 px-4 py-3 text-meta text-coffee-500">
            지금은 데모 데이터로 계산한 예측값이에요. 실제 서비스에서는 방문자 체크인과 공공·매장 데이터로 갱신할 수
            있어요.
          </p>
        </div>
      </Sheet>
    </div>
  );
}
