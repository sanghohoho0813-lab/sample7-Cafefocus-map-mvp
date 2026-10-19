"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, CalendarX2, AlertCircle, Star, Clock3, CalendarCheck2, Check, MapPin } from "lucide-react";
import { AREA_MAP, CAFE_MAP } from "@/lib/data/cafes";
import { bestHour, explainFit, PURPOSE_LABEL } from "@/lib/fit";
import { buildExploreQuery } from "@/lib/exploreQuery";
import { dateKey, formatDate, formatDuration, hm, relativeDate, timeRange } from "@/lib/time";
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
  // 계획한 시간·머무는 시간 그대로 판단 — 상세·지도와 같은 계산
  const ex = explainFit(cafe, plan.purpose, plan.startHour, { stayMin: plan.durationMin, timeWord: `${plan.startHour}시` });
  const best = bestHour(cafe, plan.purpose, undefined, plan.durationMin);
  const mapHref = `/${buildExploreQuery(
    {
      area: cafe.area,
      purpose: plan.purpose,
      // 오늘 지금 시간대의 계획이면 '지금' 기준 그대로, 아니면 계획한 도착 시간 기준으로 지도를 연다
      time: now && plan.date === dateKey(now) && plan.startHour === now.getHours() ? "now" : plan.startHour,
      filters: [],
      cafe: cafe.id,
    },
    { explicit: true }
  )}`;

  const header = isNew
    ? { icon: CheckCircle2, tone: "bg-forest-50 text-forest-600", title: "작업 계획을 저장했어요", sub: "내 작업에서 언제든 다시 볼 수 있어요." }
    : plan.status === "completed"
      ? { icon: CheckCircle2, tone: "bg-forest-50 text-forest-600", title: "작업을 마쳤어요", sub: "남겨주신 체크인은 카페 후기에 반영됐어요." }
      : plan.status === "cancelled"
        ? { icon: CalendarX2, tone: "bg-cream-200 text-coffee-400", title: "취소한 계획이에요", sub: "같은 카페로 다시 계획할 수 있어요." }
        : { icon: CalendarCheck2, tone: "bg-cream-200 text-coffee-700", title: "작업 예정", sub: "작업을 마치면 환경 체크인을 남겨주세요." };
  const HeaderIcon = header.icon;

  // 진행 단계: 계획 → 작업 → 체크인 (취소한 계획은 단계 대신 상태만)
  const done = plan.status === "completed";
  // "오늘 / 10월 13일 (화)"처럼 상대 표기가 있을 때만 두 줄로 — 같은 날짜를 두 번 쓰지 않는다
  const dayRel = relativeDate(plan.date, now);
  const dayFull = formatDate(plan.date);
  const steps = [
    { label: "계획 저장", sub: "완료", state: "done" as const },
    {
      label: "작업",
      sub: done ? "완료" : `${relativeDate(plan.date, now)} ${hm(plan.startHour)}`,
      state: done ? ("done" as const) : ("current" as const),
    },
    { label: "체크인", sub: done ? "완료" : "작업 후", state: done ? ("done" as const) : ("todo" as const) },
  ];

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
          <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full animate-check-in ${header.tone}`}>
            <HeaderIcon size={34} strokeWidth={2} aria-hidden />
          </span>
          <h1 className="mt-4 text-page text-coffee-900">{header.title}</h1>
          <p className="mt-1.5 text-body text-coffee-500">{header.sub}</p>
        </div>

        {/* ---------- 일정: 티켓처럼 한 장에 ---------- */}
        <article
          className={`mt-8 overflow-hidden rounded-[24px] bg-white shadow-card ring-1 ring-cream-300/70 ${plan.status === "cancelled" ? "opacity-75" : ""}`}
        >
          <Link href={`/cafe/${cafe.id}`} className="group relative block" aria-label={`${cafe.name} 카페 정보 보기`}>
            <CafePhoto cafe={cafe} variant="wide" className="aspect-[2.6/1] w-full" sizes="(max-width: 672px) 100vw, 672px" overlay={false} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 px-5 pb-4 text-white">
              <p className="flex items-center gap-1 text-caption font-semibold text-white/85">
                <MapPin size={13} aria-hidden />
                {AREA_MAP[cafe.area].name} · {cafe.station}
              </p>
              <p className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] underline-offset-4 group-hover:underline">{cafe.name}</p>
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-4 px-5 pb-5 pt-4">
            <div>
              <p className="text-caption text-coffee-400">날짜</p>
              <p className="num mt-0.5 text-title text-coffee-900">{dayRel}</p>
              {dayRel !== dayFull && <p className="num text-meta text-coffee-500">{dayFull}</p>}
            </div>
            <div>
              <p className="text-caption text-coffee-400">시간</p>
              <p className="num mt-0.5 text-title text-coffee-900">{timeRange(plan.startHour, plan.durationMin)}</p>
              <p className="num text-meta text-coffee-500">
                {formatDuration(plan.durationMin)} · {PURPOSE_LABEL[plan.purpose]}
              </p>
            </div>
            {plan.memo && (
              <p className="col-span-2 rounded-xl bg-cream-100 px-3.5 py-2.5 text-meta text-coffee-700">
                <span className="font-semibold text-coffee-500">할 일 · </span>
                {plan.memo}
              </p>
            )}
          </div>

          {/* 티켓 절취선 */}
          <div className="relative h-5" aria-hidden>
            <span className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-cream-50 ring-1 ring-inset ring-cream-300/70" />
            <span className="absolute -right-2.5 top-0 h-5 w-5 rounded-full bg-cream-50 ring-1 ring-inset ring-cream-300/70" />
            <span className="absolute inset-x-5 top-1/2 border-t-2 border-dashed border-cream-200" />
          </div>

          {plan.status !== "cancelled" && (
            <ol className="flex items-start px-5 pb-1 pt-3" aria-label="진행 단계">
              {steps.map((st, i) => (
                <li key={st.label} className="relative flex flex-1 flex-col items-center text-center">
                  {i > 0 && (
                    <span
                      className={`absolute right-1/2 top-[11px] h-0.5 w-full -translate-x-3 ${st.state === "todo" ? "bg-cream-200" : "bg-forest-500"}`}
                      aria-hidden
                    />
                  )}
                  <span
                    className={`relative z-[1] flex h-6 w-6 items-center justify-center rounded-full ${
                      st.state === "done"
                        ? "bg-forest-600 text-white"
                        : st.state === "current"
                          ? "bg-white text-coffee-800 ring-2 ring-coffee-800"
                          : "bg-cream-200 text-coffee-400"
                    }`}
                    aria-hidden
                  >
                    {st.state === "done" ? <Check size={14} strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-current" />}
                  </span>
                  <span className={`mt-1.5 text-caption font-semibold ${st.state === "todo" ? "text-coffee-400" : "text-coffee-800"}`}>
                    {st.label}
                  </span>
                  <span className="num text-[12px] text-coffee-400">{st.sub}</span>
                  <span className="sr-only">{st.state === "done" ? "완료" : st.state === "current" ? "진행 전" : "남음"}</span>
                </li>
              ))}
            </ol>
          )}

          {plan.status === "planned" && (
            <div className="mx-5 mb-5 mt-4 space-y-2.5 rounded-2xl bg-cream-50 px-4 py-3.5">
              <p className="text-label text-coffee-500">도착 전에 알아두세요</p>
              <div className="flex items-center gap-3">
                <ScorePill score={ex.score} />
                <p className="text-meta font-semibold text-coffee-800">
                  {ex.pros.slice(0, 2).join(" · ") || "무난한 작업 환경"}
                </p>
              </div>
              {ex.cons.map((c) => (
                <p key={c} className="flex items-center gap-2 text-meta font-medium text-amber2-600">
                  <AlertCircle size={15} className="shrink-0" />
                  {c}
                </p>
              ))}
              {best && best.hour !== plan.startHour && best.score - ex.score >= 5 && (
                <p className="flex items-center gap-2 text-meta text-coffee-500">
                  <Clock3 size={15} className="shrink-0" />
                  <span>
                    <span className="num font-semibold text-coffee-700">{best.hour}시</span>에 가면 더 좋아요 ({best.score}점) ·
                    데모 예측값
                  </span>
                </p>
              )}
            </div>
          )}

          {plan.status === "completed" && review && (
            <div className="mx-5 mb-5 mt-4 rounded-2xl bg-cream-50 px-4 py-3.5">
              <p className="flex items-center gap-1.5 text-body font-semibold text-coffee-800">
                <Star size={16} className="fill-amber2-400 text-amber2-400" aria-hidden />
                <span className="num">{review.rating}.0</span>
                <span className="text-meta font-normal text-coffee-400">· 내 체크인</span>
              </p>
              <p className="mt-1 text-meta text-coffee-500">{reviewSummaryTags(review).join(" · ")}</p>
              {review.text && <p className="mt-2 text-body text-coffee-700">{review.text}</p>}
            </div>
          )}

          {plan.status === "cancelled" && <div className="h-3" aria-hidden />}
        </article>

        {/* ---------- 다음 행동: 상태별 주 행동 하나 ---------- */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          {isNew && (
            <>
              <Link href="/my" className="btn-primary sm:flex-1">
                내 작업 일정 보기
              </Link>
              <Link href={mapHref} className="btn-secondary sm:flex-1">
                지도에서 보기
              </Link>
            </>
          )}
          {!isNew && plan.status === "planned" && (
            <>
              <Link href={`/cafe/${cafe.id}/review?plan=${plan.id}`} className="btn-primary sm:flex-1">
                다녀왔어요 · 체크인하기
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

        {isNew && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-meta text-coffee-500">
            <Check size={15} strokeWidth={2.6} className="shrink-0 text-forest-600" aria-hidden />
            지도 마커와 내 작업에 바로 표시했어요
          </p>
        )}

        {plan.status === "planned" && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4">
            {isNew && (
              <Link href={`/cafe/${cafe.id}/review?plan=${plan.id}`} className="btn-quiet text-label">
                작업을 마쳤다면 체크인하기
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
