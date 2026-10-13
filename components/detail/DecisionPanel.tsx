"use client";

import { useState } from "react";
import { AlertCircle, Check, ChevronDown } from "lucide-react";
import type { Cafe, Purpose } from "@/lib/types";
import { decision, PURPOSES, verdict, type FitExplanation } from "@/lib/fit";
import { formatDuration } from "@/lib/time";
import ScorePill from "@/components/ScorePill";

const TONE = { go: "text-forest-600", ok: "text-coffee-900", wait: "text-amber2-500", closed: "text-coffee-500" } as const;

const level = (v: number) => (v >= 75 ? "좋음" : v >= 60 ? "보통" : "아쉬움");

/**
 * 상세 맨 위의 결론 패널 — "그래서 여기 갈 만한가?"
 * 결론 한 문장 → 좋은 점 → 주의 → (펼치면) 점수가 어떻게 나왔는지.
 * 목적은 이 자리에서 바로 바꿀 수 있고, 다른 시간을 골랐다면 되돌릴 수 있다.
 */
export default function DecisionPanel({
  cafe,
  ex,
  hour,
  timeWord,
  purpose,
  onPurpose,
  picked,
  onResetHour,
  stayMin,
  stayFromHistory,
  ready,
}: {
  cafe: Cafe;
  ex: FitExplanation;
  hour: number;
  timeWord: string;
  purpose: Purpose;
  onPurpose: (p: Purpose) => void;
  picked: boolean;
  onResetHour: () => void;
  stayMin: number;
  stayFromHistory: boolean;
  ready: boolean;
}) {
  const [why, setWhy] = useState(false);

  if (!ready) {
    return (
      <div className="space-y-3" aria-busy>
        <div className="h-3.5 w-40 animate-pulse rounded bg-cream-200" />
        <div className="flex items-center gap-4">
          <div className="h-[74px] w-[72px] animate-pulse rounded-2xl bg-cream-200" />
          <div className="h-6 flex-1 animate-pulse rounded bg-cream-200" />
        </div>
        <div className="h-4 w-2/3 animate-pulse rounded bg-cream-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-cream-200" />
      </div>
    );
  }

  const d = decision(cafe, ex, hour, timeWord === "지금" ? "지금" : `${hour}시에`);
  const maxW = Math.max(...ex.factors.map((f) => f.weight));

  return (
    <div>
      {/* 판단 기준: 시간 · 목적(바로 변경) · 머무는 시간 */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-meta text-coffee-500">
        <span className="num font-semibold text-coffee-700">{timeWord === "지금" ? `지금 ${hour}시` : `${hour}시 도착`}</span>
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
        <span aria-hidden>·</span>
        <span className="num">{formatDuration(stayMin)}</span>
        {picked && (
          <button type="button" onClick={onResetHour} className="ml-auto font-semibold text-coffee-700 underline underline-offset-4">
            지금 기준으로
          </button>
        )}
      </div>

      {/* 결론 */}
      <div className="mt-3 flex items-center gap-4">
        <ScorePill score={ex.score} muted={!ex.open} size="lg" />
        <div className="min-w-0">
          <p className={`text-section ${TONE[d.tone]}`}>{d.title}</p>
          {ex.open && <p className="mt-0.5 text-meta text-coffee-500">{verdict(cafe, hour)}</p>}
        </div>
      </div>

      {/* 이유 → 주의 */}
      {(ex.open && ex.pros.length > 0) || ex.cons.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {ex.open &&
            ex.pros.slice(0, 3).map((r) => (
              <li key={r} className="flex items-center gap-2 text-body text-coffee-800">
                <Check size={17} strokeWidth={2.6} className="shrink-0 text-forest-600" aria-hidden />
                {r}
              </li>
            ))}
          {ex.cons.map((c) => (
            <li key={c} className="flex items-center gap-2 text-body font-medium text-amber2-500">
              <AlertCircle size={17} className="shrink-0" aria-hidden />
              {c}
            </li>
          ))}
        </ul>
      ) : null}

      {/* 왜 이 점수인가 — 항목별 비중과 지금 시간대 값 */}
      <button
        type="button"
        onClick={() => setWhy((v) => !v)}
        aria-expanded={why}
        className="mt-4 flex items-center gap-1 text-label text-coffee-600 underline-offset-4 hover:underline"
      >
        왜 <span className="num">{ex.score}</span>점인가요?
        <ChevronDown size={15} className={`transition-transform ${why ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {why && (
        <div className="mt-3 space-y-2.5 rounded-xl bg-cream-100 px-4 py-3.5">
          {ex.factors.map((f) => (
            <div key={f.key} className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 text-meta">
              <span className="truncate text-coffee-700">
                {f.label} <span className="num text-coffee-400">{Math.round(f.weight * 100)}%</span>
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-cream-300" aria-hidden>
                {/* 막대 길이 = 항목 점수, 진하기 = 목적에서의 비중 */}
                <span
                  className="block h-full rounded-full bg-coffee-700"
                  style={{ width: `${f.value}%`, opacity: 0.35 + 0.65 * (f.weight / maxW) }}
                />
              </span>
              <span className="text-right font-semibold text-coffee-800">{level(f.value)}</span>
            </div>
          ))}
          {ex.stayAdjust !== 0 && ex.stayNote && (
            <p className="flex items-start gap-2 border-t border-cream-300 pt-2.5 text-meta text-coffee-700">
              <span className={`num font-bold ${ex.stayAdjust > 0 ? "text-forest-600" : "text-amber2-500"}`}>
                {ex.stayAdjust > 0 ? "+" : "−"}
                {Math.abs(ex.stayAdjust)}
              </span>
              {ex.stayNote}
            </p>
          )}
          <p className="text-caption text-coffee-400">
            목적별 비중 × 항목 점수. 소음·혼잡은 도착부터 {formatDuration(stayMin)} 동안의 시간대 예측
            {stayFromHistory ? "(머무는 시간은 내 작업 기록 평균)" : ""}이에요. 규칙 기반 계산 · 데모 데이터
          </p>
        </div>
      )}
    </div>
  );
}
