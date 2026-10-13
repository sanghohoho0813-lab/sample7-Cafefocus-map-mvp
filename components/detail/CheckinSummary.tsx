import { Star } from "lucide-react";
import type { CheckinSummary as Summary, DisplayReview } from "@/lib/reviews";

/**
 * 작업자 체크인 — 맛·친절이 아니라 "작업 환경이 실제로 어땠는지".
 * 비율 막대가 먼저, 개별 체크인은 그 근거로 아래에.
 */
export default function CheckinSummary({ summary, reviews }: { summary: Summary; reviews: DisplayReview[] }) {
  return (
    <div>
      <div className="rounded-2xl bg-white px-5 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="flex shrink-0 items-center gap-1.5">
            <Star size={18} className="fill-amber2-400 text-amber2-400" aria-hidden />
            <span className="num text-title text-coffee-900">{summary.satisfaction.toFixed(1)}</span>
            <span className="whitespace-nowrap text-meta text-coffee-500">작업 만족도</span>
          </p>
          <p className="num text-right text-caption text-coffee-400">
            체크인 {summary.count.toLocaleString()}건{summary.mine ? ` · 내 체크인 ${summary.mine}건 포함` : ""}
          </p>
        </div>
        <ul className="mt-3.5 space-y-2.5">
          {summary.stats.map((s) => (
            <li key={s.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-meta">
              <span className="text-coffee-700">{s.label}</span>
              <span className="num font-semibold text-coffee-900">{s.percent}%</span>
              <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-cream-200" aria-hidden>
                <span className="block h-full rounded-full bg-forest-600" style={{ width: `${s.percent}%` }} />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-caption text-coffee-400">작업하러 온 사람들의 응답 비율 · 데모 데이터</p>
      </div>

      <ul className="mt-5 divide-y divide-cream-300/70">
        {reviews.map((r) => (
          <li key={r.id} className="py-4 first:pt-0">
            <div className="flex items-center gap-2">
              {r.mine ? (
                <span className="rounded-md bg-coffee-800 px-1.5 py-0.5 text-[12px] font-semibold text-cream-50">내 체크인</span>
              ) : (
                <span className="text-body font-semibold text-coffee-900">{r.author}</span>
              )}
              <span className="flex items-center gap-0.5 text-meta font-semibold text-coffee-700">
                <Star size={14} className="fill-amber2-400 text-amber2-400" aria-hidden />
                {r.rating}
              </span>
              <span className="ml-auto truncate text-caption text-coffee-400">{r.meta}</span>
            </div>
            {r.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.tags.filter(Boolean).map((t) => (
                  <span key={t} className="rounded-md bg-cream-100 px-2 py-0.5 text-caption font-medium text-coffee-700">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {r.text && <p className="mt-2 text-body text-coffee-700">{r.text}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
