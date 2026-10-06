"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, AlertCircle, Laptop, BookOpen, Users, Mail, BookMarked, RotateCcw } from "lucide-react";
import type { Purpose, PriorityKey, StayLength } from "@/lib/types";
import { PRIORITIES, STAY_OPTIONS, recommend, type RecommendResult } from "@/lib/recommendation";
import { PURPOSES, PURPOSE_LABEL, fitCaution, verdict } from "@/lib/fit";
import { AREA_MAP } from "@/lib/data/cafes";
import { distanceKm, formatDistance } from "@/lib/scoring";
import { useApp } from "@/lib/store";
import { useFitContext } from "@/lib/useFitContext";
import CafePhoto from "@/components/CafePhoto";
import CafeCard from "@/components/CafeCard";
import ScorePill from "@/components/ScorePill";
import FavoriteButton from "@/components/FavoriteButton";

const PURPOSE_ICON: Record<Purpose, typeof Laptop> = {
  focus: Laptop,
  study: BookOpen,
  meeting: Users,
  light: Mail,
  reading: BookMarked,
};

const STEPS = ["작업 목적", "중요한 조건", "머무는 시간"];

export default function RecommendPage() {
  const { prefs, setPrefs } = useApp();
  const { hour, now, timeLabel } = useFitContext();
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [priorities, setPriorities] = useState<PriorityKey[] | null>(null);
  const [stay, setStay] = useState<StayLength | null>(null);
  const [results, setResults] = useState<RecommendResult[] | null>(null);

  // 처음엔 저장된 선호 조건으로 채워 둔다 (다시 들어와도 이어서 고를 수 있게)
  const curPurpose = purpose ?? prefs.purpose;
  const curPriorities = priorities ?? prefs.priorities;
  const curStay = stay ?? prefs.stay;

  const run = () => {
    const next = { purpose: curPurpose, priorities: curPriorities, stay: curStay };
    setPrefs(next);
    setResults(recommend({ ...next, hour }));
    setStep(3);
  };

  const restart = () => {
    setResults(null);
    setStep(0);
  };

  const top = results?.[0];
  const rest = results?.slice(1) ?? [];

  return (
    <div className="h-full overflow-y-auto bg-cream-50">
      <div className="mx-auto max-w-3xl px-4 pb-14 pt-6 sm:px-6 lg:pt-8">
        {step < 3 && (
          <>
            <header>
              <h1 className="text-page text-coffee-900">맞춤 추천</h1>
              <p className="mt-1 text-meta text-coffee-400">
                세 가지만 고르면 {timeLabel.replace(" 기준", "")} 기준으로 가장 잘 맞는 곳을 골라드려요.
              </p>
            </header>
            <ol className="mt-6 flex items-center gap-2" aria-label="진행 단계">
              {STEPS.map((label, i) => (
                <li key={label} className="flex flex-1 flex-col gap-1.5">
                  <span className={`h-1 rounded-full ${i <= step ? "bg-coffee-800" : "bg-cream-300"}`} />
                  <span className={`text-caption ${i === step ? "font-bold text-coffee-900" : "text-coffee-400"}`}>
                    {i + 1}. {label}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}

        {/* ---------- 1. 목적 ---------- */}
        {step === 0 && (
          <section className="mt-8 animate-fade-up">
            <h2 className="text-section text-coffee-900">오늘은 어떤 작업을 하나요?</h2>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {PURPOSES.map((p) => {
                const Icon = PURPOSE_ICON[p.key];
                const active = curPurpose === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setPurpose(p.key);
                      // 하나만 고르는 단계라 고르면 바로 다음으로 (선택 표시가 보이도록 잠깐 뒤에)
                      window.setTimeout(() => setStep(1), 160);
                    }}
                    aria-pressed={active}
                    className={`flex items-center gap-4 rounded-2xl border bg-white p-4 text-left transition-colors ${
                      active ? "border-coffee-800 ring-1 ring-coffee-800" : "border-cream-300 hover:border-coffee-300"
                    }`}
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? "bg-coffee-800 text-cream-50" : "bg-cream-100 text-coffee-500"}`}>
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-title text-coffee-900">{p.label}</span>
                      <span className="block text-meta text-coffee-400">{p.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-end">
              <button type="button" onClick={() => setStep(1)} className="btn-primary">
                다음 <ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}

        {/* ---------- 2. 조건 ---------- */}
        {step === 1 && (
          <section className="mt-8 animate-fade-up">
            <h2 className="text-section text-coffee-900">특히 중요한 조건이 있나요?</h2>
            <p className="mt-1 text-meta text-coffee-400">최대 3개 · 고르지 않아도 괜찮아요</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {PRIORITIES.map((p) => {
                const on = curPriorities.includes(p.key);
                const full = !on && curPriorities.length >= 3;
                return (
                  <button
                    key={p.key}
                    type="button"
                    disabled={full}
                    onClick={() =>
                      setPriorities(on ? curPriorities.filter((k) => k !== p.key) : [...curPriorities, p.key])
                    }
                    className={`chip h-11 px-4 text-body disabled:cursor-not-allowed disabled:opacity-40 ${on ? "chip-active" : "chip-idle"}`}
                    aria-pressed={on}
                  >
                    {on && <Check size={16} strokeWidth={2.6} />}
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-between">
              <button type="button" onClick={() => setStep(0)} className="btn-secondary">
                <ArrowLeft size={17} /> 이전
              </button>
              <button type="button" onClick={() => setStep(2)} className="btn-primary">
                다음 <ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}

        {/* ---------- 3. 체류 ---------- */}
        {step === 2 && (
          <section className="mt-8 animate-fade-up">
            <h2 className="text-section text-coffee-900">얼마나 머물 예정인가요?</h2>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {STAY_OPTIONS.map((s) => {
                const active = curStay === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setStay(s.key)}
                    aria-pressed={active}
                    className={`rounded-2xl border bg-white p-4 text-left transition-colors ${
                      active ? "border-coffee-800 ring-1 ring-coffee-800" : "border-cream-300 hover:border-coffee-300"
                    }`}
                  >
                    <span className="block text-title text-coffee-900">{s.label}</span>
                    <span className="block text-meta text-coffee-400">{s.desc}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                <ArrowLeft size={17} /> 이전
              </button>
              <button type="button" onClick={run} className="btn-primary">
                추천 받기
              </button>
            </div>
          </section>
        )}

        {/* ---------- 결과: 결론 → 이유 → 행동 ---------- */}
        {step === 3 && results && (
          <section className="animate-fade-up">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-meta text-coffee-400">
                  {PURPOSE_LABEL[curPurpose]} · {timeLabel.replace(" 기준", "")} 기준
                </p>
                <h1 className="mt-1 text-page text-coffee-900">여기가 가장 잘 맞아요</h1>
              </div>
              <button type="button" onClick={restart} className="btn-quiet shrink-0 text-label">
                <RotateCcw size={15} /> 다시 고르기
              </button>
            </div>

            {!top ? (
              <p className="mt-6 rounded-xl bg-white px-4 py-4 text-body text-coffee-600">
                이 시간에 영업 중인 카페가 없어요. 지도에서 다른 시간을 골라보세요.
              </p>
            ) : (
              <article className="mt-6 overflow-hidden rounded-2xl border border-cream-300/80 bg-white">
                <div className="relative">
                  <CafePhoto cafe={top.cafe} variant="wide" className="aspect-[16/9] w-full sm:aspect-[2.2/1]" sizes="(max-width: 768px) 100vw, 720px" />
                  <FavoriteButton cafeId={top.cafe.id} onImage className="absolute right-3 top-3" />
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-section text-coffee-900">{top.cafe.name}</h2>
                      <p className="mt-0.5 text-meta text-coffee-400">
                        {AREA_MAP[top.cafe.area].name} · {formatDistance(distanceKm(top.cafe.lat, top.cafe.lng))}
                      </p>
                    </div>
                    <ScorePill score={top.score} size="lg" />
                  </div>
                  <p className="mt-4 text-title text-coffee-800">{verdict(top.cafe, hour)}</p>
                  <ul className="mt-3 space-y-2">
                    {top.reasons.map((r) => (
                      <li key={r} className="flex items-center gap-2 text-body text-coffee-700">
                        <Check size={17} strokeWidth={2.6} className="shrink-0 text-forest-600" />
                        {r}
                      </li>
                    ))}
                  </ul>
                  {fitCaution(top.cafe, hour) && (
                    <p className="mt-3 flex items-center gap-2 text-meta font-medium text-amber2-500">
                      <AlertCircle size={16} className="shrink-0" />
                      {fitCaution(top.cafe, hour)}
                    </p>
                  )}
                  <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                    <Link href={`/cafe/${top.cafe.id}/plan?hour=${hour}`} className="btn-primary sm:flex-1">
                      {hour}시에 여기서 작업하기
                    </Link>
                    <Link href={`/cafe/${top.cafe.id}`} className="btn-secondary sm:flex-1">
                      자세히 보기
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {rest.length > 0 && (
              <div className="mt-10">
                <h2 className="text-title text-coffee-900">다른 후보</h2>
                <div className="mt-3 space-y-2.5">
                  {rest.map((r) => (
                    <CafeCard key={r.cafe.id} cafe={r.cafe} purpose={curPurpose} hour={hour} now={now} />
                  ))}
                </div>
              </div>
            )}

            <p className="mt-8 rounded-xl bg-cream-100 px-4 py-3 text-meta text-coffee-500">
              고른 조건을 저장했어요. 지도에서도 &lsquo;{PURPOSE_LABEL[curPurpose]}&rsquo; 기준 적합도로 보여드려요. ·{" "}
              <Link href="/" className="font-semibold text-coffee-800 underline underline-offset-4">
                지도에서 보기
              </Link>
              <span className="mt-1 block text-caption text-coffee-400">조건 기반 추천(규칙 기반) · 데모 데이터</span>
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
