"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, RotateCcw, Star, Crown } from "lucide-react";
import type { Purpose, PriorityKey, StayLength } from "@/lib/types";
import {
  PURPOSES,
  PRIORITIES,
  STAY_OPTIONS,
  recommend,
  type RecommendResult,
} from "@/lib/recommendation";
import { AREA_MAP } from "@/lib/data/cafes";
import { demoHour, hourlyAt, levelOf, CROWD_LABEL, formatStay } from "@/lib/scoring";
import CafePhoto from "@/components/CafePhoto";
import WorkScoreRing from "@/components/WorkScoreRing";
import MetricBadge from "@/components/MetricBadge";
import FavoriteButton from "@/components/FavoriteButton";
import CompareButton from "@/components/CompareButton";

type Step = 0 | 1 | 2 | 3;

export default function RecommendPage() {
  const [step, setStep] = useState<Step>(0);
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [priorities, setPriorities] = useState<PriorityKey[]>([]);
  const [stay, setStay] = useState<StayLength | null>(null);
  const [results, setResults] = useState<RecommendResult[] | null>(null);
  const [hour, setHour] = useState(15);
  useEffect(() => setHour(demoHour(new Date())), []);

  const run = () => {
    if (!purpose || !stay) return;
    setResults(recommend({ purpose, priorities, stay }));
    setStep(3);
  };

  const reset = () => {
    setStep(0);
    setPurpose(null);
    setPriorities([]);
    setStay(null);
    setResults(null);
  };

  const stepLabels = ["사용 목적", "중요 요소", "체류 시간"];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-5 pb-10 lg:py-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1 text-[15.5px] font-semibold text-forest-700">
            <Sparkles size={16.5} />
            맞춤 추천
          </div>
          <h1 className="mt-2 text-[27.5px] font-bold text-coffee-800">
            내게 맞는 카페 찾기
          </h1>
          <p className="mt-1 text-[17px] text-coffee-400">
            맛있는 커피보다 오늘은 조용한 자리가 더 중요하니까.
          </p>
        </div>

        {/* 진행 표시 */}
        {step < 3 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[15.5px] font-semibold transition-colors ${
                    i === step
                      ? "bg-coffee-700 text-cream-50"
                      : i < step
                        ? "bg-forest-100 text-forest-700"
                        : "bg-cream-200 text-coffee-400"
                  }`}
                >
                  <span>{i + 1}</span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < 2 && <div className="h-px w-5 bg-cream-300" />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: 목적 */}
        {step === 0 && (
          <div className="mt-6 space-y-2.5 animate-fade-up">
            <h2 className="text-[19.5px] font-bold text-coffee-800">
              오늘은 어떤 작업을 하시나요?
            </h2>
            {PURPOSES.map((p) => (
              <button
                key={p.key}
                onClick={() => setPurpose(p.key)}
                className={`flex w-full items-center gap-3.5 rounded-2xl border bg-white p-4 text-left transition-all duration-200 hover:shadow-card ${
                  purpose === p.key
                    ? "border-coffee-600 ring-2 ring-coffee-600/15"
                    : "border-cream-200"
                }`}
                aria-pressed={purpose === p.key}
              >
                <span className="text-[28.5px]">{p.emoji}</span>
                <span>
                  <span className="block text-[19px] font-bold text-coffee-800">
                    {p.label}
                  </span>
                  <span className="text-[16.5px] text-coffee-400">{p.desc}</span>
                </span>
              </button>
            ))}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => purpose && setStep(1)}
                disabled={!purpose}
                className="flex items-center gap-1.5 rounded-full bg-coffee-700 px-5 py-2.5 text-[17.5px] font-semibold text-cream-50 transition-all enabled:hover:bg-coffee-600 disabled:opacity-40"
              >
                다음 <ArrowRight size={19} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 우선순위 */}
        {step === 1 && (
          <div className="mt-6 space-y-3 animate-fade-up">
            <h2 className="text-[19.5px] font-bold text-coffee-800">
              특히 중요한 요소를 골라주세요{" "}
              <span className="text-[15.5px] font-medium text-coffee-400">(최대 3개)</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => {
                const on = priorities.includes(p.key);
                return (
                  <button
                    key={p.key}
                    onClick={() =>
                      setPriorities((prev) =>
                        on
                          ? prev.filter((k) => k !== p.key)
                          : prev.length >= 3
                            ? prev
                            : [...prev, p.key]
                      )
                    }
                    className={`chip px-4 py-2.5 text-[18px] ${on ? "chip-active" : "chip-idle"}`}
                    aria-pressed={on}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-1.5 rounded-full border border-cream-300 bg-white px-5 py-2.5 text-[17.5px] font-semibold text-coffee-600 transition-colors hover:border-coffee-300"
              >
                <ArrowLeft size={19} /> 이전
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 rounded-full bg-coffee-700 px-5 py-2.5 text-[17.5px] font-semibold text-cream-50 transition-colors hover:bg-coffee-600"
              >
                다음 <ArrowRight size={19} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 체류시간 */}
        {step === 2 && (
          <div className="mt-6 space-y-2.5 animate-fade-up">
            <h2 className="text-[19.5px] font-bold text-coffee-800">
              얼마나 머무를 예정인가요?
            </h2>
            {STAY_OPTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setStay(s.key)}
                className={`w-full rounded-2xl border bg-white p-4 text-left text-[19px] font-bold text-coffee-800 transition-all duration-200 hover:shadow-card ${
                  stay === s.key
                    ? "border-coffee-600 ring-2 ring-coffee-600/15"
                    : "border-cream-200"
                }`}
                aria-pressed={stay === s.key}
              >
                {s.label}
              </button>
            ))}
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 rounded-full border border-cream-300 bg-white px-5 py-2.5 text-[17.5px] font-semibold text-coffee-600 transition-colors hover:border-coffee-300"
              >
                <ArrowLeft size={19} /> 이전
              </button>
              <button
                onClick={run}
                disabled={!stay}
                className="flex items-center gap-1.5 rounded-full bg-forest-600 px-5 py-2.5 text-[17.5px] font-semibold text-white transition-all enabled:hover:bg-forest-700 disabled:opacity-40"
              >
                <Sparkles size={19} /> 추천 받기
              </button>
            </div>
          </div>
        )}

        {/* 결과 */}
        {step === 3 && results && (
          <div className="mt-6 space-y-3.5 animate-fade-up">
            <div className="flex items-center justify-between">
              <h2 className="text-[19.5px] font-bold text-coffee-800">
                지금 {hour}시, 이 카페를 추천해요
              </h2>
              <button
                onClick={reset}
                className="flex items-center gap-1 text-[16.5px] font-semibold text-coffee-400 transition-colors hover:text-coffee-700"
              >
                <RotateCcw size={16.5} /> 다시 하기
              </button>
            </div>
            {results.map((r, i) => {
              const crowdLv = levelOf(hourlyAt(r.cafe, hour).crowd);
              return (
                <div
                  key={r.cafe.id}
                  className={`relative overflow-hidden rounded-2xl border bg-white shadow-card transition-all duration-300 hover:shadow-card-lg ${
                    i === 0 ? "border-forest-500 ring-2 ring-forest-500/15" : "border-cream-200"
                  }`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <Link href={`/cafe/${r.cafe.id}`} className="flex gap-3.5 p-3.5">
                    <div className="relative shrink-0">
                      <CafePhoto cafe={r.cafe} className="h-24 w-24 rounded-xl" sizes="96px" />
                      <span
                        className={`absolute -left-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-[15.5px] font-bold text-white shadow-marker ${
                          i === 0 ? "bg-forest-600" : "bg-coffee-500"
                        }`}
                      >
                        {i === 0 ? <Crown size={16.5} /> : i + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-[19.5px] font-bold text-coffee-800">
                            {r.cafe.name}
                          </h3>
                          <div className="mt-0.5 flex items-center gap-1 text-[15px] text-coffee-400">
                            <Star size={13} className="fill-amber2-400 text-amber2-400" />
                            {r.cafe.rating.toFixed(1)} · {AREA_MAP[r.cafe.area].name} ·{" "}
                            평균 {formatStay(r.cafe.avgStayMinutes)} ·{" "}
                            {CROWD_LABEL[crowdLv]}
                          </div>
                        </div>
                        <WorkScoreRing score={r.score} size={67.5} label="적합도" animate={i === 0} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.reasons.map((reason) => (
                          <MetricBadge key={reason} label={reason} tone="green" />
                        ))}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 border-t border-cream-100 px-3.5 py-2.5">
                    <Link
                      href={`/cafe/${r.cafe.id}`}
                      className="flex-1 rounded-xl bg-coffee-700 py-2 text-center text-[16.5px] font-semibold text-cream-50 transition-colors hover:bg-coffee-600"
                    >
                      상세 보기
                    </Link>
                    <CompareButton cafeId={r.cafe.id} />
                    <FavoriteButton cafeId={r.cafe.id} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
