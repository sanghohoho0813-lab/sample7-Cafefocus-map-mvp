"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, MapPin, TrainFront, ArrowLeft, X, History, Sparkles } from "lucide-react";
import { AREAS, CAFES, CAFE_MAP } from "@/lib/data/cafes";
import { PURPOSE_LABEL, fitScore, rankByFit } from "@/lib/fit";
import type { AreaKey } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useFitContext } from "@/lib/useFitContext";
import CafePhoto from "@/components/CafePhoto";

interface Suggestion {
  type: "area" | "station" | "cafe";
  label: string;
  sub: string;
  areaKey?: AreaKey;
  cafeId?: string;
  /** 검색어 없이 보여줄 때의 묶음 */
  group?: "area" | "recent" | "top";
}

const AREA_COUNT = Object.fromEntries(AREAS.map((a) => [a.key, CAFES.filter((c) => c.area === a.key).length])) as Record<AreaKey, number>;

/** 좁은 화면인지 (모바일은 검색을 전체 화면으로 연다) */
function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

/**
 * 지역·역·카페 이름 검색 (데모 데이터 22곳 대상).
 * - 데스크톱: 입력창 아래 펼침 목록
 * - 모바일: 입력창을 누르면 전체 화면 검색 — 지역 바로가기 · 최근 본 카페 · 지금 잘 맞는 곳을 먼저 보여준다
 * 접근성: 포커스는 입력창에 둔 채 화살표로 항목을 고르는 combobox 패턴 (aria-activedescendant)
 */
export default function SearchBox({
  onSelectArea,
  onSelectCafe,
  placeholder = "지역·역·카페 이름 검색",
  className = "",
  onOverlayChange,
}: {
  onSelectArea: (key: AreaKey) => void;
  onSelectCafe: (id: string) => void;
  placeholder?: string;
  className?: string;
  /** 모바일 전체 화면 검색이 열리고 닫힐 때 (부모가 쌓임 순서를 올리도록) */
  onOverlayChange?: (open: boolean) => void;
}) {
  const { recent, hydrated } = useApp();
  const { purpose, hour, stayMin } = useFitContext();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // -1: 아무것도 고르지 않음 (터치로 열었을 때 첫 항목이 선택된 것처럼 보이지 않게)
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const narrow = useNarrow();
  const overlay = open && narrow;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // 전체 화면 검색 중에는 공용 뒤로·앞으로 버튼을 숨긴다 (시트와 같은 규칙)
  useEffect(() => {
    onOverlayChange?.(overlay);
    if (!overlay) return;
    document.documentElement.dataset.sheetOpen = "true";
    return () => {
      delete document.documentElement.dataset.sheetOpen;
    };
  }, [overlay, onOverlayChange]);

  const q = query.trim().toLowerCase();
  const suggestions = useMemo<Suggestion[]>(() => {
    const areaItems: Suggestion[] = AREAS.map((a) => ({
      type: "area",
      label: a.name,
      sub: `카페 ${AREA_COUNT[a.key]}곳`,
      areaKey: a.key,
      group: "area",
    }));
    if (!q) {
      const recentItems: Suggestion[] = (hydrated ? recent : [])
        .filter((id) => CAFE_MAP[id])
        .slice(0, 4)
        .map((id) => ({ type: "cafe", label: CAFE_MAP[id].name, sub: CAFE_MAP[id].address, cafeId: id, group: "recent" }));
      // 최근 본 곳이 없으면 지금 조건에서 잘 맞는 곳을 대신 보여준다
      const topItems: Suggestion[] = recentItems.length
        ? []
        : rankByFit(CAFES, purpose, hour, stayMin)
            .filter((r) => r.open)
            .slice(0, 3)
            .map((r) => ({ type: "cafe", label: r.cafe.name, sub: r.cafe.address, cafeId: r.cafe.id, group: "top" }));
      return [...areaItems, ...recentItems, ...topItems];
    }
    const stationItems: Suggestion[] = AREAS.map((a) => ({ type: "station", label: a.station, sub: `${a.name} 인근`, areaKey: a.key }));
    const cafeItems: Suggestion[] = CAFES.map((c) => ({ type: "cafe", label: c.name, sub: c.address, cafeId: c.id }));
    return [...areaItems, ...stationItems, ...cafeItems]
      .filter((s) => s.label.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q))
      .slice(0, 8);
  }, [q, recent, hydrated, purpose, hour, stayMin]);

  const pick = (s: Suggestion) => {
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
    if (s.type === "cafe" && s.cafeId) onSelectCafe(s.cafeId);
    else if (s.areaKey) onSelectArea(s.areaKey);
  };

  const close = () => {
    setOpen(false);
    inputRef.current?.blur();
  };

  const showList = open && suggestions.length > 0;
  const optionId = (i: number) => `${listId}-opt-${i}`;

  /** 공통 항목 속성 — 누를 때 입력창 포커스를 잃지 않게 mousedown은 막는다 */
  const optionProps = (i: number, s: Suggestion) => ({
    id: optionId(i),
    role: "option" as const,
    "aria-selected": i === active,
    onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
    onMouseEnter: () => setActive(i),
    onClick: () => pick(s),
  });

  const cafeRow = (s: Suggestion, i: number) => {
    const cafe = CAFE_MAP[s.cafeId!];
    const score = fitScore(cafe, purpose, hour, stayMin);
    return (
      <li
        key={`cafe-${s.cafeId}-${s.group ?? ""}`}
        {...optionProps(i, s)}
        className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors ${i === active ? "bg-cream-100" : ""}`}
      >
        <CafePhoto cafe={cafe} className="h-11 w-11 shrink-0 rounded-xl" sizes="44px" overlay={false} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold text-coffee-800">{s.label}</span>
          <span className="block truncate text-meta text-coffee-400">{s.sub}</span>
        </span>
        <span
          className={`num shrink-0 rounded-lg px-2 py-1 text-label ${score >= 85 ? "bg-forest-600 text-white" : "bg-cream-200 text-coffee-800"}`}
          aria-label={`적합도 ${score}점`}
        >
          {score}
        </span>
      </li>
    );
  };

  const placeRow = (s: Suggestion, i: number) => (
    <li
      key={`${s.type}-${s.label}`}
      {...optionProps(i, s)}
      className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors ${i === active ? "bg-cream-100" : ""}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-coffee-500">
        {s.type === "area" ? <MapPin size={17} /> : <TrainFront size={17} />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-body font-semibold text-coffee-800">{s.label}</span>
        <span className="block truncate text-meta text-coffee-400">{s.sub}</span>
      </span>
    </li>
  );

  const groupTitle = (text: string, icon?: React.ReactNode) => (
    <li role="presentation" className="flex items-center gap-1.5 px-4 pb-1.5 pt-3 text-caption font-semibold text-coffee-400">
      {icon}
      {text}
    </li>
  );

  // 검색어가 없을 때: 지역은 칩으로, 카페는 사진과 함께
  const idleList = () => {
    const areas = suggestions.filter((s) => s.group === "area");
    const cafes = suggestions.map((s, i) => ({ s, i })).filter(({ s }) => s.group !== "area");
    const cafeGroup = cafes[0]?.s.group;
    return (
      <>
        {groupTitle("지역으로 보기")}
        <li role="presentation" className="px-4 pb-1">
          <ul role="group" aria-label="지역" className="flex flex-wrap gap-2">
            {areas.map((s, i) => (
              <li
                key={s.areaKey}
                {...optionProps(i, s)}
                className={`chip cursor-pointer ${i === active ? "border-coffee-700 bg-cream-100 text-coffee-900" : "chip-idle"}`}
              >
                {s.label}
                <span className="num text-caption font-medium text-coffee-400">{AREA_COUNT[s.areaKey!]}</span>
              </li>
            ))}
          </ul>
        </li>
        {cafes.length > 0 &&
          groupTitle(
            cafeGroup === "recent" ? "최근 본 카페" : `지금 ${PURPOSE_LABEL[purpose]}하기 좋은 곳`,
            cafeGroup === "recent" ? <History size={13} aria-hidden /> : <Sparkles size={13} aria-hidden />
          )}
        {cafes.map(({ s, i }) => cafeRow(s, i))}
      </>
    );
  };

  const resultList = () => (
    <>
      {suggestions.map((s, i) => (s.type === "cafe" ? cafeRow(s, i) : placeRow(s, i)))}
    </>
  );

  const empty = open && q && suggestions.length === 0;

  return (
    <div
      ref={boxRef}
      className={
        overlay
          ? "fixed inset-0 z-[75] flex flex-col bg-white animate-fade-in"
          : `relative ${className}`
      }
    >
      <div className={overlay ? "flex shrink-0 items-center gap-1.5 border-b border-cream-200 px-2 py-2" : ""}>
        {overlay && (
          <button
            type="button"
            onClick={close}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-coffee-700 hover:bg-cream-100"
            aria-label="검색 닫기"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div
          className={`flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-xl border bg-white px-3.5 transition-colors duration-200 focus-within:border-coffee-500 ${
            overlay ? "border-coffee-500" : "border-cream-300"
          }`}
        >
          <Search size={18} className="shrink-0 text-coffee-400" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              setActive(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                close();
                return;
              }
              if (!showList) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, suggestions.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const s = suggestions[active] ?? (q ? suggestions[0] : undefined);
                if (s) pick(s);
              }
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-body text-coffee-800 outline-none placeholder:text-coffee-400"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
            aria-label="지역·역·카페 검색"
            aria-keyshortcuts="/"
            enterKeyHint="search"
            data-search-input
          />
          {!query && (
            <kbd
              className="hidden h-6 min-w-6 items-center justify-center rounded-md border border-cream-300 bg-cream-50 px-1.5 text-caption font-semibold text-coffee-400 lg:inline-flex"
              title="/ 키로 바로 검색"
              aria-hidden
            >
              /
            </kbd>
          )}
          {query && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setQuery("")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-coffee-400 hover:text-coffee-700"
              aria-label="검색어 지우기"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={q ? "검색 결과" : "검색 바로가기"}
          className={
            overlay
              ? "min-h-0 flex-1 overflow-y-auto overscroll-contain py-2"
              : "absolute inset-x-0 top-full z-50 mt-2 max-h-[26rem] overflow-y-auto rounded-2xl border border-cream-300 bg-white py-1.5 shadow-card-lg animate-fade-up"
          }
        >
          {q ? resultList() : idleList()}
        </ul>
      )}
      {empty && (
        <div
          className={
            overlay
              ? "px-6 py-12 text-center text-meta text-coffee-400"
              : "absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-cream-300 bg-white px-4 py-5 text-center text-meta text-coffee-400 shadow-card-lg"
          }
        >
          <b className="mb-1 block text-body font-semibold text-coffee-700">검색 결과가 없어요</b>
          성수·강남·홍대처럼 지역 이름이나 역 이름으로 찾아보세요.
        </div>
      )}
    </div>
  );
}
