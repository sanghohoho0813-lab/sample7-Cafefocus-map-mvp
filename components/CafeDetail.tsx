"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Volume2,
  Wifi,
  Plug,
  Armchair,
  Users,
  Timer,
  Laptop,
  Car,
  Bath,
  Table2,
  MessageSquarePlus,
} from "lucide-react";
import type { Cafe } from "@/lib/types";
import { AREA_MAP, CAFES } from "@/lib/data/cafes";
import {
  workScore,
  hourlyAt,
  levelOf,
  demoHour,
  formatHours,
  formatStay,
  formatDistance,
  distanceKm,
  isOpenAt,
  quietestWindow,
  busiestWindow,
  metricLabel,
  outletLabel,
  noiseLabel,
  NOISE_LABEL,
  CROWD_LABEL,
  LEVEL_TEXT_CLASS,
} from "@/lib/scoring";
import { METRIC_ICON, METRIC_ICON_BG } from "@/lib/icon-colors";
import CafePhoto from "@/components/CafePhoto";
import WorkScoreRing from "@/components/WorkScoreRing";
import MetricBar from "@/components/MetricBar";
import MetricBadge from "@/components/MetricBadge";
import HourlyChart from "@/components/HourlyChart";
import FavoriteButton from "@/components/FavoriteButton";
import CompareButton from "@/components/CompareButton";
import CafeCard from "@/components/CafeCard";
import SampleBridgeCTA from "@/components/SampleBridgeCTA";
import { useApp } from "@/lib/store";

export default function CafeDetail({ cafe }: { cafe: Cafe }) {
  const router = useRouter();
  const { addRecent, showToast } = useApp();
  const [hour, setHour] = useState(15);
  const [metric, setMetric] = useState<"crowd" | "noise">("crowd");

  useEffect(() => {
    setHour(demoHour(new Date()));
    addRecent(cafe.id);
  }, [cafe.id, addRecent]);

  const score = workScore(cafe.metrics);
  const point = hourlyAt(cafe, hour);
  const noiseLv = levelOf(point.noise);
  const crowdLv = levelOf(point.crowd);
  const open = isOpenAt(cafe, hour);
  const area = AREA_MAP[cafe.area];

  const similar = CAFES.filter((c) => c.area === cafe.area && c.id !== cafe.id)
    .sort((a, b) => workScore(b.metrics) - workScore(a.metrics))
    .slice(0, 3);

  const envCells = [
    { icon: Volume2, key: "noise" as const, label: "소음", value: noiseLabel(cafe.metrics.noiseScore) },
    { icon: Plug, key: "outlet" as const, label: "콘센트", value: outletLabel(cafe.metrics.outletScore) },
    { icon: Wifi, key: "wifi" as const, label: "Wi-Fi", value: `빠름 (${cafe.wifiMbps}Mbps)` },
    { icon: Armchair, key: "seat" as const, label: "좌석 편안함", value: metricLabel(cafe.metrics.seatScore) },
    { icon: Table2, key: "table" as const, label: "테이블", value: cafe.amenities.bigTable ? "넓은 테이블" : "보통 크기" },
    { icon: Users, key: "crowd" as const, label: "혼잡도", value: CROWD_LABEL[crowdLv] },
    { icon: Timer, key: "stay" as const, label: "체류 편의", value: metricLabel(cafe.metrics.stayScore) },
    { icon: Laptop, key: "laptop" as const, label: "노트북", value: cafe.amenities.laptopFriendly ? "눈치 안 보임" : "짧은 작업" },
    { icon: Bath, key: "restroom" as const, label: "화장실", value: cafe.amenities.restroom ? "매장 내" : "건물 공용" },
    { icon: Car, key: "parking" as const, label: "주차", value: cafe.amenities.parking ? "가능" : "불가" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-cream-100">
      <div className="mx-auto max-w-6xl px-0 pb-10 sm:px-4 sm:pt-4 lg:px-6">
        {/* Hero */}
        <div className="relative">
          <CafePhoto
            cafe={cafe}
            variant="wide"
            priority
            className="aspect-[16/9] w-full sm:rounded-3xl md:aspect-[21/9]"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
          <button
            onClick={() => router.back()}
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-coffee-700 shadow-card backdrop-blur transition-transform active:scale-90"
            aria-label="뒤로 가기"
          >
            <ArrowLeft size={21.5} />
          </button>
          <FavoriteButton cafeId={cafe.id} className="absolute right-3 top-3" />
        </div>

        {/* 본문 그리드 */}
        <div className="mx-auto max-w-6xl space-y-4 px-3 sm:px-0 lg:grid lg:grid-cols-[1fr_420px] lg:items-start lg:gap-4 lg:space-y-0">
          {/* ---- 좌측 메인 ---- */}
          <div className="relative z-10 -mt-8 space-y-4">
            {/* 헤더 카드 */}
            <section className="relative rounded-3xl border border-cream-200 bg-white p-5 shadow-card animate-fade-up">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-[28.5px] font-bold leading-tight text-coffee-800">
                    {cafe.name}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[16.5px] text-coffee-400">
                    <span>{area.name} · 카페, 디저트</span>
                    <span className="inline-flex items-center gap-1">
                      <Star size={15} className="fill-amber2-400 text-amber2-400" />
                      <b className="text-coffee-700">{cafe.rating.toFixed(1)}</b>
                      <span>({cafe.reviewCount})</span>
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[16.5px] text-coffee-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={15.5} className="text-coffee-400" />
                      {cafe.address}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={15.5} className="text-coffee-400" />
                      <b className={open ? "text-forest-600" : "text-coffee-300"}>
                        {open ? "영업 중" : "영업 종료"}
                      </b>
                      {formatHours(cafe)}
                    </span>
                  </div>
                  <div className="mt-2 text-[15.5px] text-coffee-400">
                    {area.station}에서 {cafe.stationDistanceM}m · 현재 위치에서{" "}
                    {formatDistance(distanceKm(cafe.lat, cafe.lng))}
                  </div>
                </div>
                <div className="shrink-0">
                  <WorkScoreRing score={score} size={105} />
                </div>
              </div>
              <p className="mt-3 text-[17.5px] leading-relaxed text-coffee-600">
                {cafe.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cafe.tags.map((t) => (
                  <MetricBadge key={t} label={t} tone="green" />
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <CompareButton cafeId={cafe.id} variant="block" />
                <button
                  onClick={() => showToast("리뷰 작성은 데모에서 준비 중이에요.")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-coffee-700 py-2.5 text-[17px] font-semibold text-cream-50 transition-colors hover:bg-coffee-600 active:scale-[0.98]"
                >
                  <MessageSquarePlus size={19} />
                  리뷰 남기기
                </button>
              </div>
            </section>

            {/* 핵심 환경 그리드 */}
            <section className="rounded-3xl border border-cream-200 bg-white p-5 shadow-card animate-fade-up">
              <h2 className="text-[19.5px] font-bold text-coffee-800">핵심 작업 환경</h2>
              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 md:grid-cols-5">
                {envCells.map(({ icon: Icon, key, label, value }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${METRIC_ICON_BG[key]} ${METRIC_ICON[key]}`}
                    >
                      <Icon size={21.5} strokeWidth={2} />
                    </span>
                    <span className="text-[14.5px] text-coffee-400">{label}</span>
                    <span className="text-[15.5px] font-semibold leading-tight text-coffee-700">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3 border-t border-cream-200 pt-4">
                <MetricBar icon={Volume2} iconClass={METRIC_ICON.noise} label="소음 수준" value={cafe.metrics.noiseScore} valueLabel={noiseLabel(cafe.metrics.noiseScore)} />
                <MetricBar icon={Plug} iconClass={METRIC_ICON.outlet} label="콘센트" value={cafe.metrics.outletScore} valueLabel={outletLabel(cafe.metrics.outletScore)} />
                <MetricBar icon={Wifi} iconClass={METRIC_ICON.wifi} label="Wi-Fi 속도" value={cafe.metrics.wifiScore} valueLabel={`${cafe.wifiMbps}Mbps`} />
                <MetricBar icon={Armchair} iconClass={METRIC_ICON.seat} label="좌석 편안함" value={cafe.metrics.seatScore} valueLabel={metricLabel(cafe.metrics.seatScore)} />
                <MetricBar icon={Timer} iconClass={METRIC_ICON.stay} label="체류 편의" value={cafe.metrics.stayScore} valueLabel={metricLabel(cafe.metrics.stayScore)} />
              </div>
            </section>

            {/* 시간대별 그래프 */}
            <section className="rounded-3xl border border-cream-200 bg-white p-5 shadow-card animate-fade-up">
              <div className="flex items-center justify-between">
                <h2 className="text-[19.5px] font-bold text-coffee-800">시간대별 상태</h2>
                <div className="flex rounded-full border border-cream-200 bg-cream-100 p-0.5">
                  {(["crowd", "noise"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMetric(m)}
                      className={`rounded-full px-3 py-1 text-[15.5px] font-semibold transition-all duration-200 ${
                        metric === m
                          ? "bg-white text-coffee-800 shadow-sm"
                          : "text-coffee-400"
                      }`}
                      aria-pressed={metric === m}
                    >
                      {m === "crowd" ? "혼잡도" : "소음"}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-[15.5px] text-coffee-400">
                막대를 누르면 해당 시간 기준으로 상태가 바뀌어요.
              </p>
              <div className="mt-4">
                <HourlyChart
                  cafe={cafe}
                  metric={metric}
                  selectedHour={hour}
                  onSelect={setHour}
                  height={88}
                />
              </div>
            </section>

            {/* 환경 상세 */}
            <section className="rounded-3xl border border-cream-200 bg-white p-5 shadow-card animate-fade-up">
              <h2 className="text-[19.5px] font-bold text-coffee-800">소음 · 혼잡 상세</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: `${hour}시 소음`,
                    value: NOISE_LABEL[noiseLv],
                    cls: LEVEL_TEXT_CLASS[noiseLv],
                  },
                  {
                    label: `${hour}시 혼잡`,
                    value: CROWD_LABEL[crowdLv],
                    cls: LEVEL_TEXT_CLASS[crowdLv],
                  },
                  { label: "가장 조용한 시간", value: quietestWindow(cafe), cls: "text-forest-600" },
                  { label: "가장 혼잡한 시간", value: busiestWindow(cafe), cls: "text-amber2-500" },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="rounded-2xl bg-cream-100 px-3 py-3 text-center">
                    <div className="text-[14.5px] text-coffee-400">{label}</div>
                    <div className={`mt-1 text-[17.5px] font-bold ${cls}`}>{value}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[16.5px] leading-relaxed text-coffee-500">
                평균 체류 시간은 <b className="text-coffee-700">{formatStay(cafe.avgStayMinutes)}</b>
                이에요.{" "}
                {cafe.avgStayMinutes >= 120
                  ? "2시간 이상 작업하기 좋은 곳이에요."
                  : "짧고 굵은 집중 작업에 어울리는 곳이에요."}
              </p>
            </section>

            {/* 리뷰 */}
            <section className="rounded-3xl border border-cream-200 bg-white p-5 shadow-card animate-fade-up">
              <div className="flex items-center justify-between">
                <h2 className="text-[19.5px] font-bold text-coffee-800">
                  작업환경 리뷰 <span className="text-coffee-400">({cafe.reviewCount})</span>
                </h2>
                <span className="text-[15.5px] text-coffee-400">작업자 후기 기준</span>
              </div>
              <div className="mt-4 space-y-4">
                {cafe.reviews.map((rv) => (
                  <div key={rv.id} className="border-b border-cream-200 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-coffee-100 text-[15.5px] font-bold text-coffee-600">
                        {rv.author.charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[17px] font-bold text-coffee-800">{rv.author}</span>
                          <span className="flex items-center gap-0.5 text-[15px] text-amber2-500">
                            <Star size={14} className="fill-amber2-400 text-amber2-400" />
                            {rv.rating}
                          </span>
                        </div>
                        <div className="text-[14.5px] text-coffee-400">
                          {rv.visitTime} 방문 · {rv.purpose} · {formatStay(rv.stayMinutes)} 체류
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-[17px] leading-relaxed text-coffee-600">{rv.text}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {rv.tags.map((t) => (
                        <MetricBadge key={t} label={t} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ---- 우측: 근처 다른 카페 ---- */}
          <aside className="space-y-3 pt-2 lg:sticky lg:top-4 lg:pt-0">
            <h2 className="px-1 text-[18px] font-bold text-coffee-800">
              {area.name}의 다른 작업 카페
            </h2>
            {similar.map((c) => (
              <CafeCard key={c.id} cafe={c} hour={hour} variant="row" />
            ))}
            <Link
              href="/compare"
              className="block rounded-2xl border border-dashed border-coffee-200 bg-white/70 py-3.5 text-center text-[17px] font-semibold text-coffee-500 transition-colors hover:border-coffee-400 hover:text-coffee-700"
            >
              비교함에서 카페 비교하기
            </Link>
          </aside>
        </div>

        {/* 브릿지 CTA — 상세를 다 본 뒤 전체 폭으로 */}
        <div className="mt-4 px-3 sm:px-0">
          <SampleBridgeCTA />
        </div>
      </div>
    </div>
  );
}
