/**
 * 빈 화면·오류 화면용 그림. 서비스 색(크림·커피·숲)만 쓰고, 지도와 커피잔으로 "작업할 카페를 찾는 길"을 그린다.
 * - lost : 길을 잃음 (없는 페이지) — 점선 경로 끝의 물음표 핀
 * - error: 잠깐 멈춤 (오류) — 김이 멈춘 커피잔
 */
export default function Illustration({ variant = "lost", className = "" }: { variant?: "lost" | "error"; className?: string }) {
  return (
    <svg viewBox="0 0 240 160" className={className} role="img" aria-hidden focusable="false">
      {/* 지도 조각 */}
      <rect x="8" y="14" width="224" height="132" rx="22" fill="#F7F2E8" />
      <path d="M8 62 H232 M8 108 H232 M78 14 V146 M164 14 V146" stroke="#FFFFFF" strokeWidth="9" />
      <path d="M8 62 H232 M8 108 H232 M78 14 V146 M164 14 V146" stroke="#EDE5D6" strokeWidth="1" />
      <rect x="170" y="20" width="56" height="36" rx="8" fill="#DFE8D6" />
      <rect x="14" y="114" width="58" height="26" rx="8" fill="#E9DFD1" />
      {/* 점선 경로 */}
      <path
        d="M46 128 C 62 96, 96 104, 116 86 S 156 60, 186 74"
        fill="none"
        stroke="#A98F73"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 7"
      />
      {variant === "lost" ? (
        <>
          {/* 물음표 핀 */}
          <path d="M186 36 c-12 0 -21 9 -21 20 c0 15 21 34 21 34 s21 -19 21 -34 c0 -11 -9 -20 -21 -20 z" fill="#38291C" />
          <text x="186" y="64" textAnchor="middle" fontSize="20" fontWeight="800" fill="#FBF8F2" style={{ fontFamily: "inherit" }}>
            ?
          </text>
        </>
      ) : (
        <>
          <circle cx="186" cy="74" r="7" fill="#C4902F" />
          <circle cx="186" cy="74" r="13" fill="none" stroke="#C4902F" strokeOpacity="0.35" strokeWidth="3" />
        </>
      )}
      {/* 커피잔 */}
      <g transform="translate(26 70)">
        <path d="M6 18 h40 v20 a14 14 0 0 1 -14 14 h-12 a14 14 0 0 1 -14 -14 z" fill="#FFFFFF" stroke="#38291C" strokeWidth="3" strokeLinejoin="round" />
        <path d="M46 23 h4 a7 7 0 0 1 0 14 h-4" fill="none" stroke="#38291C" strokeWidth="3" />
        <path d="M10 18 h32 v6 h-32 z" fill="#7D6449" />
        {variant === "lost" ? (
          <path d="M16 12 c-3 -4 3 -6 0 -10 M26 12 c-3 -4 3 -6 0 -10 M36 12 c-3 -4 3 -6 0 -10" fill="none" stroke="#A98F73" strokeWidth="2.4" strokeLinecap="round" />
        ) : (
          <path d="M18 9 h20" stroke="#A98F73" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="1 6" />
        )}
      </g>
    </svg>
  );
}
