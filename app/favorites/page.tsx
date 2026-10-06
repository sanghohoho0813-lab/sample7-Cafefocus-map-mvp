"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { CAFES } from "@/lib/data/cafes";
import { rankByFit, PURPOSE_LABEL } from "@/lib/fit";
import { useApp } from "@/lib/store";
import { useFitContext } from "@/lib/useFitContext";
import CafeCard from "@/components/CafeCard";
import CompareToggle from "@/components/CompareToggle";

export default function FavoritesPage() {
  const { favorites, compare, hydrated } = useApp();
  const { purpose, hour, now, timeLabel } = useFitContext();

  const saved = rankByFit(
    CAFES.filter((c) => favorites.includes(c.id)),
    purpose,
    hour
  );
  const canCompare = compare.length >= 2;
  const suggestions = saved.length === 0 ? rankByFit(CAFES, purpose, hour).slice(0, 3) : [];

  return (
    <div className="flex h-full flex-col bg-cream-50">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 lg:pt-8">
          <header className="mb-6">
            <h1 className="text-page text-coffee-900">저장한 카페</h1>
            {hydrated && saved.length > 0 && (
              <p className="mt-1 text-meta text-coffee-400">
                {PURPOSE_LABEL[purpose]} · {timeLabel.replace(" 기준", "")} 기준 적합도순
                {saved.length >= 2 ? " · 2~3곳을 담아 비교해 보세요" : ""}
              </p>
            )}
          </header>

          {!hydrated ? null : saved.length === 0 ? (
            <>
              <div className="flex flex-col gap-4 rounded-2xl border border-cream-300/80 bg-white p-5 sm:flex-row sm:items-center">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-100 text-coffee-500" aria-hidden>
                  <Heart size={20} />
                </span>
                <p className="min-w-0 flex-1 text-meta text-coffee-500">
                  <b className="block text-title text-coffee-900">아직 저장한 카페가 없어요</b>
                  하트를 누르면 여기에 모이고, 2~3곳을 골라 비교할 수 있어요.
                </p>
                <Link href="/" className="btn-secondary h-11 shrink-0">
                  지도에서 찾기
                </Link>
              </div>

              {/* 빈 화면에서 바로 시작할 수 있게 — 지금 기준 상위 카페를 바로 저장 */}
              <div className="mb-3 mt-10">
                <h2 className="text-section text-coffee-900">{PURPOSE_LABEL[purpose]}하기 좋은 곳</h2>
                <p className="mt-0.5 text-meta text-coffee-400">{timeLabel} · 하트를 눌러 바로 저장해 보세요</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map(({ cafe }) => (
                  <CafeCard key={cafe.id} cafe={cafe} purpose={purpose} hour={hour} now={now} variant="tile" />
                ))}
              </div>
            </>
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
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
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
