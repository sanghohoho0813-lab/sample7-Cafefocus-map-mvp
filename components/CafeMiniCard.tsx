"use client";

import Link from "next/link";
import { Star, X, Volume2, Users, Plug, Wifi } from "lucide-react";
import type { Cafe } from "@/lib/types";
import {
  workScore,
  hourlyAt,
  levelOf,
  distanceKm,
  formatDistance,
  isOpenAt,
  NOISE_LABEL,
  CROWD_LABEL,
  outletLabel,
  metricLabel,
  LEVEL_TEXT_CLASS,
} from "@/lib/scoring";
import CafePhoto from "@/components/CafePhoto";
import FavoriteButton from "@/components/FavoriteButton";
import WorkScoreRing from "@/components/WorkScoreRing";

/** 지도에서 마커 선택 시 뜨는 프리뷰 카드 */
export default function CafeMiniCard({
  cafe,
  hour,
  onClose,
}: {
  cafe: Cafe;
  hour: number;
  onClose?: () => void;
}) {
  const score = workScore(cafe.metrics);
  const point = hourlyAt(cafe, hour);
  const noiseLv = levelOf(point.noise);
  const crowdLv = levelOf(point.crowd);
  const open = isOpenAt(cafe, hour);

  return (
    <div
      className="relative w-[330px] overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-card-lg animate-fade-up"
      onClick={(e) => e.stopPropagation()}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 z-10 rounded-full bg-white/80 p-1 text-coffee-300 backdrop-blur transition-colors hover:bg-cream-100 hover:text-coffee-600"
          aria-label="닫기"
        >
          <X size={14} />
        </button>
      )}
      <div className="flex items-center gap-3 p-3">
        <CafePhoto cafe={cafe} className="h-16 w-16 shrink-0 rounded-xl" sizes="64px" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate pr-6 text-[14.5px] font-bold text-coffee-800">
            {cafe.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-coffee-400">
            <Star size={10.5} className="fill-amber2-400 text-amber2-400" />
            <b className="text-coffee-600">{cafe.rating.toFixed(1)}</b>
            <span>({cafe.reviewCount})</span>
            <span>· {formatDistance(distanceKm(cafe.lat, cafe.lng))}</span>
          </div>
          <div className="mt-0.5 text-[11.5px]">
            <span className={open ? "font-semibold text-forest-600" : "font-semibold text-coffee-300"}>
              {open ? "영업 중" : "영업 종료"}
            </span>
            <span className="text-coffee-300">
              {" "}· {String(cafe.close).padStart(2, "0")}:00 마감
            </span>
          </div>
        </div>
        <WorkScoreRing score={score} size={52} label="점수" animate={false} />
      </div>

      <div className="grid grid-cols-4 gap-1 border-t border-cream-200 px-3 py-2.5 text-center">
        {[
          { icon: Volume2, label: "소음", value: NOISE_LABEL[noiseLv], lv: noiseLv },
          { icon: Users, label: "혼잡", value: CROWD_LABEL[crowdLv], lv: crowdLv },
          { icon: Plug, label: "콘센트", value: outletLabel(cafe.metrics.outletScore), lv: null },
          { icon: Wifi, label: "Wi-Fi", value: metricLabel(cafe.metrics.wifiScore), lv: null },
        ].map(({ icon: Icon, label, value, lv }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <Icon size={13} className="text-coffee-400" />
            <span className="text-[9.5px] text-coffee-300">{label}</span>
            <span
              className={`text-[10.5px] font-semibold ${lv ? LEVEL_TEXT_CLASS[lv] : "text-coffee-700"}`}
            >
              {value.replace("해요", "").replace("이에요", "")}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-cream-200 p-3">
        <Link
          href={`/cafe/${cafe.id}`}
          className="flex-1 rounded-xl bg-coffee-700 py-2.5 text-center text-[13px] font-semibold text-cream-50 transition-colors duration-200 hover:bg-coffee-600 active:scale-[0.98]"
        >
          상세 정보 보기
        </Link>
        <FavoriteButton cafeId={cafe.id} />
      </div>
    </div>
  );
}
