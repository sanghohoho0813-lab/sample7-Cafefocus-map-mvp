"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Heart,
  History,
  MessageSquare,
  Settings,
  ChevronRight,
  Laptop,
  Volume2,
  Plug,
} from "lucide-react";
import { CAFES } from "@/lib/data/cafes";
import { demoHour, workScore } from "@/lib/scoring";
import CafeCard from "@/components/CafeCard";
import EmptyState from "@/components/EmptyState";
import MetricBadge from "@/components/MetricBadge";
import BrandCredit from "@/components/BrandCredit";
import { useApp } from "@/lib/store";

export default function MyPage() {
  const { favorites, recent, hydrated, showToast } = useApp();
  const [hour, setHour] = useState(15);
  useEffect(() => setHour(demoHour(new Date())), []);

  const favCafes = CAFES.filter((c) => favorites.includes(c.id));
  const recentCafes = recent
    .map((id) => CAFES.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-4 pb-10 lg:px-6 lg:py-6">
        {/* 프로필 */}
        <section className="flex items-center gap-4 rounded-3xl border border-cream-200 bg-white p-5 shadow-card">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-coffee-700 text-cream-100">
            <User size={30} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-bold text-coffee-800">카페 노마드</h1>
            <p className="text-[16.5px] text-coffee-400">
              저장 {hydrated ? favorites.length : 0} · 최근 본 카페{" "}
              {hydrated ? recentCafes.length : 0} · 이번 주 집중 24.5h
            </p>
          </div>
          <button
            onClick={() => showToast("설정은 데모에서 준비 중이에요.")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-300 text-coffee-500 transition-colors hover:border-coffee-300"
            aria-label="설정"
          >
            <Settings size={20} />
          </button>
        </section>

        {/* 선호 작업환경 */}
        <section className="rounded-3xl border border-cream-200 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-[19px] font-bold text-coffee-800">
            <Laptop size={19} className="text-coffee-500" />
            선호 작업환경
          </h2>
          <p className="mt-1 text-[15.5px] text-coffee-400">
            추천에 반영되는 기본 조건이에요.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <MetricBadge label="집중 작업 위주" tone="green" />
            <MetricBadge label="조용함 중요" tone="green" />
            <MetricBadge label="콘센트 필수" tone="green" />
            <MetricBadge label="2시간 이상 체류" />
            <MetricBadge label="주 활동지: 성수" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[15.5px] text-coffee-500 sm:grid-cols-3">
            <span className="flex items-center gap-1.5 rounded-xl bg-cream-100 px-3 py-2">
              <Volume2 size={16.5} className="text-forest-600" /> 소음 가중 35%
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-cream-100 px-3 py-2">
              <Plug size={16.5} className="text-forest-600" /> 콘센트 가중 20%
            </span>
            <span className="hidden items-center gap-1.5 rounded-xl bg-cream-100 px-3 py-2 sm:flex">
              <Laptop size={16.5} className="text-forest-600" /> Wi-Fi 가중 20%
            </span>
          </div>
        </section>

        {/* 저장한 카페 */}
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[19px] font-bold text-coffee-800">
              <Heart size={19} className="text-red-400" />
              저장한 카페 {hydrated && favCafes.length > 0 && `(${favCafes.length})`}
            </h2>
            {hydrated && favCafes.length > 0 && (
              <Link
                href="/favorites"
                className="flex items-center text-[16.5px] font-semibold text-coffee-400 transition-colors hover:text-coffee-700"
              >
                전체보기 <ChevronRight size={16.5} />
              </Link>
            )}
          </div>
          {hydrated && favCafes.length === 0 ? (
            <div className="rounded-3xl border border-cream-200 bg-white shadow-card">
              <EmptyState
                icon={Heart}
                title="마음에 드는 작업 카페를 저장해보세요."
                action={
                  <Link
                    href="/"
                    className="rounded-full bg-coffee-700 px-4 py-2 text-[17px] font-semibold text-cream-50"
                  >
                    지도에서 찾기
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {favCafes.slice(0, 3).map((c) => (
                <CafeCard key={c.id} cafe={c} hour={hour} variant="row" />
              ))}
            </div>
          )}
        </section>

        {/* 최근 본 카페 */}
        <section>
          <h2 className="mb-2.5 flex items-center gap-2 text-[19px] font-bold text-coffee-800">
            <History size={19} className="text-coffee-500" />
            최근 본 카페
          </h2>
          {hydrated && recentCafes.length === 0 ? (
            <div className="rounded-3xl border border-cream-200 bg-white shadow-card">
              <EmptyState
                icon={History}
                title="아직 둘러본 카페가 없어요."
                description="지도에서 마커를 눌러 카페를 살펴보세요."
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentCafes.map((c) => (
                <CafeCard key={c.id} cafe={c} hour={hour} variant="row" />
              ))}
            </div>
          )}
        </section>

        {/* 작성한 후기 */}
        <section className="rounded-3xl border border-cream-200 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-[19px] font-bold text-coffee-800">
            <MessageSquare size={19} className="text-coffee-500" />
            작성한 후기
          </h2>
          <div className="mt-3 rounded-2xl bg-cream-100 p-4">
            <div className="flex items-center justify-between text-[15px] text-coffee-400">
              <span>Workroom 17 · 평일 오전 · 집중 작업 · 3시간 체류</span>
              <span>★ 5</span>
            </div>
            <p className="mt-1.5 text-[17px] leading-relaxed text-coffee-600">
              평일 오전엔 거의 도서관 수준으로 조용해요. 콘센트 걱정 없이 반나절 작업하기 최고입니다.
            </p>
          </div>
          <button
            onClick={() => showToast("리뷰 작성은 데모에서 준비 중이에요.")}
            className="mt-3 w-full rounded-xl border border-cream-300 py-2.5 text-[17px] font-semibold text-coffee-600 transition-colors hover:border-coffee-300 hover:bg-cream-50"
          >
            새 후기 작성하기
          </button>
        </section>

        {/* 제작사 */}
        <footer className="flex flex-col items-center gap-2 border-t border-cream-200 pt-6 text-center">
          <BrandCredit label="" />
          <p className="text-[14px] leading-relaxed text-coffee-400">
            CafeFocus는 미래에이아이랩이 만든
            <br className="sm:hidden" /> 작업환경 데이터 서비스 MVP입니다.
          </p>
        </footer>
      </div>
    </div>
  );
}
