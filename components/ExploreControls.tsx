"use client";

import { useState } from "react";
import { ChevronDown, Clock3, Laptop, MapPin, SlidersHorizontal, Check, RotateCcw } from "lucide-react";
import type { AreaKey, FilterKey, Purpose } from "@/lib/types";
import { AREAS } from "@/lib/data/cafes";
import { ESSENTIAL_FILTERS, FILTER_HINT, FILTER_LABEL, MORE_FILTERS } from "@/lib/filters";
import { PURPOSES } from "@/lib/fit";
import { DATA_HOURS, timeSelLabel } from "@/lib/time";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import SearchBox from "@/components/SearchBox";
import Sheet from "@/components/Sheet";

/** 네이티브 select를 알약 모양으로 — 모바일에서는 OS 선택기가 뜨고, 스크롤 영역에 잘리지 않는다 */
function SelectPill({
  icon: Icon,
  label,
  value,
  onChange,
  children,
  emphasized = false,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <label
      className={`chip relative pr-8 ${emphasized ? "border-coffee-500 bg-coffee-50 text-coffee-900" : "chip-idle"}`}
    >
      <Icon size={16} className="shrink-0 text-coffee-500" aria-hidden />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="cursor-pointer appearance-none bg-transparent font-semibold outline-none"
      >
        {children}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 text-coffee-400" aria-hidden />
    </label>
  );
}

export default function ExploreControls({
  resultCount,
  onSelectCafe,
  onAreaChange,
}: {
  resultCount: number;
  onSelectCafe: (id: string) => void;
  onAreaChange: () => void;
}) {
  const { area, setArea, filters, toggleFilter, setFilters, prefs, setPurpose, timeSel, setTimeSel } = useApp();
  const now = useNow();
  const [sheetOpen, setSheetOpen] = useState(false);

  const moreCount = filters.filter((f) => MORE_FILTERS.includes(f)).length;

  const changeArea = (a: AreaKey | null) => {
    setArea(a);
    onAreaChange();
  };

  return (
    <div className="z-40 shrink-0 space-y-2.5 border-b border-cream-300/70 bg-cream-50 px-4 pb-3 pt-3 lg:px-5">
      <div className="flex items-center gap-2">
        <SearchBox onSelectArea={(k) => changeArea(k)} onSelectCafe={onSelectCafe} className="min-w-0 flex-1 lg:max-w-md" />
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={`btn h-12 shrink-0 border px-3.5 lg:px-4 ${
            filters.length ? "border-coffee-800 bg-coffee-800 text-cream-50" : "border-cream-300 bg-white text-coffee-700 hover:border-coffee-300"
          }`}
          aria-label={`필터${filters.length ? ` ${filters.length}개 적용됨` : ""}`}
        >
          <SlidersHorizontal size={17} />
          <span className="hidden sm:inline">필터</span>
          {filters.length > 0 && <span className="num">{filters.length}</span>}
        </button>
      </div>

      <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="group" aria-label="탐색 조건">
        <SelectPill
          icon={MapPin}
          label="지역"
          value={area ?? "all"}
          onChange={(v) => changeArea(v === "all" ? null : (v as AreaKey))}
          emphasized={area !== null}
        >
          <option value="all">모든 지역</option>
          {AREAS.map((a) => (
            <option key={a.key} value={a.key}>
              {a.name}
            </option>
          ))}
        </SelectPill>
        <SelectPill icon={Laptop} label="작업 목적" value={prefs.purpose} onChange={(v) => setPurpose(v as Purpose)}>
          {PURPOSES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </SelectPill>
        <SelectPill
          icon={Clock3}
          label="기준 시간"
          value={String(timeSel)}
          onChange={(v) => setTimeSel(v === "now" ? "now" : Number(v))}
          emphasized={timeSel !== "now"}
        >
          <option value="now">{timeSelLabel("now", now)}</option>
          {DATA_HOURS.map((h) => (
            <option key={h} value={h}>
              {h}시 기준
            </option>
          ))}
        </SelectPill>

        <span className="mx-0.5 h-6 w-px shrink-0 bg-cream-300" aria-hidden />

        {ESSENTIAL_FILTERS.map((key) => {
          const on = filters.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleFilter(key)}
              className={`chip ${on ? "chip-active" : "chip-idle"}`}
              aria-pressed={on}
            >
              {on && <Check size={15} strokeWidth={2.6} />}
              {FILTER_LABEL[key]}
            </button>
          );
        })}
        {moreCount > 0 && (
          <button type="button" onClick={() => setSheetOpen(true)} className="chip chip-active">
            +{moreCount}개 조건
          </button>
        )}
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="필터"
        description="선택한 조건을 모두 만족하는 카페만 보여드려요."
        footer={
          <>
            <button
              type="button"
              onClick={() => setFilters([])}
              disabled={!filters.length}
              className="btn-secondary flex-1"
            >
              <RotateCcw size={16} />
              초기화
            </button>
            <button type="button" onClick={() => setSheetOpen(false)} className="btn-primary flex-[2]">
              <span className="num">{resultCount}곳 보기</span>
            </button>
          </>
        }
      >
        <ul className="divide-y divide-cream-200">
          {([...ESSENTIAL_FILTERS, ...MORE_FILTERS] as FilterKey[]).map((key) => {
            const on = filters.includes(key);
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => toggleFilter(key)}
                  className="flex w-full items-center gap-3 py-3.5 text-left"
                  aria-pressed={on}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      on ? "border-coffee-800 bg-coffee-800 text-white" : "border-cream-400 bg-white"
                    }`}
                    aria-hidden
                  >
                    {on && <Check size={15} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-body font-semibold text-coffee-900">{FILTER_LABEL[key]}</span>
                    <span className="block text-meta text-coffee-400">{FILTER_HINT[key]}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </div>
  );
}
