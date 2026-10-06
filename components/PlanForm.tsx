"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import type { Cafe, Purpose } from "@/lib/types";
import { AREA_MAP, CAFE_MAP } from "@/lib/data/cafes";
import { formatHours, hourlyAt, isOpenAt, levelOf } from "@/lib/scoring";
import { fitScore, PURPOSES, PURPOSE_LABEL } from "@/lib/fit";
import { DURATION_OPTIONS, findConflict, isPastSlot, maxDurationFor, startHoursFor } from "@/lib/plans";
import { addDays, dateKey, dateWithRelative, formatDate, formatDuration, timeRange } from "@/lib/time";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import CafePhoto from "@/components/CafePhoto";
import ScorePill from "@/components/ScorePill";

const LEVEL_WORD = { quiet: "한산", normal: "보통", busy: "혼잡" } as const;
const CROWD_PHRASE = { quiet: "자리가 여유 있고", normal: "자리가 적당히 차 있고", busy: "붐비고" } as const;
const NOISE_PHRASE = { quiet: "조용한 편이에요", normal: "소음은 보통이에요", busy: "시끄러운 편이에요" } as const;

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-cream-300/70 py-6">
      {/* legend 하나로 시각 제목과 접근성 이름을 함께 제공 (중복 렌더링 없음) */}
      <legend className="mb-3.5 float-left w-full">
        <span className="flex items-baseline gap-2.5">
          <span className="num text-label text-coffee-400" aria-hidden>
            {n}
          </span>
          <span className="text-title text-coffee-900">{title}</span>
          {hint && <span className="text-meta text-coffee-400">{hint}</span>}
        </span>
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

export default function PlanForm({ cafe }: { cafe: Cafe }) {
  const router = useRouter();
  const params = useSearchParams();
  const now = useNow();
  const { prefs, plans, createPlan, showToast, hydrated } = useApp();

  const hours = useMemo(() => startHoursFor(cafe), [cafe]);
  const todayKey = now ? dateKey(now) : null;
  const tomorrowKey = now ? dateKey(addDays(now, 1)) : null;

  const [date, setDate] = useState<string | null>(null);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState(120);
  const [purpose, setPurpose] = useState<Purpose>(prefs.purpose);
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);
  const initialized = useRef(false);

  const todayHasSlots = todayKey ? hours.some((h) => !isPastSlot(todayKey, h, now)) : true;

  // 첫 진입: 상세에서 고른 시간을 반영하고, 오늘 남은 시간이 없으면 내일로
  useEffect(() => {
    if (initialized.current || !now || !hydrated || !todayKey || !tomorrowKey) return;
    initialized.current = true;
    setPurpose(prefs.purpose);
    const wanted = Number(params.get("hour"));
    const wantedValid = hours.includes(wanted);
    if (wantedValid && !isPastSlot(todayKey, wanted, now)) {
      setDate(todayKey);
      setStartHour(wanted);
    } else if (wantedValid) {
      setDate(tomorrowKey);
      setStartHour(wanted);
    } else {
      setDate(todayHasSlots ? todayKey : tomorrowKey);
    }
  }, [now, hydrated, params, hours, todayKey, tomorrowKey, todayHasSlots, prefs.purpose]);

  // 시작 시간이 바뀌어 마감을 넘기면 가능한 최대 시간으로 줄인다
  useEffect(() => {
    if (startHour === null) return;
    const max = maxDurationFor(cafe, startHour);
    if (durationMin > max) setDurationMin(Math.max(60, Math.floor(max / 60) * 60));
  }, [startHour, durationMin, cafe]);

  const input = useMemo(
    () => (date && startHour !== null ? { cafeId: cafe.id, date, startHour, durationMin, purpose, memo } : null),
    [cafe.id, date, startHour, durationMin, purpose, memo]
  );
  const conflict = input ? findConflict(input, plans) : null;
  const ready = Boolean(input) && !conflict;

  const summary = useMemo(() => {
    if (!input) return null;
    const endHour = Math.min(input.startHour + Math.ceil(input.durationMin / 60), 21);
    const start = hourlyAt(cafe, input.startHour);
    const later = hourlyAt(cafe, endHour);
    return {
      score: fitScore(cafe, input.purpose, input.startHour),
      startCrowd: CROWD_PHRASE[levelOf(start.crowd)],
      startNoise: NOISE_PHRASE[levelOf(start.noise)],
      laterCrowd: LEVEL_WORD[levelOf(later.crowd)],
      endHour,
    };
  }, [input, cafe]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || submitting || submittedRef.current) return;
    setSubmitting(true);
    setError(null);
    // 데모: 저장이 즉시 끝나지만 실제 서비스처럼 짧은 처리 상태를 보여준다
    window.setTimeout(() => {
      const result = createPlan(input, now);
      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
      submittedRef.current = true;
      showToast("작업 계획을 저장했어요");
      // replace: 완료 화면에서 뒤로 가도 폼으로 돌아와 다시 제출하지 않게
      router.replace(`/plans/${result.plan.id}?new=1`);
    }, 450);
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col bg-cream-50" noValidate>
      {/* ---------- 헤더 ---------- */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-cream-300/70 bg-white px-2 lg:px-6">
        <Link href={`/cafe/${cafe.id}`} className="flex h-10 w-10 items-center justify-center rounded-full text-coffee-700 hover:bg-cream-100" aria-label="카페 상세로 돌아가기">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-title text-coffee-900">작업 계획 만들기</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:pt-4">
          <div className="min-w-0">
            {/* 카페 요약 */}
            <div className="flex items-center gap-3.5 py-5">
              <CafePhoto cafe={cafe} className="h-14 w-14 shrink-0 rounded-xl" sizes="56px" overlay={false} />
              <div className="min-w-0">
                <p className="truncate text-title text-coffee-900">{cafe.name}</p>
                <p className="num truncate text-meta text-coffee-400">
                  {AREA_MAP[cafe.area].name} · 매일 {formatHours(cafe)}
                </p>
              </div>
            </div>

            <Step n={1} title="언제 갈까요?">
              <div className="grid grid-cols-2 gap-2">
                {[todayKey, tomorrowKey].map((key, i) => {
                  const disabled = !key || (i === 0 && !todayHasSlots);
                  const active = key !== null && date === key;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (!key) return;
                        setDate(key);
                        if (startHour !== null && isPastSlot(key, startHour, now)) setStartHour(null);
                      }}
                      className={`option h-14 flex-col gap-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${active ? "option-active" : "option-idle"}`}
                      aria-pressed={active}
                    >
                      <span className="text-body font-bold">{i === 0 ? "오늘" : "내일"}</span>
                      <span className="text-caption opacity-80">{key ? formatDate(key) : " "}</span>
                    </button>
                  );
                })}
              </div>
              {!todayHasSlots && (
                <p className="mt-2 text-meta text-coffee-400">오늘은 남은 영업 시간이 없어 내일만 고를 수 있어요.</p>
              )}
            </Step>

            <Step n={2} title="몇 시에 도착하나요?" hint="예상 혼잡도">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {hours.map((h) => {
                  const past = date ? isPastSlot(date, h, now) : true;
                  const lv = levelOf(hourlyAt(cafe, h).crowd);
                  const active = startHour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={past || !date}
                      onClick={() => setStartHour(h)}
                      className={`option h-16 flex-col gap-1 disabled:cursor-not-allowed disabled:opacity-35 ${active ? "option-active" : "option-idle"}`}
                      aria-pressed={active}
                      aria-label={`${h}시, 예상 ${LEVEL_WORD[lv]}${past ? ", 지난 시간" : ""}`}
                    >
                      <span className="num text-body font-bold">{h}:00</span>
                      <span className={`text-caption ${active ? "text-cream-100" : lv === "busy" ? "text-coffee-700 font-semibold" : "text-coffee-400"}`}>
                        {LEVEL_WORD[lv]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Step>

            <Step n={3} title="얼마나 머무나요?">
              <div className="grid grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((m) => {
                  const tooLong = startHour !== null && m > maxDurationFor(cafe, startHour);
                  const active = durationMin === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={tooLong}
                      onClick={() => setDurationMin(m)}
                      className={`option h-12 disabled:cursor-not-allowed disabled:opacity-35 ${active ? "option-active" : "option-idle"}`}
                      aria-pressed={active}
                    >
                      {formatDuration(m)}
                    </button>
                  );
                })}
              </div>
              {startHour !== null && (
                <p className="num mt-2 text-meta text-coffee-400">
                  {cafe.close === 24 ? "자정" : `${cafe.close}시`}에 문을 닫아요 · {timeRange(startHour, durationMin)}
                </p>
              )}
            </Step>

            <Step n={4} title="어떤 작업을 하나요?">
              <div className="flex flex-wrap gap-2">
                {PURPOSES.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPurpose(p.key)}
                    className={`chip ${purpose === p.key ? "chip-active" : "chip-idle"}`}
                    aria-pressed={purpose === p.key}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Step>

            <Step n={5} title="메모" hint="선택">
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value.slice(0, 60))}
                placeholder="예: 분기 보고서 초안 마무리"
                className="field"
                maxLength={60}
                aria-label="메모 (선택, 60자 이내)"
              />
              <p className="num mt-1.5 text-right text-caption text-coffee-400">{memo.length}/60</p>
            </Step>
          </div>

          {/* ---------- 요약 · 저장 ---------- */}
          <aside className="lg:pt-5">
            <div className="rounded-2xl border border-cream-300/80 bg-white p-5 lg:sticky lg:top-4">
              <h2 className="text-title text-coffee-900">계획 요약</h2>
              {input && summary && date ? (
                <div className="mt-3 space-y-3">
                  <p className="num text-body font-semibold text-coffee-800">
                    {dateWithRelative(date, now)}
                    <br />
                    {timeRange(input.startHour, input.durationMin)} · {PURPOSE_LABEL[input.purpose]}
                  </p>
                  <div className="flex items-center gap-3">
                    <ScorePill score={summary.score} muted={!isOpenAt(cafe, input.startHour)} />
                    <p className="text-meta text-coffee-600">
                      도착할 땐 {summary.startCrowd} {summary.startNoise}
                    </p>
                  </div>
                  <p className="num text-meta text-coffee-400">
                    {summary.endHour}시쯤엔 {summary.laterCrowd} 예상 · 데모 예측값
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-meta text-coffee-400">날짜와 도착 시간을 고르면 예상 환경을 알려드려요.</p>
              )}

              {(conflict || error) && (
                <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-meta font-medium text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error ??
                    (conflict &&
                      `같은 시간에 ${CAFE_MAP[conflict.cafeId]?.name ?? "다른 카페"} 작업 계획이 이미 있어요. 시간을 바꿔주세요.`)}
                </p>
              )}

              <button type="submit" disabled={!ready || submitting} className="btn-primary mt-5 hidden w-full lg:inline-flex">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                {submitting ? "저장하는 중…" : "작업 계획 저장"}
              </button>
              {!input && <p className="mt-2 hidden text-center text-caption text-coffee-400 lg:block">도착 시간을 골라주세요</p>}
            </div>
          </aside>
        </div>
      </div>

      {/* 모바일 하단 고정 저장 */}
      <div className="shrink-0 border-t border-cream-300/70 bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <button type="submit" disabled={!ready || submitting} className="btn-primary w-full">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
          {submitting ? "저장하는 중…" : input ? "작업 계획 저장" : "도착 시간을 골라주세요"}
        </button>
      </div>
    </form>
  );
}
