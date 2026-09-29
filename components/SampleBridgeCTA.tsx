import { ArrowRight, ExternalLink } from "lucide-react";
import { MIRAE_LINKS, MIRAE_CTA_COPY as COPY } from "@/lib/brand";

/**
 * 샘플 공통 브릿지 CTA — 핵심 흐름을 마친 화면에서만 노출한다.
 * (계획 저장 완료 · 작업 기록 완료 · 내 작업 하단)
 *
 * 로고 이미지는 넣지 않는다. 제작사 표기는 상단 얇은 바 한 곳에만 있다.
 * 강조 효과는 메인 버튼의 약한 광택 하나뿐이며 motion-reduce에서 멈춘다.
 */
export default function SampleBridgeCTA({
  consultHref = MIRAE_LINKS.consult,
  samplesHref = MIRAE_LINKS.samples,
  homeHref = MIRAE_LINKS.home,
  className = "",
}: {
  consultHref?: string;
  samplesHref?: string;
  homeHref?: string;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="mirae-bridge-heading"
      className={`rounded-2xl border border-cream-300/80 bg-white p-6 sm:p-7 ${className}`}
    >
      <p className="text-caption font-bold tracking-[0.14em] text-brand-700">{COPY.badge}</p>
      <p className="mt-3 text-meta font-semibold text-coffee-500">{COPY.eyebrow}</p>
      <h2
        id="mirae-bridge-heading"
        className="mt-1.5 text-section text-coffee-900"
        style={{ textWrap: "balance" } as React.CSSProperties}
      >
        {COPY.headline}
      </h2>
      <p className="mt-2 text-body text-coffee-500">{COPY.description}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href={consultHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn group relative h-12 overflow-hidden bg-gradient-to-br from-brand-800 to-brand-600 px-6 text-white transition-colors hover:from-brand-900 hover:to-brand-700"
          aria-label={`${COPY.primary} — 미래AI랩 상담 신청 (새 창)`}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 animate-cta-sweep bg-gradient-to-r from-transparent via-white/40 to-transparent motion-reduce:hidden"
          />
          <span className="relative">{COPY.primary}</span>
          <ArrowRight size={17} className="relative transition-transform duration-200 group-hover:translate-x-0.5" />
        </a>
        <div className="flex items-center gap-1">
          <a
            href={samplesHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-quiet h-11 text-label"
            aria-label={`${COPY.samples} (새 창)`}
          >
            {COPY.samples}
            <ExternalLink size={14} className="opacity-70" />
          </a>
          <a
            href={homeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-quiet h-11 text-label"
            aria-label={`${COPY.home} (새 창)`}
          >
            {COPY.home}
            <ExternalLink size={14} className="opacity-70" />
          </a>
        </div>
      </div>
    </section>
  );
}
