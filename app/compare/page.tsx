"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Scale, X, Plus, Check, ArrowRight, Trophy } from "lucide-react";
import type { Cafe } from "@/lib/types";
import { CAFES, AREA_MAP } from "@/lib/data/cafes";
import {
  distanceKm,
  formatDistance,
  formatHours,
  formatStay,
  hourlyAt,
  isOpenAt,
  levelOf,
  metricLabel,
  noiseLabel,
  outletLabel,
} from "@/lib/scoring";
import { fitReasons, fitScore, PURPOSE_LABEL, rankByFit } from "@/lib/fit";
import { useApp } from "@/lib/store";
import { useFitContext } from "@/lib/useFitContext";
import CafePhoto from "@/components/CafePhoto";
import EmptyState from "@/components/EmptyState";
import Sheet from "@/components/Sheet";
import PageSkeleton from "@/components/PageSkeleton";
import ScorePill from "@/components/ScorePill";

const CROWD_SHORT = { quiet: "한산", normal: "보통", busy: "혼잡" } as const;

interface RowDef {
  label: string;
  value: (c: Cafe, hour: number) => string;
  /** 클수록 좋은 값 — 가장 좋은 칸을 표시한다 */
  rank?: (c: Cafe, hour: number) => number;
  /** 막대 길이 0~100 — 모든 항목에서 "길수록 작업하기 좋음"으로 맞춘다 */
  bar?: (c: Cafe, hour: number) => number;
}

const clamp = (v: number) => Math.max(4, Math.min(100, v));

export default function ComparePage() {
  const { compare, toggleCompare, clearCompare, hydrated, favorites } = useApp();
  const { purpose, hour, timeLabel, stayMin, timeWord } = useFitContext();
  const [pickerOpen, setPickerOpen] = useState(false);

  const cafes = compare.map((id) => CAFES.find((c) => c.id === id)).filter((c): c is Cafe => Boolean(c));

  const rows: RowDef[] = [
    {
      label: `${hour}시 혼잡도`,
      value: (c, h) => (isOpenAt(c, h) ? CROWD_SHORT[levelOf(hourlyAt(c, h).crowd)] : "영업 외"),
      rank: (c, h) => (isOpenAt(c, h) ? -hourlyAt(c, h).crowd : -999),
      bar: (c, h) => (isOpenAt(c, h) ? clamp(100 - hourlyAt(c, h).crowd) : 0),
    },
    { label: "소음", value: (c) => noiseLabel(c.metrics.noiseScore), rank: (c) => c.metrics.noiseScore, bar: (c) => clamp(c.metrics.noiseScore) },
    { label: "콘센트", value: (c) => outletLabel(c.metrics.outletScore), rank: (c) => c.metrics.outletScore, bar: (c) => clamp(c.metrics.outletScore) },
    { label: "Wi-Fi", value: (c) => `${c.wifiMbps}Mbps`, rank: (c) => c.wifiMbps, bar: (c) => clamp((c.wifiMbps / 150) * 100) },
    {
      label: "좌석·테이블",
      value: (c) => (c.amenities.bigTable ? "넓음" : metricLabel(c.metrics.seatScore)),
      rank: (c) => c.metrics.seatScore,
      bar: (c) => clamp(c.metrics.seatScore),
    },
    { label: "평균 체류", value: (c) => formatStay(c.avgStayMinutes), rank: (c) => c.avgStayMinutes, bar: (c) => clamp((c.avgStayMinutes / 240) * 100) },
    {
      label: "거리",
      value: (c) => formatDistance(distanceKm(c.lat, c.lng)),
      rank: (c) => -distanceKm(c.lat, c.lng),
      bar: (c) => clamp((1 - Math.min(distanceKm(c.lat, c.lng), 12) / 12) * 100),
    },
  ];

  const bestIndex = (row: RowDef): number | null => {
    if (!row.rank || cafes.length < 2) return null;
    const vals = cafes.map((c) => row.rank!(c, hour));
    const max = Math.max(...vals);
    const best = vals.indexOf(max);
    // 화면에 보이는 값이 같은 칸이 있으면 강조하지 않는다 ("한산" vs "한산 ✓"처럼 모순돼 보이지 않게)
    const shown = cafes.map((c) => row.value(c, hour));
    if (shown.some((v, i) => i !== best && v === shown[best])) return null;
    return best;
  };

  const winner = cafes.length >= 2 ? rankByFit(cafes, purpose, hour, stayMin)[0] : null;
  const winnerReasons = winner ? fitReasons(winner.cafe, purpose, hour, 3, { stayMin, timeWord }) : [];

  // 이미 담은 카페도 목록에 남겨 두고 체크 표시로 켜고 끈다 (시트를 닫지 않고 여러 곳을 고를 수 있게)
  const candidates = useMemo(() => {
    const saved = rankByFit(CAFES.filter((c) => favorites.includes(c.id)), purpose, hour, stayMin);
    const others = rankByFit(CAFES.filter((c) => !favorites.includes(c.id)), purpose, hour, stayMin);
    return [...saved.map((r) => ({ ...r, saved: true })), ...others.map((r) => ({ ...r, saved: false }))];
  }, [favorites, purpose, hour, stayMin]);

  const picker = (
    <Sheet
      open={pickerOpen}
      onClose={() => setPickerOpen(false)}
      title="비교할 카페 고르기"
      description={`최대 3곳 · ${favorites.length ? "저장한 카페가 먼저 보여요" : "지금 기준 적합도순"}`}
      footer={
        <button type="button" onClick={() => setPickerOpen(false)} className="btn-primary flex-1">
          {compare.length >= 2 ? `${compare.length}곳 비교하기` : compare.length === 1 ? "1곳 더 골라주세요" : "닫기"}
        </button>
      }
    >
      <ul className="divide-y divide-cream-200">
        {candidates.map(({ cafe, score, saved }) => {
          const on = compare.includes(cafe.id);
          const full = !on && compare.length >= 3;
          return (
            <li key={cafe.id}>
              <button
                type="button"
                disabled={full}
                onClick={() => toggleCompare(cafe.id)}
                aria-pressed={on}
                className="flex w-full items-center gap-3 py-3 text-left disabled:opacity-40"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    on ? "border-coffee-800 bg-coffee-800 text-white" : "border-cream-400 bg-white"
                  }`}
                  aria-hidden
                >
                  {on && <Check size={15} strokeWidth={3} />}
                </span>
                <CafePhoto cafe={cafe} className="h-12 w-12 shrink-0 rounded-lg" sizes="48px" overlay={false} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold text-coffee-900">{cafe.name}</span>
                  <span className="block truncate text-meta text-coffee-400">
                    {AREA_MAP[cafe.area].name}
                    {saved ? " · 저장함" : ""}
                  </span>
                </span>
                <ScorePill score={score} />
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );

  if (!hydrated) return <PageSkeleton variant="compare" />;

  const slots = [0, 1, 2].map((i) => cafes[i] ?? null);

  return (
    <div className="h-full overflow-y-auto bg-cream-50">
      <div className="mx-auto max-w-5xl px-4 pb-14 pt-6 sm:px-6 lg:pt-8">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-page text-coffee-900">카페 비교</h1>
            <p className="mt-1 text-meta text-coffee-400">
              {PURPOSE_LABEL[purpose]} · {timeLabel.replace(" 기준", "")} 기준
            </p>
          </div>
          {cafes.length > 0 && (
            <button type="button" onClick={clearCompare} className="btn-quiet -mr-3 text-label">
              비우기
            </button>
          )}
        </header>

        {cafes.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-cream-400 bg-white">
            <EmptyState
              icon={Scale}
              title="비교할 카페를 2~3곳 담아보세요"
              description="고른 곳들을 시간대 혼잡·소음·콘센트까지 나란히 보고, 가장 잘 맞는 곳을 알려드려요."
              action={
                <button type="button" onClick={() => setPickerOpen(true)} className="btn-primary h-11">
                  <Plus size={17} />
                  카페 고르기
                </button>
              }
            />
          </div>
        ) : (
          <>
            {/* ---------- 비교 대상: 세 칸 (빈 칸은 추가) ---------- */}
            <ul className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-4" aria-label="비교 중인 카페">
              {slots.map((c, i) =>
                c ? (
                  <li key={c.id} className="relative min-w-0 overflow-hidden rounded-[20px] bg-white shadow-card ring-1 ring-cream-300/60">
                    <Link href={`/cafe/${c.id}`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-coffee-600">
                      <div className="relative">
                        <CafePhoto cafe={c} className="aspect-[4/3] w-full lg:aspect-[16/10]" sizes="(max-width: 640px) 33vw, 300px" overlay={false} />
                        {winner?.cafe.id === c.id && (
                          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-forest-600 px-1.5 py-0.5 text-[12px] font-bold text-white shadow-sm">
                            <Trophy size={12} aria-hidden />
                            추천
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 p-2.5 sm:p-3.5">
                        <p className="line-clamp-2 min-h-[2.6em] text-label leading-snug text-coffee-900 sm:text-title">{c.name}</p>
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                          <ScorePill score={fitScore(c, purpose, hour, stayMin)} muted={!isOpenAt(c, hour)} />
                          <span className="hidden text-meta text-coffee-400 sm:inline">{AREA_MAP[c.area].name}</span>
                        </div>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleCompare(c.id)}
                      className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-coffee-600 shadow-card hover:text-coffee-900"
                      aria-label={`${c.name} 비교에서 빼기`}
                    >
                      <X size={15} />
                    </button>
                  </li>
                ) : (
                  <li key={`empty-${i}`} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="flex h-full min-h-[150px] w-full flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 border-dashed border-cream-400 bg-white/60 text-label text-coffee-500 transition-colors hover:border-coffee-400 hover:text-coffee-800"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-100">
                        <Plus size={18} aria-hidden />
                      </span>
                      카페 추가
                    </button>
                  </li>
                )
              )}
            </ul>

            {/* ---------- 결론 ---------- */}
            {winner ? (
              <section className="mt-5 flex flex-col gap-4 rounded-[24px] bg-coffee-800 p-5 text-cream-50 shadow-card-lg sm:flex-row sm:items-center sm:p-6">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <CafePhoto cafe={winner.cafe} className="hidden h-16 w-16 shrink-0 rounded-2xl sm:block" sizes="64px" overlay={false} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-caption font-semibold text-cream-100/75">
                      <Trophy size={14} aria-hidden /> 이 조건에서 가장 잘 맞아요
                    </p>
                    <p className="mt-1 text-section">{winner.cafe.name}</p>
                    {winnerReasons.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {winnerReasons.map((r) => (
                          <li key={r} className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-caption font-medium text-cream-50">
                            <Check size={13} strokeWidth={2.8} aria-hidden />
                            {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <Link
                  href={`/cafe/${winner.cafe.id}/plan${winner.open ? `?hour=${hour}` : ""}`}
                  className="btn h-12 shrink-0 bg-white px-5 text-coffee-900 hover:bg-cream-100"
                >
                  여기서 작업하기
                  <ArrowRight size={17} />
                </Link>
              </section>
            ) : (
              <p className="mt-5 rounded-2xl bg-white px-4 py-3.5 text-meta text-coffee-500 ring-1 ring-cream-300/60">
                1곳 더 담으면 어디가 더 맞는지 알려드려요.
              </p>
            )}

            {/* ---------- 항목별 근거: 막대가 길수록 작업하기 좋음 ---------- */}
            <div className="mt-8 flex items-end justify-between gap-3">
              <h2 className="text-section text-coffee-900">항목별로 보면</h2>
              <p className="text-caption text-coffee-400">막대가 길수록 작업하기 좋아요</p>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {rows.map((row) => {
                const best = bestIndex(row);
                return (
                  <section key={row.label} className="rounded-[20px] bg-white p-4 ring-1 ring-cream-300/60" aria-label={row.label}>
                    <h3 className="text-label text-coffee-600">{row.label}</h3>
                    <ul className="mt-3 space-y-2.5">
                      {cafes.map((c, i) => {
                        const isBest = i === best;
                        return (
                          <li key={c.id} className="grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[minmax(0,8rem)_minmax(0,1fr)_auto]">
                            <span className={`truncate text-meta ${isBest ? "font-semibold text-coffee-900" : "text-coffee-500"}`}>{c.name}</span>
                            <span className="h-2 overflow-hidden rounded-full bg-cream-200" aria-hidden>
                              <span
                                className={`block h-full rounded-full transition-[width] duration-500 ${isBest ? "bg-forest-500" : "bg-coffee-300"}`}
                                style={{ width: `${row.bar?.(c, hour) ?? 0}%` }}
                              />
                            </span>
                            <span className={`num flex items-center gap-1 text-meta ${isBest ? "font-bold text-forest-700" : "text-coffee-700"}`}>
                              {row.value(c, hour)}
                              {isBest && <Check size={14} strokeWidth={2.8} aria-label="가장 좋음" />}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
              <section className="rounded-[20px] bg-white p-4 ring-1 ring-cream-300/60" aria-label="영업시간">
                <h3 className="text-label text-coffee-600">영업시간</h3>
                <ul className="mt-3 space-y-2.5">
                  {cafes.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 text-meta">
                      <span className="truncate text-coffee-500">{c.name}</span>
                      <span className="num font-semibold text-coffee-800">{formatHours(c)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <p className="mt-3 text-caption text-coffee-400">혼잡·소음은 데모 데이터 기반 예측값이에요. ✓ 표시는 항목별 가장 좋은 값이에요.</p>
          </>
        )}
      </div>
      {picker}
    </div>
  );
}
