"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, CalendarCheck2, Check, LocateFixed } from "lucide-react";
import type { Cafe, Plan, Purpose } from "@/lib/types";
import { AREA_MAP } from "@/lib/data/cafes";
import { distanceKm, formatDistance, isOpenAt } from "@/lib/scoring";
import { explainFit } from "@/lib/fit";
import { personalNote } from "@/lib/personal";
import { hm, relativeDate } from "@/lib/time";
import { useFitContext } from "@/lib/useFitContext";
import CafePhoto from "@/components/CafePhoto";
import FavoriteButton from "@/components/FavoriteButton";
import ScorePill from "@/components/ScorePill";

/** 영업 상태를 한 구절로: "22시까지" / "11시 오픈" / "영업 종료" */
export function openText(cafe: Cafe, hour: number): string {
  if (isOpenAt(cafe, hour)) return cafe.close === 24 ? "자정까지" : `${cafe.close}시까지`;
  return hour < cafe.open ? `${cafe.open}시 오픈` : "영업 종료";
}

/**
 * 카페 카드. 점수 하나보다 "왜 지금 여기인지"를 먼저 읽히게 한다.
 * 좋은 점(✓)은 지금 조건(목적·시간·머무는 시간)에서 계산한 것만, 주의(!)는 하나만.
 *
 * - pick: 지도 목록 맨 위 "가장 잘 맞는 곳" — 바로 결정할 수 있게 행동 버튼까지
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
  onLocate,
  footer,
  actions = false,
  hideLabel = false,
}: {
  cafe: Cafe;
  purpose: Purpose;
  hour: number;
  /** 이 카페의 예정된 작업 계획 */
  plan?: Plan | null;
  now?: Date | null;
  variant?: "row" | "tile" | "pick";
  highlighted?: boolean;
  onHover?: (id: string | null) => void;
  /** 지도에서 이 카페 위치 보기 (목록 ↔ 지도 오가기) */
  onLocate?: (id: string) => void;
  /** tile 하단에 붙는 보조 행동 (예: 비교 담기) */
  footer?: React.ReactNode;
  /** pick: 자세히 보기 · 여기서 작업하기 버튼 */
  actions?: boolean;
  /** pick: 위에 이미 같은 제목이 있으면 "가장 잘 맞아요" 라벨 생략 */
  hideLabel?: boolean;
}) {
  const ctx = useFitContext();
  const timeWord = hour === ctx.hour ? ctx.timeWord : `${hour}시`;
  const ex = explainFit(cafe, purpose, hour, { stayMin: ctx.stayMin, timeWord });
  const open = ex.open;
  const where = `${AREA_MAP[cafe.area].name} · ${formatDistance(distanceKm(cafe.lat, cafe.lng))}`;
  const note = personalNote(cafe, ctx.habits);

  const pros = ex.pros.slice(0, 2);
  const con = ex.cons[0];

  const reasonLine = !open ? (
    <span className="text-coffee-400">{hour < cafe.open ? `${cafe.open}시에 문을 열어요` : "이 시간엔 영업하지 않아요"}</span>
  ) : pros.length ? (
    <span className="text-coffee-700">{pros.join(" · ")}</span>
  ) : (
    <span className="text-coffee-400">무난한 작업 환경</span>
  );

  const cautionLine = open && con && (
    <p className="flex min-w-0 items-center gap-1 text-meta text-amber2-500">
      <AlertCircle size={14} className="shrink-0" aria-hidden />
      <span className="truncate">{con}</span>
    </p>
  );

  const planLine = plan ? (
    <span className="flex items-center gap-1 text-meta font-semibold text-coffee-800">
      <CalendarCheck2 size={15} className="shrink-0" />
      <span className="num">
        {relativeDate(plan.date, now)} {hm(plan.startHour)} 작업 예정
      </span>
    </span>
  ) : null;

  const meta = (
    <p className="truncate text-meta text-coffee-400">
      {where} · <span className="num">{openText(cafe, hour)}</span>
      {note && <span className="font-semibold text-coffee-600"> · {note}</span>}
    </p>
  );

  /* ---------- 가장 잘 맞는 곳 ---------- */
  if (variant === "pick") {
    return (
      <article
        data-cafe-card={cafe.id}
        data-pick
        onMouseEnter={() => onHover?.(cafe.id)}
        onMouseLeave={() => onHover?.(null)}
        className={`relative scroll-my-4 rounded-2xl border bg-white shadow-card transition-[border-color] duration-200 ${
          highlighted ? "border-coffee-600" : "border-cream-300/80"
        }`}
      >
        <Link
          href={`/cafe/${cafe.id}`}
          className="block rounded-2xl p-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coffee-600"
        >
          {!hideLabel && (
            <p className="mb-2 flex items-center gap-1.5 text-caption font-semibold text-forest-600">
              <span className="h-1.5 w-1.5 rounded-full bg-forest-600" aria-hidden />
              {timeWord === "지금" ? "지금" : `${hour}시에`} 가장 잘 맞아요
            </p>
          )}
          <div className="flex gap-3.5">
            <CafePhoto cafe={cafe} className="h-[72px] w-[72px] shrink-0 rounded-xl" sizes="72px" overlay={false} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2 pr-10">
                <h3 className="truncate text-title text-coffee-900">{cafe.name}</h3>
              </div>
              {meta}
              <div className="flex min-w-0 items-center gap-2 text-meta">
                <ScorePill score={ex.score} muted={!open} />
                <span className="min-w-0 truncate">{reasonLine}</span>
              </div>
              {cautionLine}
              {planLine}
            </div>
          </div>
        </Link>
        <FavoriteButton cafeId={cafe.id} className="absolute right-2.5 top-2.5" />
        {actions && open && (
          <div className="flex gap-2 border-t border-cream-200 px-3.5 py-3">
            {onLocate && (
              <button type="button" onClick={() => onLocate(cafe.id)} className="btn-secondary h-10 px-3 text-label" aria-label={`${cafe.name} 지도에서 보기`}>
                <LocateFixed size={16} />
              </button>
            )}
            <Link href={`/cafe/${cafe.id}`} className="btn-secondary h-10 min-w-0 flex-1 px-3 text-label">
              자세히 보기
            </Link>
            <Link href={`/cafe/${cafe.id}/plan?hour=${hour}`} className="btn-primary h-10 min-w-0 flex-1 px-3 text-label">
              {hour}시에 작업하기
              <ArrowRight size={15} className="shrink-0" />
            </Link>
          </div>
        )}
      </article>
    );
  }

  /* ---------- 사진형 ---------- */
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
            {/* 보조 행동이 없으면 하단 줄 없이 사진 위에 저장 버튼만 */}
            {!footer && <FavoriteButton cafeId={cafe.id} onImage className="absolute right-3 top-3" />}
          </div>
          <div className="space-y-1.5 px-4 pb-3 pt-3.5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="truncate text-title text-coffee-900">{cafe.name}</h3>
              <ScorePill score={ex.score} muted={!open} />
            </div>
            {meta}
            <p className="line-clamp-1 text-meta">{reasonLine}</p>
            {cautionLine}
            {planLine}
          </div>
        </Link>
        {footer && (
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-cream-200 px-4 py-2.5">
            {footer}
            <FavoriteButton cafeId={cafe.id} />
          </div>
        )}
      </article>
    );
  }

  /* ---------- 목록형 ---------- */
  return (
    <article
      data-cafe-card={cafe.id}
      onMouseEnter={() => onHover?.(cafe.id)}
      onMouseLeave={() => onHover?.(null)}
      aria-current={highlighted ? "true" : undefined}
      className={`relative scroll-my-4 rounded-2xl border bg-white transition-[border-color,box-shadow] duration-200 hover:shadow-card ${
        highlighted ? "border-coffee-600 shadow-card ring-1 ring-coffee-600" : "border-cream-300/80"
      } ${open ? "" : "opacity-75"}`}
    >
      <Link
        href={`/cafe/${cafe.id}`}
        className="flex gap-3.5 rounded-2xl p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coffee-600"
      >
        <CafePhoto cafe={cafe} className="h-[84px] w-[84px] shrink-0 rounded-xl" sizes="84px" overlay={false} />
        {/* 오른쪽 버튼 열(저장·지도)과 겹치지 않게 비워 둔다 */}
        <div className={`min-w-0 flex-1 space-y-1 ${onLocate ? "pr-10" : ""}`}>
          <h3 className="truncate pr-10 text-title text-coffee-900">{cafe.name}</h3>
          <div className={onLocate ? "" : "pr-10"}>{meta}</div>
          <div className="flex min-w-0 items-center gap-2 text-meta">
            <ScorePill score={ex.score} muted={!open} />
            <span className="min-w-0 truncate">{reasonLine}</span>
          </div>
          {cautionLine}
          {planLine}
        </div>
      </Link>
      <FavoriteButton cafeId={cafe.id} className="absolute right-2.5 top-2.5" />
      {onLocate && (
        <button
          type="button"
          onClick={() => onLocate(cafe.id)}
          className="icon-btn absolute right-2.5 top-[54px] h-10 w-10"
          aria-label={`${cafe.name} 지도에서 보기`}
          title="지도에서 보기"
        >
          <LocateFixed size={17} />
        </button>
      )}
    </article>
  );
}

/** 카드 밖에서 같은 형식으로 이유를 보여줄 때 (미리보기 등) */
export function ReasonList({ items, max = 3 }: { items: string[]; max?: number }) {
  return (
    <ul className="space-y-1">
      {items.slice(0, max).map((r) => (
        <li key={r} className="flex items-center gap-1.5 text-meta text-coffee-700">
          <Check size={15} strokeWidth={2.6} className="shrink-0 text-forest-600" aria-hidden />
          {r}
        </li>
      ))}
    </ul>
  );
}
