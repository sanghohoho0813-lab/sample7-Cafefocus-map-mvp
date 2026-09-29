"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck2, ChevronRight, RotateCcw, Star, History } from "lucide-react";
import { CAFE_MAP } from "@/lib/data/cafes";
import { PURPOSE_LABEL } from "@/lib/fit";
import { PRIORITIES, STAY_OPTIONS } from "@/lib/recommendation";
import { sortPlans, weeklyMinutes } from "@/lib/plans";
import { dateKey, formatDate, relativeDate, timeRange } from "@/lib/time";
import { reviewSummaryTags } from "@/lib/reviews";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import CafePhoto from "@/components/CafePhoto";
import EmptyState from "@/components/EmptyState";
import Sheet from "@/components/Sheet";
import SampleBridgeCTA from "@/components/SampleBridgeCTA";

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-section text-coffee-900">{children}</h2>
      {action}
    </div>
  );
}

export default function MyPage() {
  const { plans, reviews, favorites, recent, prefs, hydrated, resetDemo, showToast } = useApp();
  const now = useNow();
  const [resetOpen, setResetOpen] = useState(false);

  const today = now ? dateKey(now) : "";
  const upcoming = useMemo(
    () => sortPlans(plans.filter((p) => p.status === "planned" && (!today || p.date >= today))),
    [plans, today]
  );
  // 날짜가 지났는데 기록하지 않은 계획도 '지난 기록'에서 기록할 수 있게 한다
  const past = useMemo(
    () =>
      sortPlans(
        plans.filter((p) => p.status !== "planned" || (today && p.date < today)),
        "desc"
      ).slice(0, 6),
    [plans, today]
  );
  const minutes = weeklyMinutes(plans, now);
  const completedCount = plans.filter((p) => p.status === "completed").length;

  const stats = [
    { label: "최근 7일 작업", value: `${Math.floor(minutes / 60)}시간${minutes % 60 ? ` ${minutes % 60}분` : ""}` },
    { label: "완료한 작업", value: `${completedCount}회` },
    { label: "저장한 카페", value: `${favorites.length}곳` },
  ];

  const priorityText =
    prefs.priorities.length > 0
      ? prefs.priorities.map((k) => PRIORITIES.find((p) => p.key === k)?.label).filter(Boolean).join(", ")
      : "없음";
  const stayText = STAY_OPTIONS.find((s) => s.key === prefs.stay)?.label ?? "";

  if (!hydrated) {
    return <div className="h-full bg-cream-50" aria-busy />;
  }

  return (
    <div className="h-full overflow-y-auto bg-cream-50">
      <div className="mx-auto max-w-5xl px-4 pb-14 pt-6 sm:px-6 lg:pt-8">
        <header>
          <h1 className="text-page text-coffee-900">내 작업</h1>
          <dl className="mt-5 grid grid-cols-3 divide-x divide-cream-300 rounded-2xl border border-cream-300/80 bg-white py-4">
            {stats.map((s) => (
              <div key={s.label} className="px-3 text-center sm:px-5">
                <dt className="text-caption text-coffee-400">{s.label}</dt>
                <dd className="num mt-1 text-title text-coffee-900">{s.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
          <div className="min-w-0 space-y-10">
            {/* ---------- 예정된 작업 ---------- */}
            <section>
              <SectionTitle>예정된 작업</SectionTitle>
              {upcoming.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-cream-400 bg-white">
                  <EmptyState
                    compact
                    icon={CalendarCheck2}
                    title="아직 계획한 작업이 없어요"
                    description="지도에서 카페를 고르고 '여기서 작업하기'를 눌러보세요."
                    action={
                      <Link href="/" className="btn-primary h-11">
                        지도에서 카페 찾기
                      </Link>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-cream-200 overflow-hidden rounded-2xl border border-cream-300/80 bg-white">
                  {upcoming.map((p) => {
                    const cafe = CAFE_MAP[p.cafeId];
                    return (
                      <li key={p.id} className="flex items-center gap-3 p-4">
                        <Link href={`/plans/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3.5">
                          <CafePhoto cafe={cafe} className="h-14 w-14 shrink-0 rounded-xl" sizes="56px" overlay={false} />
                          <span className="min-w-0">
                            <span className="num block text-meta font-bold text-coffee-800">
                              {relativeDate(p.date, now)} · {timeRange(p.startHour, p.durationMin)}
                            </span>
                            <span className="block truncate text-title text-coffee-900">{cafe.name}</span>
                            <span className="block truncate text-meta text-coffee-400">
                              {PURPOSE_LABEL[p.purpose]}
                              {p.memo ? ` · ${p.memo}` : ""}
                            </span>
                          </span>
                        </Link>
                        <Link href={`/cafe/${cafe.id}/review?plan=${p.id}`} className="btn-secondary h-10 shrink-0 px-3 text-label">
                          기록하기
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* ---------- 지난 기록 ---------- */}
            <section>
              <SectionTitle>지난 기록</SectionTitle>
              {past.length === 0 ? (
                <p className="text-meta text-coffee-400">작업을 마치고 기록하면 여기에 쌓여요.</p>
              ) : (
                <ul className="divide-y divide-cream-200 overflow-hidden rounded-2xl border border-cream-300/80 bg-white">
                  {past.map((p) => {
                    const cafe = CAFE_MAP[p.cafeId];
                    const review = p.reviewId ? reviews.find((r) => r.id === p.reviewId) : undefined;
                    const overdue = p.status === "planned";
                    return (
                      <li key={p.id}>
                        <Link href={`/plans/${p.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-cream-50">
                          <span className="min-w-0 flex-1">
                            <span className="num block text-meta text-coffee-400">
                              {formatDate(p.date)} · {timeRange(p.startHour, p.durationMin)}
                            </span>
                            <span className="block truncate text-title text-coffee-900">{cafe.name}</span>
                            <span className="block truncate text-meta text-coffee-500">
                              {p.status === "cancelled"
                                ? "취소한 계획"
                                : overdue
                                  ? "기록 전 — 눌러서 체크인 남기기"
                                  : review
                                    ? reviewSummaryTags(review).join(" · ")
                                    : PURPOSE_LABEL[p.purpose]}
                            </span>
                          </span>
                          {review && (
                            <span className="num flex shrink-0 items-center gap-1 text-meta font-semibold text-coffee-800">
                              <Star size={15} className="fill-amber2-400 text-amber2-400" aria-hidden />
                              {review.rating}
                            </span>
                          )}
                          <ChevronRight size={18} className="shrink-0 text-coffee-300" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* ---------- 내 후기 ---------- */}
            <section>
              <SectionTitle>내 후기 {reviews.length > 0 && <span className="num text-coffee-400">{reviews.length}</span>}</SectionTitle>
              {reviews.length === 0 ? (
                <p className="text-meta text-coffee-400">카페 상세의 &lsquo;후기 남기기&rsquo;나 작업 기록으로 남길 수 있어요.</p>
              ) : (
                <ul className="space-y-5">
                  {reviews.slice(0, 5).map((r) => (
                    <li key={r.id}>
                      <Link href={`/cafe/${r.cafeId}`} className="text-body font-semibold text-coffee-900 underline-offset-4 hover:underline">
                        {CAFE_MAP[r.cafeId]?.name}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1.5 text-meta text-coffee-400">
                        <Star size={14} className="fill-amber2-400 text-amber2-400" aria-hidden />
                        <span className="num font-semibold text-coffee-700">{r.rating}</span>· {r.visitLabel} · {PURPOSE_LABEL[r.purpose]}
                      </p>
                      {r.text && <p className="mt-1.5 text-body text-coffee-700">{r.text}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* ---------- 보조 정보 ---------- */}
          <aside className="mt-10 space-y-10 lg:mt-0">
            <section>
              <SectionTitle
                action={
                  <Link href="/recommend" className="btn-quiet h-9 px-2 text-label">
                    다시 정하기
                  </Link>
                }
              >
                선호 작업 조건
              </SectionTitle>
              <dl className="space-y-2.5 text-body">
                <div className="flex justify-between gap-4">
                  <dt className="text-coffee-400">작업 목적</dt>
                  <dd className="font-semibold text-coffee-800">{PURPOSE_LABEL[prefs.purpose]}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-coffee-400">중요한 조건</dt>
                  <dd className="text-right font-semibold text-coffee-800">{priorityText}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-coffee-400">머무는 시간</dt>
                  <dd className="font-semibold text-coffee-800">{stayText}</dd>
                </div>
              </dl>
              <p className="mt-3 text-caption text-coffee-400">지도·추천의 적합도가 이 목적 기준으로 계산돼요.</p>
            </section>

            <section>
              <SectionTitle>최근 본 카페</SectionTitle>
              {recent.length === 0 ? (
                <p className="flex items-center gap-2 text-meta text-coffee-400">
                  <History size={15} /> 아직 둘러본 카페가 없어요.
                </p>
              ) : (
                <ul className="space-y-3">
                  {recent.slice(0, 5).map((id) => {
                    const cafe = CAFE_MAP[id];
                    if (!cafe) return null;
                    return (
                      <li key={id}>
                        <Link href={`/cafe/${id}`} className="flex items-center gap-3 rounded-xl transition-colors hover:bg-white">
                          <CafePhoto cafe={cafe} className="h-11 w-11 shrink-0 rounded-lg" sizes="44px" overlay={false} />
                          <span className="min-w-0 flex-1 truncate text-body font-semibold text-coffee-800">{cafe.name}</span>
                          <ChevronRight size={17} className="shrink-0 text-coffee-300" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section>
              <SectionTitle>데모 설정</SectionTitle>
              <p className="text-meta text-coffee-500">
                이 샘플은 데이터를 이 브라우저에만 저장해요. 처음 상태로 되돌려 다시 체험할 수 있어요.
              </p>
              <button type="button" onClick={() => setResetOpen(true)} className="btn-secondary mt-3 h-11 w-full">
                <RotateCcw size={16} />
                데모 데이터 초기화
              </button>
            </section>
          </aside>
        </div>

        <SampleBridgeCTA className="mt-14" />
      </div>

      <Sheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="데모 데이터를 초기화할까요?"
        description="저장·비교·작업 계획·후기가 샘플 계정 상태로 돌아가요."
        footer={
          <>
            <button type="button" onClick={() => setResetOpen(false)} className="btn-secondary flex-1">
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                resetDemo();
                setResetOpen(false);
                showToast("샘플 계정 상태로 되돌렸어요");
              }}
              className="btn-primary flex-1"
            >
              초기화
            </button>
          </>
        }
      />
    </div>
  );
}
