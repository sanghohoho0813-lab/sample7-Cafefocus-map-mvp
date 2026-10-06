/** 배포 주소 — OG·사이트맵의 절대 URL에 쓴다 (Vercel이면 자동, 아니면 NEXT_PUBLIC_SITE_URL) */
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
);

export const SITE_NAME = "CafeFocus";
export const SITE_TITLE = "CafeFocus — 지금 일하기 좋은 카페 지도";
export const SITE_DESCRIPTION =
  "소음·혼잡도·콘센트·Wi-Fi 데이터로 지금 이 시간에 노트북 작업하기 가장 좋은 카페를 찾고, 작업 계획과 체크인까지 이어서 할 수 있어요.";
