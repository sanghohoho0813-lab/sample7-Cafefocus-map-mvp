"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, X } from "lucide-react";
import type { Cafe, Purpose } from "@/lib/types";
import { AREA_MAP } from "@/lib/data/cafes";
import { distanceKm, formatDistance } from "@/lib/scoring";
import { decision, explainFit } from "@/lib/fit";
import { useFitContext } from "@/lib/useFitContext";
import CafePhoto from "@/components/CafePhoto";
import FavoriteButton from "@/components/FavoriteButton";
import ScorePill from "@/components/ScorePill";
import { ReasonList, openText } from "@/components/CafeCard";

const TONE = { go: "text-forest-600", ok: "text-coffee-800", wait: "text-amber2-500", closed: "text-coffee-400" } as const;

/** 지도에서 마커를 고르면 뜨는 미리보기 (데스크톱) — 결론 · 이유 · 주의 · 다음 행동까지 한 장에 */
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
  const ctx = useFitContext();
  const timeWord = hour === ctx.hour ? ctx.timeWord : `${hour}시`;
  const ex = explainFit(cafe, purpose, hour, { stayMin: ctx.stayMin, timeWord });
  const d = decision(cafe, ex, hour, timeWord === "지금" ? "지금" : `${hour}시에`);

  return (
    <div
      className="w-[360px] overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-card-lg animate-fade-up"
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

      <div className="space-y-2.5 px-4 pb-4">
        <div className="flex items-center gap-2.5">
          <ScorePill score={ex.score} muted={!ex.open} />
          <p className={`text-body font-bold ${TONE[d.tone]}`}>{d.title}</p>
        </div>
        {ex.open && <ReasonList items={ex.pros} max={3} />}
        {ex.cons[0] && (
          <p className="flex items-center gap-1.5 text-meta font-medium text-amber2-500">
            <AlertCircle size={15} className="shrink-0" aria-hidden />
            {ex.cons[0]}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-cream-200 p-3">
        <FavoriteButton cafeId={cafe.id} />
        <Link href={`/cafe/${cafe.id}`} className="btn-secondary h-11 flex-1 px-3 text-label">
          자세히 보기
        </Link>
        {ex.open && (
          <Link href={`/cafe/${cafe.id}/plan?hour=${hour}`} className="btn-primary h-11 flex-[1.3] px-3 text-label">
            {hour}시에 작업하기
            <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </div>
  );
}
