import { ArrowRight, ExternalLink } from "lucide-react";
import { MIRAE_LINKS, MIRAE_CTA_COPY as COPY } from "@/lib/brand";

/**
 * 샘플 페이지 공통 브릿지 CTA.
 *
 * 샘플을 다 본 사용자를 ① 미래AI랩 인지 → ② 상담(우리 회사도 만들어보기)
 * → ③ 다른 샘플·홈페이지로 자연스럽게 잇는다.
 *
 * - 로고 이미지는 넣지 않는다(각 샘플 페이지에 이미 노출되어 있어 중복 방지).
 *   브랜드는 텍스트 배지와 사명으로만 표현한다.
 * - 애니메이션은 메인 CTA의 약한 광택과 배지 테두리 밝기 변화뿐이며,
 *   motion-reduce 환경에서는 모두 정지한다.
 *
 * variant
 * - "section": 페이지 하단 전체 폭 섹션 (기본)
 * - "panel"  : 지도 목록 패널·바텀시트처럼 좁은 열에 들어가는 축약형
 */
export default function SampleBridgeCTA({
  consultHref = MIRAE_LINKS.consult,
  samplesHref = MIRAE_LINKS.samples,
  homeHref = MIRAE_LINKS.home,
  variant = "section",
  className = "",
}: {
  consultHref?: string;
  samplesHref?: string;
  homeHref?: string;
  variant?: "section" | "panel";
  className?: string;
}) {
  const panel = variant === "panel";

  /* 메인 CTA — 두 변형에서 문구와 강조도를 동일하게 유지한다 */
  const primaryCta = (
    <a
      href={consultHref}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 px-6 py-4 text-center text-[18px] font-bold text-white shadow-[0_6px_20px_-6px_rgba(0,48,60,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(0,96,108,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-0 sm:w-auto"
      aria-label={`${COPY.primary} — 미래AI랩 상담 신청 (새 창)`}
    >
      {/* 약한 광택: 6초에 한 번 스쳐 지나간다 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 animate-cta-sweep bg-gradient-to-r from-transparent via-white/45 to-transparent motion-reduce:animate-none motion-reduce:opacity-0"
      />
      <span className="relative">{COPY.primary}</span>
      <ArrowRight
        size={19}
        strokeWidth={2.4}
        className="relative shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
      />
    </a>
  );

  /* 서브 액션 — 메인보다 확실히 덜 튀게 */
  const subActions = (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${
        panel ? "justify-center" : "sm:justify-end"
      }`}
    >
      <a
        href={samplesHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-xl border border-cream-300 bg-white px-4 py-2.5 text-[15.5px] font-semibold text-coffee-600 transition-colors duration-200 hover:border-brand-300 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        aria-label={`${COPY.samples} (새 창)`}
      >
        {COPY.samples}
        <ExternalLink size={14} className="shrink-0 opacity-70" />
      </a>
      <a
        href={homeHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 py-1.5 text-[15.5px] font-semibold text-coffee-400 underline-offset-4 transition-colors duration-200 hover:text-brand-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        aria-label={`${COPY.home} (새 창)`}
      >
        {COPY.home}
        <ExternalLink size={14} className="shrink-0 opacity-70" />
      </a>
    </div>
  );

  const badge = (
    <span className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-brand-900 px-3.5 py-1.5">
      <span
        aria-hidden
        className="absolute inset-0 animate-badge-glow bg-gradient-to-r from-brand-cyan/0 via-brand-cyan/25 to-brand-500/0 motion-reduce:animate-none motion-reduce:opacity-30"
      />
      <span className="relative h-1.5 w-1.5 rounded-full bg-brand-cyan" />
      <span className="relative text-[12.5px] font-bold tracking-[0.16em] text-brand-50">
        {COPY.badge}
      </span>
    </span>
  );

  return (
    <section
      aria-labelledby="mirae-bridge-heading"
      className={`relative overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-card ${
        panel ? "p-5" : "p-6 sm:p-8"
      } ${className}`}
    >
      {/* 우상단 브랜드 톤 은은한 광 */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-brand-400/10 blur-3xl"
      />

      <div
        className={
          panel
            ? "relative space-y-3"
            : "relative flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10"
        }
      >
        {/* ---- 소개 ---- */}
        <div className={panel ? "space-y-2.5" : "flex-1 space-y-3"}>
          {badge}
          <p className="text-[14.5px] font-semibold text-brand-600">
            {COPY.eyebrow}
          </p>
          <h2
            id="mirae-bridge-heading"
            className={`font-bold leading-snug text-coffee-900 ${
              panel ? "text-[19px]" : "text-[23px] sm:text-[27px]"
            }`}
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            {COPY.headline}
          </h2>
          <p
            className={`leading-relaxed text-coffee-500 ${
              panel ? "text-[15px]" : "max-w-2xl text-[16.5px]"
            }`}
          >
            {COPY.description}
          </p>
        </div>

        {/* ---- 액션 ---- */}
        <div
          className={
            panel
              ? "space-y-3 pt-1"
              : "flex shrink-0 flex-col items-stretch gap-3 sm:items-end lg:w-[300px]"
          }
        >
          {primaryCta}
          {subActions}
        </div>
      </div>
    </section>
  );
}
