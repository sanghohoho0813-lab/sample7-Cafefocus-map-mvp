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
import ScorePill from "@/components/ScorePill";

const CROWD_SHORT = { quiet: "한산", normal: "보통", busy: "혼잡" } as const;

interface RowDef {
  label: string;
  value: (c: Cafe, hour: number) => string;
  /** 클수록 좋은 값 — 가장 좋은 칸을 표시한다 */
  rank?: (c: Cafe, hour: number) => number;
}

export default function ComparePage() {
  const { compare, toggleCompare, clearCompare, hydrated, favorites } = useApp();
  const { purpose, hour, timeLabel } = useFitContext();
  const [pickerOpen, setPickerOpen] = useState(false);

  const cafes = compare.map((id) => CAFES.find((c) => c.id === id)).filter((c): c is Cafe => Boolean(c));

  const rows: RowDef[] = [
    { label: "적합도", value: (c, h) => String(fitScore(c, purpose, h)), rank: (c, h) => fitScore(c, purpose, h) },
    {
      label: `${hour}시 혼잡도`,
      value: (c, h) => (isOpenAt(c, h) ? CROWD_SHORT[levelOf(hourlyAt(c, h).crowd)] : "영업 외"),
      rank: (c, h) => (isOpenAt(c, h) ? -hourlyAt(c, h).crowd : -999),
    },
    { label: "소음", value: (c) => noiseLabel(c.metrics.noiseScore), rank: (c) => c.metrics.noiseScore },
    { label: "콘센트", value: (c) => outletLabel(c.metrics.outletScore), rank: (c) => c.metrics.outletScore },
    { label: "Wi-Fi", value: (c) => `${c.wifiMbps}Mbps`, rank: (c) => c.wifiMbps },
    { label: "좌석·테이블", value: (c) => (c.amenities.bigTable ? "넓음" : metricLabel(c.metrics.seatScore)), rank: (c) => c.metrics.seatScore },
    { label: "평균 체류", value: (c) => formatStay(c.avgStayMinutes), rank: (c) => c.avgStayMinutes },
    { label: "거리", value: (c) => formatDistance(distanceKm(c.lat, c.lng)), rank: (c) => -distanceKm(c.lat, c.lng) },
    { label: "영업시간", value: (c) => formatHours(c) },
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

  const winner = cafes.length >= 2 ? rankByFit(cafes, purpose, hour)[0] : null;
  const winnerReasons = winner ? fitReasons(winner.cafe, purpose, hour, 3) : [];

  // 이미 담은 카페도 목록에 남겨 두고 체크 표시로 켜고 끈다 (시트를 닫지 않고 여러 곳을 고를 수 있게)
  const candidates = useMemo(() => {
    const saved = rankByFit(CAFES.filter((c) => favorites.includes(c.id)), purpose, hour);
    const others = rankByFit(CAFES.filter((c) => !favorites.includes(c.id)), purpose, hour);
    return [...saved.map((r) => ({ ...r, saved: true })), ...others.map((r) => ({ ...r, saved: false }))];
  }, [favorites, purpose, hour]);

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

  if (!hydrated) return <div className="h-full bg-cream-50" aria-busy />;

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
            <div className="flex items-center gap-1">
              {cafes.length < 3 && (
                <button type="button" onClick={() => setPickerOpen(true)} className="btn-quiet text-label sm:hidden">
                  <Plus size={16} /> 추가
                </button>
              )}
              <button type="button" onClick={clearCompare} className="btn-quiet text-label">
                비우기
              </button>
            </div>
          )}
        </header>

        {cafes.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-cream-400 bg-white">
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
            {/* ---------- 결론 ---------- */}
            {winner ? (
              <section className="mt-6 flex flex-col gap-5 rounded-2xl bg-coffee-800 p-5 text-cream-50 sm:flex-row sm:items-center sm:p-6">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-caption font-semibold text-cream-100/70">
                    <Trophy size={14} /> 이 조건에서 가장 잘 맞아요
                  </p>
                  <p className="mt-1 text-section">{winner.cafe.name}</p>
                  <p className="mt-1 text-meta text-cream-100/80">
                    적합도 <b className="num text-white">{winner.score}</b>
                    {winnerReasons.length > 0 && ` · ${winnerReasons.join(" · ")}`}
                  </p>
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
              <p className="mt-6 rounded-xl bg-white px-4 py-3 text-meta text-coffee-500">
                1곳 더 담으면 어디가 더 맞는지 알려드려요.
              </p>
            )}

            {/* ---------- 근거 표 ---------- */}
            <div className="mt-6 overflow-x-auto rounded-2xl border border-cream-300/80 bg-white">
              {/* 2곳은 모바일 폭에 맞추고, 3곳일 때만 가로 스크롤 */}
              <table className={`w-full table-fixed border-collapse text-left ${cafes.length >= 3 ? "min-w-[600px]" : "sm:min-w-[560px]"}`}>
                <caption className="sr-only">카페별 작업 환경 비교</caption>
                <thead>
                  <tr>
                    <th scope="col" className="sticky left-0 z-10 w-[84px] bg-white p-3 align-bottom text-meta font-medium text-coffee-400 sm:w-28 sm:p-4">
                      항목
                    </th>
                    {cafes.map((c) => (
                      <th key={c.id} scope="col" className="p-3 align-top sm:p-4">
                        <div className="relative">
                          <CafePhoto cafe={c} className="aspect-[4/3] w-full rounded-xl" sizes="220px" overlay={false} />
                          <button
                            type="button"
                            onClick={() => toggleCompare(c.id)}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-coffee-600 shadow-card hover:text-coffee-900"
                            aria-label={`${c.name} 비교에서 빼기`}
                          >
                            <X size={15} />
                          </button>
                        </div>
                        <Link href={`/cafe/${c.id}`} className="mt-2.5 block break-keep text-title text-coffee-900 hover:underline">
                          {c.name}
                        </Link>
                        <span className="text-meta font-normal text-coffee-400">{AREA_MAP[c.area].name}</span>
                      </th>
                    ))}
                    {cafes.length < 3 && (
                      <th scope="col" className="hidden p-4 align-top sm:table-cell">
                        <button
                          type="button"
                          onClick={() => setPickerOpen(true)}
                          className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cream-400 text-label text-coffee-500 transition-colors hover:border-coffee-400 hover:text-coffee-800"
                        >
                          <Plus size={20} />
                          카페 추가
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const best = bestIndex(row);
                    return (
                      <tr key={row.label} className="border-t border-cream-200">
                        <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-3 text-meta font-medium text-coffee-500 sm:px-4">
                          {row.label}
                        </th>
                        {cafes.map((c, i) => (
                          <td
                            key={c.id}
                            className={`px-3 py-3 text-body tabular-nums sm:px-4 ${i === best ? "font-bold text-coffee-900" : "text-coffee-700"}`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              {row.label === "적합도" ? <ScorePill score={fitScore(c, purpose, hour)} muted={!isOpenAt(c, hour)} /> : row.value(c, hour)}
                              {i === best && row.label !== "적합도" && (
                                <Check size={15} strokeWidth={2.8} className="text-forest-600" aria-label="가장 좋음" />
                              )}
                            </span>
                          </td>
                        ))}
                        {cafes.length < 3 && <td className="hidden sm:table-cell" />}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-caption text-coffee-400">혼잡·소음은 데모 데이터 기반 예측값이에요. ✓ 표시는 항목별 가장 좋은 값이에요.</p>
          </>
        )}
      </div>
      {picker}
    </div>
  );
}
