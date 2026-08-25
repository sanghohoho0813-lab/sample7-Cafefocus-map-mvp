"use client";

import { useEffect, useMemo, useState } from "react";
import type { AreaKey, FilterKey } from "@/lib/types";
import { AREAS, CAFES } from "@/lib/data/cafes";
import { applyFilters } from "@/lib/filters";
import { workScore, demoHour } from "@/lib/scoring";
import CafeCard from "@/components/CafeCard";
import FilterChips from "@/components/FilterChips";
import SearchBox from "@/components/SearchBox";
import EmptyState from "@/components/EmptyState";
import { useRouter } from "next/navigation";

export default function CafesPage() {
  const router = useRouter();
  const [area, setArea] = useState<AreaKey | null>(null);
  const [filters, setFilters] = useState<FilterKey[]>([]);
  const [hour, setHour] = useState(15);

  useEffect(() => setHour(demoHour(new Date())), []);

  const visible = useMemo(() => {
    const base = area ? CAFES.filter((c) => c.area === area) : CAFES;
    return [...applyFilters(base, filters, hour)].sort(
      (a, b) => workScore(b.metrics) - workScore(a.metrics)
    );
  }, [area, filters, hour]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 lg:px-6 lg:py-6">
        <div>
          <h1 className="text-[20px] font-bold text-coffee-800">카페 리스트</h1>
          <p className="mt-0.5 text-[13px] text-coffee-400">
            노트북 작업에 좋은 카페만 골라봤어요. 지금 {hour}시 기준이에요.
          </p>
        </div>

        <SearchBox
          onSelectArea={setArea}
          onSelectCafe={(id) => router.push(`/cafe/${id}`)}
          className="max-w-md"
        />

        {/* 지역 탭 */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <button
            onClick={() => setArea(null)}
            className={`chip ${area === null ? "chip-active" : "chip-idle"}`}
          >
            전체
          </button>
          {AREAS.map((a) => (
            <button
              key={a.key}
              onClick={() => setArea(a.key)}
              className={`chip ${area === a.key ? "chip-active" : "chip-idle"}`}
            >
              {a.name}
            </button>
          ))}
        </div>

        <FilterChips
          active={filters}
          onToggle={(k) =>
            setFilters((prev) =>
              prev.includes(k) ? prev.filter((v) => v !== k) : [...prev, k]
            )
          }
          onReset={() => setFilters([])}
        />

        {visible.length === 0 ? (
          <EmptyState
            title="조건에 맞는 카페가 아직 없어요."
            description="필터를 초기화하거나 다른 지역을 선택해 보세요."
            action={
              <button
                onClick={() => setFilters([])}
                className="rounded-full bg-coffee-700 px-4 py-2 text-[13px] font-semibold text-cream-50 transition-colors hover:bg-coffee-600"
              >
                필터 초기화
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((cafe) => (
              <CafeCard key={cafe.id} cafe={cafe} hour={hour} variant="card" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
