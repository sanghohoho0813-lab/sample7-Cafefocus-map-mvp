"use client";

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import type { Cafe, Purpose } from "@/lib/types";
import { AREA_MAP } from "@/lib/data/cafes";
import { distanceKm, formatDistance, isOpenAt } from "@/lib/scoring";
import { fitReasons, fitScore, verdict } from "@/lib/fit";
import CafePhoto from "@/components/CafePhoto";
import FavoriteButton from "@/components/FavoriteButton";
import ScorePill from "@/components/ScorePill";
import { openText } from "@/components/CafeCard";

/** 지도에서 마커를 고르면 뜨는 미리보기 (데스크톱) */
export default function CafeMiniCard({
  cafe,
  purpose,
  hour,
  onClose,
}: {
  cafe: Cafe;
  purpose: Purpose;
  hour: number;
  onClose: () => void;
}) {
  const score = fitScore(cafe, purpose, hour);
  const open = isOpenAt(cafe, hour);
  const reasons = fitReasons(cafe, purpose, hour, 3);

  return (
    <div
      className="w-[340px] overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-card-lg animate-fade-up"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={`${cafe.name} 미리보기`}
    >
      <div className="relative flex gap-3 p-4 pb-3">
        <CafePhoto cafe={cafe} className="h-16 w-16 shrink-0 rounded-xl" sizes="64px" overlay={false} />
        <div className="min-w-0 flex-1 pr-7">
          <h3 className="truncate text-title text-coffee-900">{cafe.name}</h3>
          <p className="truncate text-meta text-coffee-400">
            {AREA_MAP[cafe.area].name} · {formatDistance(distanceKm(cafe.lat, cafe.lng))} ·{" "}
            <span className="num">{openText(cafe, hour)}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-coffee-400 hover:bg-cream-100 hover:text-coffee-700"
          aria-label="미리보기 닫기"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-2 px-4 pb-4">
        <div className="flex items-center gap-2.5">
          <ScorePill score={score} muted={!open} />
          <p className="text-meta font-semibold text-coffee-800">{verdict(cafe, hour)}</p>
        </div>
        {open && reasons.length > 0 && (
          <p className="text-meta text-coffee-500">{reasons.join(" · ")}</p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-cream-200 p-3">
        <Link href={`/cafe/${cafe.id}`} className="btn-primary h-11 flex-1">
          자세히 보기
          <ArrowRight size={16} />
        </Link>
        <FavoriteButton cafeId={cafe.id} />
      </div>
    </div>
  );
}
