"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Star, Loader2, CheckCircle2 } from "lucide-react";
import type { Cafe, NoiseFeel, OutletFeel, Purpose, WifiFeel } from "@/lib/types";
import { PURPOSES } from "@/lib/fit";
import { NOISE_FEEL, OUTLET_FEEL, WIFI_FEEL } from "@/lib/reviews";
import { DURATION_OPTIONS } from "@/lib/plans";
import { formatDate, formatDuration, timeRange, visitLabel } from "@/lib/time";
import { useApp } from "@/lib/store";
import CafePhoto from "@/components/CafePhoto";
import EmptyState from "@/components/EmptyState";

const VISIT_OPTIONS = ["평일 오전", "평일 오후", "평일 저녁", "주말 오전", "주말 오후", "주말 저녁"];

function Group({ title, required = false, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-cream-300/70 py-5">
      <legend className="mb-3 flex items-center gap-1.5 text-title text-coffee-900">
        {title}
        {required ? <span className="text-meta font-medium text-coffee-400">필수</span> : <span className="text-meta font-medium text-coffee-400">선택</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function Choice<K extends string>({ options, value, onChange }: { options: { key: K; label: string }[]; value: K | null; onChange: (k: K) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`option h-12 text-center ${value === o.key ? "option-active" : "option-idle"}`}
          aria-pressed={value === o.key}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function ReviewForm({ cafe }: { cafe: Cafe }) {
  const router = useRouter();
  const params = useSearchParams();
  const { plans, submitReview, showToast, hydrated, prefs } = useApp();

  const planId = params.get("plan");
  const plan = useMemo(
    () => (planId ? plans.find((p) => p.id === planId && p.cafeId === cafe.id) ?? null : null),
    [planId, plans, cafe.id]
  );

  const [rating, setRating] = useState(0);
  const [noise, setNoise] = useState<NoiseFeel | null>(null);
  const [outlet, setOutlet] = useState<OutletFeel | null>(null);
  const [wifi, setWifi] = useState<WifiFeel | null>(null);
  const [text, setText] = useState("");
  const [visit, setVisit] = useState<string>("평일 오후");
  const [purpose, setPurpose] = useState<Purpose>(prefs.purpose);
  const [stay, setStay] = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const doneRef = useRef(false);

  const missing = [
    rating === 0 && "별점",
    !noise && "소음",
    !outlet && "콘센트",
    !wifi && "Wi-Fi",
  ].filter(Boolean) as string[];
  const valid = missing.length === 0;

  if (!hydrated) return null;

  // 이미 기록을 마친 계획이라면 다시 쓰지 않게 안내
  if (plan && plan.status === "completed") {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={CheckCircle2}
          title="이미 기록을 남긴 작업이에요"
          action={
            <Link href={`/plans/${plan.id}`} className="btn-primary h-11">
              작업 일정 보기
            </Link>
          }
        />
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting || doneRef.current || !noise || !outlet || !wifi) return;
    setSubmitting(true);
    window.setTimeout(() => {
      doneRef.current = true;
      submitReview({
        cafeId: cafe.id,
        planId: plan?.id,
        visitLabel: plan ? visitLabel(plan.date, plan.startHour) : visit,
        purpose: plan ? plan.purpose : purpose,
        stayMinutes: plan ? plan.durationMin : stay,
        rating,
        noise,
        outlet,
        wifi,
        text,
      });
      showToast(plan ? "작업을 기록했어요" : "후기를 남겼어요");
      router.replace(plan ? `/plans/${plan.id}` : `/cafe/${cafe.id}`);
    }, 400);
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col bg-cream-50" noValidate>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-cream-300/70 bg-white px-2 lg:px-6">
        <Link
          href={plan ? `/plans/${plan.id}` : `/cafe/${cafe.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full text-coffee-700 hover:bg-cream-100"
          aria-label="돌아가기"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-title text-coffee-900">{plan ? "작업 기록하기" : "작업 후기 남기기"}</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl px-4 pb-10 sm:px-6">
          <div className="flex items-center gap-3.5 py-5">
            <CafePhoto cafe={cafe} className="h-14 w-14 shrink-0 rounded-xl" sizes="56px" overlay={false} />
            <div className="min-w-0">
              <p className="truncate text-title text-coffee-900">{cafe.name}</p>
              <p className="num truncate text-meta text-coffee-400">
                {plan
                  ? `${formatDate(plan.date)} ${timeRange(plan.startHour, plan.durationMin)}`
                  : "다른 작업자에게 도움이 되는 체크인을 남겨주세요"}
              </p>
            </div>
          </div>

          <Group title="전체 만족도" required>
            <div className="flex gap-1" role="radiogroup" aria-label="별점">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n}점`}
                  onClick={() => setRating(n)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors hover:bg-cream-200/60"
                >
                  <Star
                    size={30}
                    strokeWidth={1.6}
                    className={n <= rating ? "fill-amber2-400 text-amber2-400" : "text-cream-400"}
                  />
                </button>
              ))}
            </div>
          </Group>

          <Group title="실제 소음은 어땠나요?" required>
            <Choice options={NOISE_FEEL} value={noise} onChange={setNoise} />
          </Group>
          <Group title="콘센트는요?" required>
            <Choice options={OUTLET_FEEL} value={outlet} onChange={setOutlet} />
          </Group>
          <Group title="Wi-Fi는요?" required>
            <Choice options={WIFI_FEEL} value={wifi} onChange={setWifi} />
          </Group>

          {!plan && (
            <>
              <Group title="언제 방문했나요?">
                <div className="grid grid-cols-3 gap-2">
                  {VISIT_OPTIONS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVisit(v)}
                      className={`option h-11 ${visit === v ? "option-active" : "option-idle"}`}
                      aria-pressed={visit === v}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </Group>
              <Group title="작업 목적과 머문 시간">
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
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {DURATION_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setStay(m)}
                      className={`option h-11 ${stay === m ? "option-active" : "option-idle"}`}
                      aria-pressed={stay === m}
                    >
                      {formatDuration(m)}
                    </button>
                  ))}
                </div>
              </Group>
            </>
          )}

          <Group title="한 줄 후기">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 120))}
              rows={3}
              maxLength={120}
              placeholder="예: 오전엔 조용하고 창가 자리에 콘센트가 있어요."
              className="field resize-none"
              aria-label="한 줄 후기 (선택, 120자 이내)"
            />
            <p className="num mt-1.5 text-right text-caption text-coffee-400">{text.length}/120</p>
          </Group>
        </div>
      </div>

      <div className="shrink-0 border-t border-cream-300/70 bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-xl">
          {!valid && <p className="mb-2 text-center text-caption text-coffee-400">{missing.join(" · ")}을(를) 골라주세요</p>}
          <button type="submit" disabled={!valid || submitting} className="btn-primary w-full">
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {submitting ? "저장하는 중…" : plan ? "기록 저장하고 작업 완료" : "후기 저장"}
          </button>
        </div>
      </div>
    </form>
  );
}
