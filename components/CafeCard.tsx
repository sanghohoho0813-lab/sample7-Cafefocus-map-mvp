"use client";

import Link from "next/link";
import { Star, MapPin, Clock } from "lucide-react";
import type { Cafe } from "@/lib/types";
import { AREA_MAP } from "@/lib/data/cafes";
import {
  workScore,
  distanceKm,
  formatDistance,
  formatStay,
  hourlyAt,
  levelOf,
  isOpenAt,
  scoreBgClass,
  NOISE_LABEL,
  CROWD_LABEL,
} from "@/lib/scoring";
import { METRIC_ICON } from "@/lib/icon-colors";
import CafePhoto from "@/components/CafePhoto";
import FavoriteButton from "@/components/FavoriteButton";
import CompareButton from "@/components/CompareButton";
import MetricBadge from "@/components/MetricBadge";

/**
 * variant
 * - "card": 이미지형 세로 카드 (추천 캐러셀·그리드)
 * - "row" : 목록 패널용 가로 카드
 */
export default function CafeCard({
  cafe,
  hour,
  variant = "row",
  highlighted = false,
  onHover,
}: {
  cafe: Cafe;
  hour: number;
  variant?: "card" | "row";
  highlighted?: boolean;
  onHover?: (id: string | null) => void;
}) {
  const score = workScore(cafe.metrics);
  const point = hourlyAt(cafe, hour);
  const noiseLv = levelOf(point.noise);
  const crowdLv = levelOf(point.crowd);
  const open = isOpenAt(cafe, hour);
  const dist = formatDistance(distanceKm(cafe.lat, cafe.lng));

  const badges = (
    <div className="flex flex-wrap gap-1.5">
      <MetricBadge
        label={NOISE_LABEL[noiseLv]}
        tone={noiseLv === "quiet" ? "green" : noiseLv === "normal" ? "amber" : "neutral"}
      />
      <MetricBadge
        label={CROWD_LABEL[crowdLv] === "한산해요" ? "지금 한산" : CROWD_LABEL[crowdLv]}
        tone={crowdLv === "quiet" ? "green" : crowdLv === "normal" ? "amber" : "neutral"}
      />
      {cafe.metrics.outletScore >= 76 && <MetricBadge label="콘센트 많음" tone="green" />}
      {cafe.metrics.wifiScore >= 80 && <MetricBadge label="Wi-Fi 빠름" tone="green" />}
    </div>
  );

  if (variant === "card") {
    return (
      <Link
        href={`/cafe/${cafe.id}`}
        onMouseEnter={() => onHover?.(cafe.id)}
        onMouseLeave={() => onHover?.(null)}
        className={`group block overflow-hidden rounded-2xl border bg-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-lg ${
          highlighted ? "border-coffee-500 ring-2 ring-coffee-500/20" : "border-cream-200"
        }`}
      >
        <div className="relative">
          <CafePhoto
            cafe={cafe}
            className="aspect-[4/3] w-full"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
          />
          <div className="absolute right-2.5 top-2.5 flex h-12 w-12 flex-col items-center justify-center rounded-full bg-white/95 shadow-card backdrop-blur">
            <span className="text-[21px] font-bold leading-none text-coffee-800">
              {score}
            </span>
            <span className="text-[11px] text-coffee-400">작업점수</span>
          </div>
          <FavoriteButton cafeId={cafe.id} size="sm" className="absolute left-2.5 top-2.5" />
          {!open && (
            <span className="absolute bottom-2.5 left-2.5 rounded-md bg-coffee-800/85 px-2 py-1 text-[13.5px] font-medium text-cream-100">
              영업 종료
            </span>
          )}
        </div>
        <div className="space-y-2 p-3.5">
          <div>
            <h3 className="text-[19.5px] font-bold text-coffee-800">{cafe.name}</h3>
            <div className="mt-0.5 flex items-center gap-1.5 text-[15.5px] text-coffee-400">
              <Star size={14.5} className="fill-amber2-400 text-amber2-400" />
              <span className="font-semibold text-coffee-600">{cafe.rating.toFixed(1)}</span>
              <span>({cafe.reviewCount})</span>
              <span>·</span>
              <span>{AREA_MAP[cafe.area].name}</span>
              <span>·</span>
              <span>{dist}</span>
            </div>
          </div>
          <p className="line-clamp-2 text-[16.5px] leading-relaxed text-coffee-500">
            {cafe.description}
          </p>
          {badges}
        </div>
      </Link>
    );
  }

  return (
    <div
      onMouseEnter={() => onHover?.(cafe.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`group relative rounded-2xl border bg-white p-3 shadow-card transition-all duration-300 hover:shadow-card-lg ${
        highlighted ? "border-coffee-500 ring-2 ring-coffee-500/20" : "border-cream-200"
      }`}
    >
      <Link href={`/cafe/${cafe.id}`} className="flex gap-3">
        <div className="relative shrink-0">
          <CafePhoto cafe={cafe} className="h-24 w-24 rounded-xl" sizes="96px" />
          <span
            className={`absolute -bottom-1.5 -right-1.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[17px] font-bold text-white ${scoreBgClass(score)}`}
            aria-label={`작업점수 ${score}점`}
          >
            {score}
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2 pr-[76px]">
            <div className="min-w-0">
              <h3 className="truncate text-[19px] font-bold text-coffee-800">
                {cafe.name}
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[15px] text-coffee-400">
                <span className="inline-flex items-center gap-0.5">
                  <Star size={13} className="fill-amber2-400 text-amber2-400" />
                  <b className="text-coffee-600">{cafe.rating.toFixed(1)}</b>
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5">
                  <MapPin size={13} className={METRIC_ICON.location} />
                  {AREA_MAP[cafe.area].name} {dist}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5">
                  <Clock size={13} className={METRIC_ICON.clock} />
                  평균 {formatStay(cafe.avgStayMinutes)}
                </span>
              </div>
            </div>
          </div>
          {badges}
          <div className="flex items-center gap-1.5 text-[15px]">
            <span className={open ? "font-semibold text-forest-600" : "font-semibold text-coffee-300"}>
              {open ? "영업 중" : "영업 종료"}
            </span>
            <span className="text-coffee-300">
              · {String(cafe.open).padStart(2, "0")}:00 -{" "}
              {cafe.close === 24 ? "24:00" : `${String(cafe.close).padStart(2, "0")}:00`}
            </span>
          </div>
        </div>
      </Link>
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        <CompareButton cafeId={cafe.id} compact />
        <FavoriteButton cafeId={cafe.id} size="sm" />
      </div>
    </div>
  );
}
