"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, CalendarX2, AlertCircle, Star, Clock3, CalendarCheck2 } from "lucide-react";
import { CAFE_MAP } from "@/lib/data/cafes";
import { hourlyAt, levelOf, CROWD_LABEL } from "@/lib/scoring";
import { calmestHour, fitCaution, fitScore, PURPOSE_LABEL } from "@/lib/fit";
import { dateWithRelative, formatDate, formatDuration, timeRange } from "@/lib/time";
import { reviewSummaryTags } from "@/lib/reviews";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import CafePhoto from "@/components/CafePhoto";
import ScorePill from "@/components/ScorePill";
import EmptyState from "@/components/EmptyState";
import Sheet from "@/components/Sheet";
import SampleBridgeCTA from "@/components/SampleBridgeCTA";

export default function PlanView() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const now = useNow();
  const { plans, reviews, hydrated, cancelPlan } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center" aria-busy>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-300 border-t-coffee-700" />
      </div>
    );
  }

  const plan = plans.find((p) => p.id === id);
  const cafe = plan ? CAFE_MAP[plan.cafeId] : null;

  if (!plan || !cafe) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={CalendarX2}
          title="작업 계획을 찾을 수 없어요"
          description="이 브라우저에 저장된 계획이 아니거나, 데모 초기화로 지워졌을 수 있어요."
          action={
            <Link href="/my" className="btn-primary h-11">
              내 작업으로 가기
            </Link>
          }
        />
      </div>
    );
  }

  const isNew = search.get("new") === "1" && plan.status === "planned";
  const review = plan.reviewId ? reviews.find((r) => r.id === plan.reviewId) : undefined;
  const score = fitScore(cafe, plan.purpose, plan.startHour);
  const startCrowd = CROWD_LABEL[levelOf(hourlyAt(cafe, plan.startHour).crowd)];
  const caution = fitCaution(cafe, plan.startHour);
  const calm = calmestHour(cafe);

  const header = isNew
    ? { icon: CheckCircle2, tone: "text-forest-600", title: "작업 계획을 저장했어요", sub: "내 작업에서 언제든 다시 볼 수 있어요." }
    : plan.status === "completed"
      ? { icon: CheckCircle2, tone: "text-forest-600", title: "작업을 마쳤어요", sub: "남겨주신 체크인은 카페 후기에 반영됐어요." }
      : plan.status === "cancelled"
        ? { icon: CalendarX2, tone: "text-coffee-400", title: "취소한 계획이에요", sub: "같은 카페로 다시 계획할 수 있어요." }
        : { icon: CalendarCheck2, tone: "text-coffee-700", title: "작업 예정", sub: "작업을 마치면 환경 체크인을 남겨주세요." };
  const HeaderIcon = header.icon;

  const doCancel = () => {
    cancelPlan(plan.id);
    setConfirmOpen(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-cream-50">
      <div className="flex h-14 items-center gap-2 border-b border-cream-300/70 bg-white px-2 lg:px-6">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/my"))}
          className="flex h-10 w-10 items-center justify-center rounded-full text-coffee-700 hover:bg-cream-100"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-title text-coffee-900">작업 일정</span>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-12 pt-8 sm:px-6">
        {/* ---------- 결론 ---------- */}
        <div className="text-center">
          <HeaderIcon size={44} strokeWidth={1.8} className={`mx-auto ${header.tone}`} />
          <h1 className="mt-3 text-page text-coffee-900">{header.title}</h1>
          <p className="mt-1.5 text-body text-coffee-500">{header.sub}</p>
        </div>

        {/* ---------- 일정 ---------- */}
        <article className={`mt-8 overflow-hidden rounded-2xl border border-cream-300/80 bg-white ${plan.status === "cancelled" ? "opacity-70" : ""}`}>
          <div className="flex gap-4 p-5">
            <CafePhoto cafe={cafe} className="h-20 w-20 shrink-0 rounded-xl" sizes="80px" overlay={false} />
            <div className="min-w-0 flex-1">
              <Link href={`/cafe/${cafe.id}`} className="text-title text-coffee-900 underline-offset-4 hover:underline">
                {cafe.name}
              </Link>
              <p className="num mt-1 text-body font-semibold text-coffee-800">
                {dateWithRelative(plan.date, now)}
              </p>
              <p className="num text-meta text-coffee-500">
                {timeRange(plan.startHour, plan.durationMin)} ({formatDuration(plan.durationMin)}) · {PURPOSE_LABEL[plan.purpose]}
              </p>
              {plan.memo && <p className="mt-1.5 text-meta text-coffee-600">“{plan.memo}”</p>}
            </div>
          </div>

          {plan.status === "planned" && (
            <div className="space-y-2.5 border-t border-cream-200 bg-cream-50/60 px-5 py-4">
              <p className="text-label text-coffee-500">도착 전에 알아두세요</p>
              <div className="flex items-center gap-3">
                <ScorePill score={score} />
                <p className="text-meta text-coffee-700">
                  <span className="num">{plan.startHour}시</span> 도착 시 {startCrowd}
                </p>
              </div>
              {caution && (
                <p className="flex items-center gap-2 text-meta font-medium text-amber2-500">
                  <AlertCircle size={15} className="shrink-0" />
                  {caution}
                </p>
              )}
              <p className="flex items-center gap-2 text-meta text-coffee-500">
                <Clock3 size={15} className="shrink-0" />
                가장 한산한 시간은 <span className="num font-semibold text-coffee-700">{calm}시</span>예요 · 데모 예측값
              </p>
            </div>
          )}

          {plan.status === "completed" && review && (
            <div className="border-t border-cream-200 px-5 py-4">
              <p className="flex items-center gap-1.5 text-body font-semibold text-coffee-800">
                <Star size={16} className="fill-amber2-400 text-amber2-400" aria-hidden />
                <span className="num">{review.rating}.0</span>
                <span className="text-meta font-normal text-coffee-400">· 내 체크인</span>
              </p>
              <p className="mt-1 text-meta text-coffee-500">{reviewSummaryTags(review).join(" · ")}</p>
              {review.text && <p className="mt-2 text-body text-coffee-700">{review.text}</p>}
            </div>
          )}
        </article>

        {/* ---------- 다음 행동: 상태별 주 행동 하나 ---------- */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          {isNew && (
            <>
              <Link href="/my" className="btn-primary sm:flex-1">
                내 작업 일정 보기
              </Link>
              <Link href="/" className="btn-secondary sm:flex-1">
                지도로 돌아가기
              </Link>
            </>
          )}
          {!isNew && plan.status === "planned" && (
            <>
              <Link href={`/cafe/${cafe.id}/review?plan=${plan.id}`} className="btn-primary sm:flex-1">
                다녀왔어요 · 작업 기록하기
              </Link>
              <Link href={`/cafe/${cafe.id}`} className="btn-secondary sm:flex-1">
                카페 정보 보기
              </Link>
            </>
          )}
          {(plan.status === "completed" || plan.status === "cancelled") && (
            <>
              <Link href={`/cafe/${cafe.id}/plan`} className="btn-primary sm:flex-1">
                여기서 다시 작업하기
              </Link>
              <Link href="/my" className="btn-secondary sm:flex-1">
                내 작업으로
              </Link>
            </>
          )}
        </div>

        {plan.status === "planned" && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4">
            {isNew && (
              <Link href={`/cafe/${cafe.id}/review?plan=${plan.id}`} className="btn-quiet text-label">
                작업을 마쳤다면 기록하기
              </Link>
            )}
            <button type="button" onClick={() => setConfirmOpen(true)} className="btn-quiet text-label text-coffee-400">
              계획 취소
            </button>
          </div>
        )}

        {/* 핵심 흐름을 마친 뒤에만 제작사 제안을 보여준다 */}
        {(isNew || plan.status === "completed") && <SampleBridgeCTA className="mt-12" />}
      </div>

      <Sheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="작업 계획을 취소할까요?"
        description={`${cafe.name} · ${formatDate(plan.date)} ${timeRange(plan.startHour, plan.durationMin)}`}
        footer={
          <>
            <button type="button" onClick={() => setConfirmOpen(false)} className="btn-secondary flex-1">
              유지하기
            </button>
            <button type="button" onClick={doCancel} className="btn h-12 flex-1 bg-red-600 px-5 text-white hover:bg-red-700">
              계획 취소
            </button>
          </>
        }
      />
    </div>
  );
}
