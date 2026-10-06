"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Star,
  MapPin,
  Clock3,
  Volume2,
  Wifi,
  Plug,
  Armchair,
  Timer,
  Laptop,
  Car,
  Bath,
  Table2,
  Check,
  AlertCircle,
  CalendarCheck2,
  PenLine,
  ChevronDown,
} from "lucide-react";
import type { Cafe, Plan, Purpose } from "@/lib/types";
import { AREA_MAP, CAFES } from "@/lib/data/cafes";
import {
  distanceKm,
  formatDistance,
  formatHours,
  formatStay,
  isOpenAt,
  metricLabel,
  noiseLabel,
  outletLabel,
} from "@/lib/scoring";
import { calmestHour, fitCaution, fitReasons, fitScore, PURPOSES, rankByFit, verdict } from "@/lib/fit";
import { dateKey, hm, relativeDate } from "@/lib/time";
import { reviewsForCafe } from "@/lib/reviews";
import { useApp } from "@/lib/store";
import { useFitContext } from "@/lib/useFitContext";
import CafePhoto from "@/components/CafePhoto";
import HourlyChart from "@/components/HourlyChart";
import FavoriteButton from "@/components/FavoriteButton";
import CompareToggle from "@/components/CompareToggle";
import CafeCard from "@/components/CafeCard";
import ScorePill from "@/components/ScorePill";

/** 결론 → 이유 → 주의 (모바일 본문 · 데스크톱 스티키 패널 공용) */
function Decision({ cafe, hour, purpose, onPurpose, picked, onResetHour, score, reasons, caution, ready }: {
  cafe: Cafe;
  hour: number;
  purpose: Purpose;
  onPurpose: (p: Purpose) => void;
  /** 그래프에서 다른 시간을 골랐는지 */
  picked: boolean;
  onResetHour: () => void;
  score: number;
  reasons: string[];
  caution: string | null;
  ready: boolean;
}) {
  const open = isOpenAt(cafe, hour);
  if (!ready) {
    return (
      <div className="space-y-3" aria-busy>
        <div className="h-3.5 w-32 animate-pulse rounded bg-cream-200" />
        <div className="flex items-center gap-4">
          <div className="h-[74px] w-[72px] animate-pulse rounded-2xl bg-cream-200" />
          <div className="h-5 flex-1 animate-pulse rounded bg-cream-200" />
        </div>
        <div className="h-4 w-2/3 animate-pulse rounded bg-cream-200" />
      </div>
    );
  }
  return (
    <div>
      {/* 기준을 이 자리에서 바로 바꿀 수 있게 — 목적 선택, 고른 시간 되돌리기 */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-coffee-500">
        <span className="num font-semibold text-coffee-700">{hour}시</span>
        <span aria-hidden>·</span>
        <label className="relative inline-flex items-center">
          <span className="sr-only">작업 목적</span>
          <select
            value={purpose}
            onChange={(e) => onPurpose(e.target.value as Purpose)}
            className="h-7 cursor-pointer appearance-none rounded-lg border border-cream-300 bg-white pl-2.5 pr-7 font-semibold text-coffee-800 outline-none transition-colors hover:border-coffee-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coffee-600"
          >
            {PURPOSES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2 text-coffee-400" aria-hidden />
        </label>
        <span>기준</span>
        {picked && (
          <button type="button" onClick={onResetHour} className="ml-auto font-semibold text-coffee-700 underline underline-offset-4">
            지금 기준으로
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center gap-4">
        <ScorePill score={score} muted={!open} size="lg" />
        <p className="text-title text-coffee-900">{verdict(cafe, hour)}</p>
      </div>
      {open && reasons.length > 0 && (
        <ul className="mt-4 space-y-2">
          {reasons.map((r) => (
            <li key={r} className="flex items-center gap-2 text-body text-coffee-700">
              <Check size={17} strokeWidth={2.6} className="shrink-0 text-forest-600" />
              {r}
            </li>
          ))}
        </ul>
      )}
      {caution && (
        <p className="mt-3 flex items-center gap-2 text-meta font-medium text-amber2-500">
          <AlertCircle size={16} className="shrink-0" />
          {caution}
        </p>
      )}
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-t border-cream-300/70 py-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-section text-coffee-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function CafeDetail({ cafe }: { cafe: Cafe }) {
  const router = useRouter();
  const { addRecent, plans, reviews, hydrated, setPurpose } = useApp();
  const { purpose, hour: contextHour, now, isLive } = useFitContext();
  const [pickedHour, setPickedHour] = useState<number | null>(null);
  const [metric, setMetric] = useState<"crowd" | "noise">("crowd");

  useEffect(() => {
    addRecent(cafe.id);
  }, [cafe.id, addRecent]);

  const hour = pickedHour ?? contextHour;
  const open = isOpenAt(cafe, hour);
  const score = fitScore(cafe, purpose, hour);
  const reasons = fitReasons(cafe, purpose, hour, 3);
  const caution = fitCaution(cafe, hour);
  const area = AREA_MAP[cafe.area];
  // 지금 시각을 따라가는 중이면 "오늘 남은 시간 중"에서 고른다
  const calm = calmestHour(cafe, isLive ? contextHour : undefined);

  /** 이 카페에 예정된 가장 가까운 작업 */
  const myPlan: Plan | null = useMemo(() => {
    if (!hydrated) return null;
    const today = now ? dateKey(now) : "";
    return (
      plans
        .filter((p) => p.cafeId === cafe.id && p.status === "planned" && (!today || p.date >= today))
        .sort((a, b) => (a.date === b.date ? a.startHour - b.startHour : a.date < b.date ? -1 : 1))[0] ?? null
    );
  }, [plans, cafe.id, now, hydrated]);

  const allReviews = useMemo(() => reviewsForCafe(cafe, hydrated ? reviews : []), [cafe, reviews, hydrated]);
  const myReviewCount = allReviews.filter((r) => r.mine).length;

  const similar = useMemo(
    () =>
      rankByFit(
        CAFES.filter((c) => c.area === cafe.area && c.id !== cafe.id),
        purpose,
        hour
      ).slice(0, 3),
    [cafe, purpose, hour]
  );

  // 이 시간이 영업 외라면 CTA는 시간 없이 계획 화면으로 보낸다
  const planHref = `/cafe/${cafe.id}/plan${open ? `?hour=${hour}` : ""}`;
  const ctaLabel = open ? `${hour}시에 여기서 작업하기` : "작업 계획 세우기";

  const env = [
    { icon: Volume2, label: "소음", value: noiseLabel(cafe.metrics.noiseScore) },
    { icon: Plug, label: "콘센트", value: outletLabel(cafe.metrics.outletScore) },
    { icon: Wifi, label: "Wi-Fi", value: `${cafe.wifiMbps}Mbps` },
    { icon: Armchair, label: "좌석", value: metricLabel(cafe.metrics.seatScore) },
    { icon: Table2, label: "테이블", value: cafe.amenities.bigTable ? "넓은 편" : "보통 크기" },
    { icon: Timer, label: "평균 체류", value: formatStay(cafe.avgStayMinutes) },
    { icon: Laptop, label: "노트북 분위기", value: cafe.amenities.laptopFriendly ? "눈치 안 보임" : "짧은 작업 위주" },
    { icon: Bath, label: "화장실", value: cafe.amenities.restroom ? "매장 안" : "건물 공용" },
    { icon: Car, label: "주차", value: cafe.amenities.parking ? "가능" : "불가" },
  ];

  const decision = (
    <Decision
      cafe={cafe}
      hour={hour}
      purpose={purpose}
      onPurpose={setPurpose}
      picked={pickedHour !== null && pickedHour !== contextHour}
      onResetHour={() => setPickedHour(null)}
      score={score}
      reasons={reasons}
      caution={caution}
      ready={now !== null && hydrated}
    />
  );

  const planBanner = myPlan && (
    <Link
      href={`/plans/${myPlan.id}`}
      className="flex items-center gap-3 rounded-xl bg-coffee-800 px-4 py-3 text-cream-50 transition-colors hover:bg-coffee-700"
    >
      <CalendarCheck2 size={18} className="shrink-0" />
      <span className="min-w-0 flex-1 text-meta">
        <b className="num font-semibold">
          {relativeDate(myPlan.date, now)} {hm(myPlan.startHour)}
        </b>{" "}
        작업 예정이에요
      </span>
      <span className="flex shrink-0 items-center gap-1 text-label">
        일정 보기 <ArrowRight size={15} />
      </span>
    </Link>
  );

  return (
    <div className="h-full overflow-y-auto bg-cream-50">
      <div className="mx-auto max-w-6xl pb-32 lg:px-8 lg:pb-16 lg:pt-6">
        {/* ---------- 사진 ---------- */}
        <div className="relative">
          <CafePhoto
            cafe={cafe}
            variant="wide"
            priority
            className="aspect-[16/9] w-full lg:aspect-[3.2/1] lg:rounded-3xl"
            sizes="(max-width: 1024px) 100vw, 1100px"
          />
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-coffee-800 shadow-card transition-colors hover:bg-white"
            aria-label="뒤로 가기"
          >
            <ArrowLeft size={19} />
          </button>
        </div>

        <div className="px-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 lg:px-0">
          {/* ---------- 본문 ---------- */}
          <div className="min-w-0">
            <header className="pb-6 pt-5 lg:pt-7">
              <h1 className="text-page text-coffee-900">{cafe.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-coffee-500">
                <span>{area.name}</span>
                <span aria-hidden>·</span>
                <span className="num">
                  {cafe.station} {cafe.stationDistanceM}m
                </span>
                <span aria-hidden>·</span>
                <span className="flex items-center gap-1">
                  <Star size={14} className="fill-amber2-400 text-amber2-400" aria-hidden />
                  <b className="num text-coffee-800">{cafe.rating.toFixed(1)}</b>
                  <span className="num">({cafe.reviewCount + myReviewCount})</span>
                </span>
              </p>
              <p className="mt-3 text-body text-coffee-600">{cafe.description}</p>
            </header>

            {planBanner && <div className="mb-6 lg:hidden">{planBanner}</div>}

            {/* 모바일: 결론을 본문 첫머리에 */}
            <div className="border-t border-cream-300/70 py-6 lg:hidden">
              {decision}
            </div>

            <Section
              title="시간대별 붐빔"
              action={
                <div className="flex rounded-xl border border-cream-300 bg-white p-1" role="tablist" aria-label="그래프 기준">
                  {(["crowd", "noise"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={metric === m}
                      onClick={() => setMetric(m)}
                      className={`h-8 rounded-lg px-3 text-label transition-colors ${
                        metric === m ? "bg-coffee-800 text-cream-50" : "text-coffee-500 hover:text-coffee-800"
                      }`}
                    >
                      {m === "crowd" ? "혼잡도" : "소음"}
                    </button>
                  ))}
                </div>
              }
            >
              <HourlyChart cafe={cafe} metric={metric} selectedHour={hour} onSelect={setPickedHour} />
              <p className="mt-4 text-meta text-coffee-500">
                막대를 누르면 그 시간 기준으로 다시 판단해요. {isLive ? "오늘 남은 시간 중 " : ""}가장 한산한 때는{" "}
                <button
                  type="button"
                  onClick={() => setPickedHour(calm)}
                  className="num font-semibold text-coffee-800 underline underline-offset-4"
                >
                  {calm}시
                </button>
                예요.
              </p>
            </Section>

            <Section title="작업 환경">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                {env.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon size={19} className="mt-0.5 shrink-0 text-coffee-400" aria-hidden />
                    <div className="min-w-0">
                      <dt className="text-meta text-coffee-400">{label}</dt>
                      <dd className="text-body font-semibold text-coffee-800">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </Section>

            <Section title="매장 정보">
              <ul className="space-y-3 text-body text-coffee-700">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="mt-1 shrink-0 text-coffee-400" aria-hidden />
                  <span>
                    {cafe.address}
                    <span className="block text-meta text-coffee-400">
                      현재 위치(데모)에서 {formatDistance(distanceKm(cafe.lat, cafe.lng))}
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock3 size={18} className="mt-1 shrink-0 text-coffee-400" aria-hidden />
                  <span className="num">매일 {formatHours(cafe)}</span>
                </li>
              </ul>
            </Section>

            <Section
              title="작업 후기"
              action={
                <Link href={`/cafe/${cafe.id}/review`} className="btn-quiet h-10 text-label">
                  <PenLine size={16} />
                  후기 남기기
                </Link>
              }
            >
              <div className="mb-5 flex items-center gap-4 rounded-2xl bg-white px-5 py-4">
                <div className="flex items-center gap-1.5">
                  <Star size={22} className="fill-amber2-400 text-amber2-400" aria-hidden />
                  <span className="num text-section text-coffee-900">{cafe.rating.toFixed(1)}</span>
                </div>
                <p className="min-w-0 text-meta text-coffee-500">
                  후기 <b className="num font-semibold text-coffee-800">{(cafe.reviewCount + myReviewCount).toLocaleString()}개</b>
                  <span className="block truncate">방문자 키워드 · {cafe.tags.slice(0, 3).join(" · ")}</span>
                </p>
              </div>
              <ul className="divide-y divide-cream-300/70">
                {allReviews.map((r) => (
                  <li key={r.id} className="py-4 first:pt-0">
                    <div className="flex items-center gap-2">
                      <span className="text-body font-semibold text-coffee-900">{r.author}</span>
                      {r.mine && (
                        <span className="rounded-md bg-coffee-800 px-1.5 py-0.5 text-[12px] font-semibold text-cream-50">
                          내 후기
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-meta font-semibold text-coffee-700">
                        <Star size={14} className="fill-amber2-400 text-amber2-400" aria-hidden />
                        {r.rating}
                      </span>
                    </div>
                    <p className="mt-0.5 text-meta text-coffee-400">{r.meta}</p>
                    {r.text && <p className="mt-2 text-body text-coffee-700">{r.text}</p>}
                    <p className="mt-2 text-meta text-coffee-500">{r.tags.filter(Boolean).join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </Section>

            {similar.length > 0 && (
              <Section title={`${area.name}의 다른 작업 카페`}>
                <div className="space-y-2.5">
                  {similar.map(({ cafe: c }) => (
                    <CafeCard key={c.id} cafe={c} purpose={purpose} hour={hour} now={now} />
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* ---------- 데스크톱: 스티키 결정 패널 ---------- */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 mt-7 space-y-4">
              {planBanner}
              <div className="rounded-2xl border border-cream-300/80 bg-white p-6 shadow-card">
                {decision}
                <Link href={planHref} className="btn-primary mt-6 w-full">
                  {ctaLabel}
                  <ArrowRight size={17} />
                </Link>
                <div className="mt-3 flex items-center justify-between">
                  <CompareToggle cafeId={cafe.id} />
                  <FavoriteButton cafeId={cafe.id} />
                </div>
              </div>
              <p className="px-1 text-caption text-coffee-400">혼잡·소음은 데모 데이터 기반 예측값이에요.</p>
            </div>
          </aside>
        </div>
      </div>

      {/* ---------- 모바일: 하단 고정 CTA ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-300/70 bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <FavoriteButton cafeId={cafe.id} />
          <CompareToggle cafeId={cafe.id} compact />
          <Link href={planHref} className="btn-primary flex-1">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
