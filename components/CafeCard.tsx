"use client";

import Link from "next/link";
import { CalendarCheck2 } from "lucide-react";
import type { Cafe, Plan, Purpose } from "@/lib/types";
import { AREA_MAP } from "@/lib/data/cafes";
import { distanceKm, formatDistance, isOpenAt } from "@/lib/scoring";
import { fitReasons, fitScore } from "@/lib/fit";
import { hm, relativeDate } from "@/lib/time";
import CafePhoto from "@/components/CafePhoto";
import FavoriteButton from "@/components/FavoriteButton";
import ScorePill from "@/components/ScorePill";

/** 영업 상태를 한 구절로: "22시까지" / "11시 오픈" / "영업 종료" */
export function openText(cafe: Cafe, hour: number): string {
  if (isOpenAt(cafe, hour)) return cafe.close === 24 ? "자정까지" : `${cafe.close}시까지`;
  return hour < cafe.open ? `${cafe.open}시 오픈` : "영업 종료";
}

/**
 * 카페 카드. 결론(적합도)과 이유 한 줄만 보여주고
 * 세부 지표는 상세 화면으로 넘긴다.
 *
 * - row : 지도 목록 · 바텀시트 (가로형)
 * - tile: 저장 목록 (사진형)
 */
export default function CafeCard({
  cafe,
  purpose,
  hour,
  plan,
  now = null,
  variant = "row",
  highlighted = false,
  onHover,
  footer,
}: {
  cafe: Cafe;
  purpose: Purpose;
  hour: number;
  /** 이 카페의 예정된 작업 계획 */
  plan?: Plan | null;
  now?: Date | null;
  variant?: "row" | "tile";
  highlighted?: boolean;
  onHover?: (id: string | null) => void;
  /** tile 하단에 붙는 보조 행동 (예: 비교 담기) */
  footer?: React.ReactNode;
}) {
  const open = isOpenAt(cafe, hour);
  const score = fitScore(cafe, purpose, hour);
  const reasons = fitReasons(cafe, purpose, hour, 2);
  const where = `${AREA_MAP[cafe.area].name} · ${formatDistance(distanceKm(cafe.lat, cafe.lng))}`;

  const reasonLine = !open ? (
    <span className="text-coffee-400">이 시간엔 영업하지 않아요</span>
  ) : reasons.length ? (
    <span className="text-coffee-600">{reasons.join(" · ")}</span>
  ) : (
    <span className="text-coffee-400">무난한 작업 환경</span>
  );

  const planLine = plan ? (
    <span className="flex items-center gap-1 text-meta font-semibold text-coffee-800">
      <CalendarCheck2 size={15} className="shrink-0" />
      <span className="num">
        {relativeDate(plan.date, now)} {hm(plan.startHour)} 작업 예정
      </span>
    </span>
  ) : null;

  if (variant === "tile") {
    return (
      <article
        className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition-shadow duration-200 hover:shadow-card-lg ${
          highlighted ? "border-coffee-500" : "border-cream-300/80"
        }`}
      >
        <Link href={`/cafe/${cafe.id}`} className="block focus-visible:outline-none">
          <div className="relative">
            <CafePhoto cafe={cafe} className="aspect-[4/3] w-full" sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 400px" />
          </div>
          <div className="space-y-1.5 px-4 pb-3 pt-3.5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="truncate text-title text-coffee-900">{cafe.name}</h3>
              <ScorePill score={score} muted={!open} />
            </div>
            <p className="text-meta text-coffee-400">
              {where} · <span className="num">{openText(cafe, hour)}</span>
            </p>
            <p className="line-clamp-1 text-meta">{reasonLine}</p>
            {planLine}
          </div>
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-cream-200 px-4 py-2.5">
          {footer ?? <span />}
          <FavoriteButton cafeId={cafe.id} />
        </div>
      </article>
    );
  }

  return (
    <article
      data-cafe-card={cafe.id}
      onMouseEnter={() => onHover?.(cafe.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`relative scroll-my-4 rounded-2xl border bg-white transition-[border-color,box-shadow] duration-200 hover:shadow-card ${
        highlighted ? "border-coffee-600 shadow-card" : "border-cream-300/80"
      } ${open ? "" : "opacity-75"}`}
    >
      <Link
        href={`/cafe/${cafe.id}`}
        className="flex gap-3.5 rounded-2xl p-3 pr-14 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coffee-600"
      >
        <CafePhoto cafe={cafe} className="h-[84px] w-[84px] shrink-0 rounded-xl" sizes="84px" overlay={false} />
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-title text-coffee-900">{cafe.name}</h3>
          <p className="truncate text-meta text-coffee-400">
            {where} · <span className="num">{openText(cafe, hour)}</span>
          </p>
          <div className="flex min-w-0 items-center gap-2 text-meta">
            <ScorePill score={score} muted={!open} />
            {/* flex 자식은 min-w-0이 있어야 말줄임이 되고 카드 밖으로 넘치지 않는다 */}
            <span className="min-w-0 truncate">{reasonLine}</span>
          </div>
          {planLine}
        </div>
      </Link>
      <FavoriteButton cafeId={cafe.id} className="absolute right-3 top-3" />
    </article>
  );
}
