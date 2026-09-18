/**
 * 미래AI랩 브릿지 CTA 설정.
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │ 링크 주소를 바꿀 때        → MIRAE_LINKS                  │
 * │ CTA 문구를 바꿀 때         → MIRAE_CTA_COPY               │
 * └──────────────────────────────────────────────────────────┘
 * 이 파일만 수정하면 모든 페이지의 CTA에 한 번에 반영된다.
 * (개별 페이지에서 다르게 쓰고 싶으면 SampleBridgeCTA에
 *  consultHref / samplesHref / homeHref props로 덮어쓸 수 있다.)
 */

export const MIRAE_LINKS = {
  /** 메인 CTA — 우리 회사도 만들어보기 (사업 진단 신청) */
  consult: "https://miraeailab.com/business-diagnosis",
  /** 서브 — 다른 샘플 보기 */
  samples: "https://miraeailab.com/business-services",
  /** 서브 — 미래AI랩 홈페이지 */
  home: "https://miraeailab.com/",
} as const;

export const MIRAE_CTA_COPY = {
  badge: "MIRAE AI LAB",
  eyebrow: "이 샘플은 미래AI랩이 기획·제작했습니다",
  // "대표님 회사도"가 줄바꿈으로 갈라지지 않도록 사이에 줄바꿈 없는 공백(U+00A0) 사용
  headline:
    "이 샘플이 마음에 드셨다면, 대표님 회사도 이렇게 설계해볼 수 있습니다.",
  description:
    "미래AI랩은 평범한 회사를 기술·데이터·AI 기반의 성장형 기업으로 바꾸는 AX / MVP / 플랫폼 기획·개발을 진행합니다.",
  /** 메인 CTA 문구 — 모든 샘플에서 동일하게 유지 */
  primary: "우리 회사도 만들어보기",
  samples: "다른 샘플 보기",
  home: "미래AI랩 홈페이지",
} as const;
