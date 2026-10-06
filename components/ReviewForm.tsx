"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Star, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import type { Cafe, NoiseFeel, OutletFeel, Purpose, WifiFeel } from "@/lib/types";
import { PURPOSES, PURPOSE_LABEL } from "@/lib/fit";
import { NOISE_FEEL, OUTLET_FEEL, WIFI_FEEL } from "@/lib/reviews";
import { DURATION_OPTIONS } from "@/lib/plans";
import { dateKey, formatDate, formatDuration, timeRange, visitLabel } from "@/lib/time";
import { useNow } from "@/lib/useNow";
import { useApp } from "@/lib/store";
import CafePhoto from "@/components/CafePhoto";
import EmptyState from "@/components/EmptyState";
import PageSkeleton from "@/components/PageSkeleton";

const VISIT_OPTIONS = ["평일 오전", "평일 오후", "평일 저녁", "주말 오전", "주말 오후", "주말 저녁"];

const RATING_WORD = ["", "아쉬웠어요", "그저 그랬어요", "괜찮았어요", "좋았어요", "아주 좋았어요"];

function Group({ title, optional = false, children }: { title: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-cream-300/70 py-6">
      {/* float + clear 로 legend가 테두리 선 위에 걸치지 않게 (계획 폼과 같은 구조) */}
      <legend className="float-left mb-3.5 w-full">
        <span className="flex items-baseline gap-2">
          <span className="text-title text-coffee-900">{title}</span>
          {optional && <span className="text-meta text-coffee-400">선택</span>}
        </span>
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function Choice<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: K; label: string }[];
  value: K | null;
  onChange: (k: K) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="mb-2 text-label text-coffee-600" aria-hidden>
        {label}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={value === o.key}
            onClick={() => onChange(o.key)}
            className={`option h-12 text-center ${value === o.key ? "option-active" : "option-idle"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
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
  const now = useNow();
  const [visitPicked, setVisitPicked] = useState<string | null>(null);
  // 방문 시간대를 고르지 않았다면 지금 시각 기준으로 채운다 (임의의 고정값을 저장하지 않게)
  const visit = visitPicked ?? (now ? visitLabel(dateKey(now), now.getHours()) : "평일 오후");
  const [moreOpen, setMoreOpen] = useState(false);
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

  if (!hydrated) return <PageSkeleton variant="form" />;

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
      // 계획 기록은 완료 화면이 결과를 보여주므로 알림은 단독 후기에만
      if (!plan) showToast("후기를 남겼어요");
      router.replace(plan ? `/plans/${plan.id}` : `/cafe/${cafe.id}`);
    }, 400);
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col bg-cream-50" noValidate>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-cream-300/70 bg-white px-2 lg:px-6">
        <button
          type="button"
          onClick={() =>
            window.history.length > 1 ? router.back() : router.push(plan ? `/plans/${plan.id}` : `/cafe/${cafe.id}`)
          }
          className="flex h-10 w-10 items-center justify-center rounded-full text-coffee-700 hover:bg-cream-100"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={20} />
        </button>
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

          <Group title="만족도">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
              <span className="text-body font-semibold text-coffee-700" aria-live="polite">
                {RATING_WORD[rating]}
              </span>
            </div>
          </Group>

          <Group title="작업 환경은 어땠나요?">
            <div className="space-y-5">
              <Choice label="소음" options={NOISE_FEEL} value={noise} onChange={setNoise} />
              <Choice label="콘센트" options={OUTLET_FEEL} value={outlet} onChange={setOutlet} />
              <Choice label="Wi-Fi" options={WIFI_FEEL} value={wifi} onChange={setWifi} />
            </div>
          </Group>

          {/* 계획 없이 남기는 후기만 방문 정보가 필요하다 — 기본값이 있으니 접어 둔다 */}
          {!plan && (
            <div className="border-t border-cream-300/70 py-5">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span>
                  <span className="text-title text-coffee-900">방문 정보</span>{" "}
                  <span className="text-meta text-coffee-400">선택</span>
                  <span className="block text-meta text-coffee-500">
                    {visit} · {PURPOSE_LABEL[purpose]} · {formatDuration(stay)}
                  </span>
                </span>
                <ChevronDown size={20} className={`shrink-0 text-coffee-400 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>
              {moreOpen && (
                <div className="mt-5 space-y-5">
                  <div role="radiogroup" aria-label="방문 시간대">
                    <p className="mb-2 text-label text-coffee-600" aria-hidden>
                      방문 시간대
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {VISIT_OPTIONS.map((v) => (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={visit === v}
                          onClick={() => setVisitPicked(v)}
                          className={`option h-11 ${visit === v ? "option-active" : "option-idle"}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div role="radiogroup" aria-label="작업 목적">
                    <p className="mb-2 text-label text-coffee-600" aria-hidden>
                      작업 목적
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PURPOSES.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          role="radio"
                          aria-checked={purpose === p.key}
                          onClick={() => setPurpose(p.key)}
                          className={`chip ${purpose === p.key ? "chip-active" : "chip-idle"}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div role="radiogroup" aria-label="머문 시간">
                    <p className="mb-2 text-label text-coffee-600" aria-hidden>
                      머문 시간
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {DURATION_OPTIONS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={stay === m}
                          onClick={() => setStay(m)}
                          className={`option h-11 ${stay === m ? "option-active" : "option-idle"}`}
                        >
                          {formatDuration(m)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <Group title="한 줄 후기" optional>
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

      <div data-bottom-bar className="sticky bottom-0 z-30 shrink-0 border-t border-cream-300/70 bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        {/* 넓은 화면에선 안내와 버튼을 한 줄로 — 바가 낮아야 공용 뒤로·앞으로 버튼이 그 위에 자리를 잡는다 */}
        <div className="mx-auto max-w-xl sm:flex sm:items-center sm:gap-4">
          {!valid && (
            <p className="mb-2 text-center text-meta text-coffee-500 sm:mb-0 sm:flex-1 sm:text-left">
              남은 항목 <b className="font-semibold text-coffee-800">{missing.join(" · ")}</b>
            </p>
          )}
          <button type="submit" disabled={!valid || submitting} className="btn-primary w-full sm:ml-auto sm:w-auto sm:min-w-[240px]">
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {submitting ? "저장하는 중…" : plan ? "기록 저장하고 작업 완료" : "후기 저장"}
          </button>
        </div>
      </div>
    </form>
  );
}
