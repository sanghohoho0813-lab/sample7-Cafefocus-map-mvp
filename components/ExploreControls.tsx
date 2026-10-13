"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal, Check, RotateCcw, X } from "lucide-react";
import type { AreaKey, FilterKey, Purpose } from "@/lib/types";
import { AREAS, AREA_MAP } from "@/lib/data/cafes";
import { ESSENTIAL_FILTERS, FILTER_HINT, FILTER_LABEL, MORE_FILTERS } from "@/lib/filters";
import { PURPOSES, PURPOSE_LABEL } from "@/lib/fit";
import { DATA_HOURS, effectiveHour, isLiveHour, pad2 } from "@/lib/time";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import SearchBox from "@/components/SearchBox";
import Sheet from "@/components/Sheet";

/**
 * 질문 막대의 한 칸: 작은 질문("어디서") + 굵은 답("성수").
 * 네이티브 select를 칸 전체에 투명하게 덮어, 모바일에선 OS 선택기가 뜨고 키보드로도 고를 수 있다.
 */
function BarSelect({
  caption,
  label,
  display,
  value,
  onChange,
  changed,
  children,
}: {
  caption: string;
  label: string;
  display: string;
  value: string;
  onChange: (v: string) => void;
  /** 기본값에서 바뀌었는지 — 바뀐 칸만 살짝 강조 */
  changed: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="relative flex min-w-0 cursor-pointer flex-col justify-center px-2.5 py-1.5 transition-colors first:rounded-l-2xl last:rounded-r-2xl focus-within:bg-cream-100 hover:bg-cream-50 sm:px-4">
      <span className="text-caption text-coffee-400">{caption}</span>
      <span className={`flex min-w-0 items-center gap-1 text-label ${changed ? "text-coffee-900" : "text-coffee-700"}`}>
        <span className="truncate">{display}</span>
        <ChevronDown size={14} className="ml-auto shrink-0 text-coffee-400" aria-hidden />
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {children}
      </select>
    </label>
  );
}

/**
 * 지도 첫 화면의 조작부.
 * "지금 어디로 가면 좋은가?"에 필요한 세 가지(어디서 · 무엇을 · 언제)만 앞에 두고,
 * 세부 조건은 '조건' 시트에서 필요할 때만 더한다. 더한 조건은 바로 지울 수 있는 칩으로 보인다.
 */
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

  const changeArea = (a: AreaKey | null) => {
    setArea(a);
    onAreaChange();
  };

  const nowText = now ? `지금 ${pad2(now.getHours())}:${pad2(now.getMinutes())}` : "지금";
  // 새벽·심야엔 "지금" 대신 실제 계산 기준(가장 가까운 데이터 시간)을 그대로 보여준다
  const offHours = timeSel === "now" && now !== null && !isLiveHour(now);
  const nowDisplay = offHours ? `${effectiveHour("now", now)}시 기준` : "지금";

  return (
    <div className="z-40 shrink-0 space-y-2 border-b border-cream-300/70 bg-cream-50 px-4 pb-3 pt-3 lg:px-5">
      <div className="flex items-center gap-2">
        <SearchBox onSelectArea={(k) => changeArea(k)} onSelectCafe={onSelectCafe} className="min-w-0 flex-1 lg:max-w-md" />
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={`btn h-12 shrink-0 border px-3.5 lg:px-4 ${
            filters.length ? "border-coffee-800 bg-coffee-800 text-cream-50" : "border-cream-300 bg-white text-coffee-700 hover:border-coffee-300"
          }`}
          aria-label={`조건${filters.length ? ` ${filters.length}개 적용됨` : " 더하기"}`}
        >
          <SlidersHorizontal size={17} />
          <span className="hidden sm:inline">조건</span>
          {filters.length > 0 && <span className="num">{filters.length}</span>}
        </button>
      </div>

      {/* 어디서 · 무엇을 · 언제 */}
      <div
        className="grid grid-cols-3 divide-x divide-cream-300 rounded-2xl border border-cream-300 bg-white lg:max-w-2xl"
        role="group"
        aria-label="어디서 · 무엇을 · 언제"
      >
        <BarSelect
          caption="어디서"
          label="지역"
          display={area ? AREA_MAP[area].name : "모든 지역"}
          value={area ?? "all"}
          onChange={(v) => changeArea(v === "all" ? null : (v as AreaKey))}
          changed={area !== null}
        >
          <option value="all">모든 지역</option>
          {AREAS.map((a) => (
            <option key={a.key} value={a.key}>
              {a.name}
            </option>
          ))}
        </BarSelect>
        <BarSelect
          caption="무엇을"
          label="작업 목적"
          display={PURPOSE_LABEL[prefs.purpose]}
          value={prefs.purpose}
          onChange={(v) => setPurpose(v as Purpose)}
          changed={false}
        >
          {PURPOSES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </BarSelect>
        <BarSelect
          caption={timeSel === "now" && now ? `언제 · ${pad2(now.getHours())}:${pad2(now.getMinutes())}` : "언제"}
          label="갈 시간"
          display={timeSel === "now" ? nowDisplay : `${timeSel}시 도착`}
          value={String(timeSel)}
          onChange={(v) => setTimeSel(v === "now" ? "now" : Number(v))}
          changed={timeSel !== "now"}
        >
          <option value="now">{offHours ? `${nowText} (${nowDisplay})` : nowText}</option>
          {DATA_HOURS.map((h) => (
            <option key={h} value={h}>
              {h}시 도착
            </option>
          ))}
        </BarSelect>
      </div>

      {/* 더한 조건만 보인다 — 바로 지울 수 있게 */}
      {filters.length > 0 && (
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0" aria-label="적용한 조건">
          {filters.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleFilter(key)}
              className="chip chip-active h-8 gap-1 px-3 text-caption"
              aria-label={`${FILTER_LABEL[key]} 조건 빼기`}
            >
              {FILTER_LABEL[key]}
              <X size={13} strokeWidth={2.6} aria-hidden />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFilters([])}
            className="h-8 shrink-0 px-2 text-caption font-semibold text-coffee-500 underline-offset-4 hover:underline"
          >
            모두 지우기
          </button>
        </div>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="조건 더하기"
        description="필요할 때만 더하세요. 고른 조건을 모두 만족하는 곳만 보여드려요."
        footer={
          <>
            <button type="button" onClick={() => setFilters([])} disabled={!filters.length} className="btn-secondary flex-1">
              <RotateCcw size={16} />
              초기화
            </button>
            <button type="button" onClick={() => setSheetOpen(false)} className="btn-primary flex-[2]">
              <span className="num">{resultCount}곳 보기</span>
            </button>
          </>
        }
      >
        {[
          { title: "자주 쓰는 조건", keys: ESSENTIAL_FILTERS },
          { title: "더 꼼꼼하게", keys: MORE_FILTERS },
        ].map((group) => (
          <section key={group.title} className="mb-2">
            <h3 className="pb-1 pt-2 text-caption font-semibold text-coffee-400">{group.title}</h3>
            <ul className="divide-y divide-cream-200">
              {(group.keys as FilterKey[]).map((key) => {
                const on = filters.includes(key);
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => toggleFilter(key)}
                      className="flex w-full items-center gap-3 py-3 text-left"
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
          </section>
        ))}
      </Sheet>
    </div>
  );
}
