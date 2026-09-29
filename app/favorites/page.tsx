"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { CAFES } from "@/lib/data/cafes";
import { rankByFit, PURPOSE_LABEL } from "@/lib/fit";
import { useApp } from "@/lib/store";
import { useFitContext } from "@/lib/useFitContext";
import CafeCard from "@/components/CafeCard";
import CompareToggle from "@/components/CompareToggle";
import EmptyState from "@/components/EmptyState";

export default function FavoritesPage() {
  const { favorites, compare, hydrated } = useApp();
  const { purpose, hour, now, timeLabel } = useFitContext();

  const saved = rankByFit(
    CAFES.filter((c) => favorites.includes(c.id)),
    purpose,
    hour
  );
  const canCompare = compare.length >= 2;

  return (
    <div className="flex h-full flex-col bg-cream-50">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:pt-8">
          <header className="mb-6">
            <h1 className="text-page text-coffee-900">저장한 카페</h1>
            <p className="mt-1 text-meta text-coffee-400">
              {PURPOSE_LABEL[purpose]} · {timeLabel.replace(" 기준", "")} 기준 적합도순 · 2~3곳을 담아 비교해 보세요
            </p>
          </header>

          {!hydrated ? null : saved.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-cream-400 bg-white">
              <EmptyState
                icon={Heart}
                title="마음에 드는 작업 카페를 저장해보세요"
                description="지도나 카페 상세에서 하트를 누르면 여기에 모여요."
                action={
                  <Link href="/" className="btn-primary h-11">
                    지도에서 카페 찾기
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {saved.map(({ cafe }) => (
                <CafeCard
                  key={cafe.id}
                  cafe={cafe}
                  purpose={purpose}
                  hour={hour}
                  now={now}
                  variant="tile"
                  highlighted={compare.includes(cafe.id)}
                  footer={<CompareToggle cafeId={cafe.id} className="-ml-3" />}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 비교함이 채워지면 다음 행동을 하단에 고정 */}
      {hydrated && compare.length > 0 && (
        <div className="shrink-0 border-t border-cream-300/70 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <p className="text-meta text-coffee-600">
              비교함 <b className="num text-coffee-900">{compare.length}</b>/3
              {!canCompare && <span className="text-coffee-400"> · 1곳 더 담아주세요</span>}
            </p>
            {canCompare ? (
              <Link href="/compare" className="btn-primary h-11">
                {compare.length}곳 비교하기
                <ArrowRight size={16} />
              </Link>
            ) : (
              <span className="btn-primary h-11 cursor-not-allowed opacity-40" aria-disabled>
                비교하기
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
