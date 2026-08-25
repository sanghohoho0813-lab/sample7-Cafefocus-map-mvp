"use client";

import { useMemo, useState } from "react";
import { Coffee, Plus, Minus, LocateFixed, Navigation } from "lucide-react";
import type { AreaKey, Cafe } from "@/lib/types";
import { AREA_MAP, DEMO_LOCATION } from "@/lib/data/cafes";
import { workScore, hourlyAt, levelOf } from "@/lib/scoring";

/* 지역별 장식용 동네 라벨 (데모 맵 레이어) */
const AREA_LABELS: Record<AreaKey | "all", { name: string; x: number; y: number }[]> = {
  all: [
    { name: "마포구", x: 16, y: 30 },
    { name: "종로구", x: 44, y: 16 },
    { name: "성동구", x: 62, y: 34 },
    { name: "강남구", x: 55, y: 74 },
    { name: "송파구", x: 82, y: 66 },
  ],
  seongsu: [
    { name: "성수동", x: 50, y: 28 },
    { name: "서울숲", x: 18, y: 58 },
    { name: "뚝섬", x: 38, y: 78 },
    { name: "송정동", x: 82, y: 24 },
  ],
  gangnam: [
    { name: "역삼동", x: 55, y: 30 },
    { name: "서초동", x: 18, y: 62 },
    { name: "논현동", x: 36, y: 14 },
    { name: "삼성동", x: 84, y: 46 },
  ],
  hongdae: [
    { name: "연남동", x: 46, y: 22 },
    { name: "연희동", x: 24, y: 12 },
    { name: "서교동", x: 40, y: 62 },
    { name: "망원동", x: 12, y: 74 },
    { name: "합정동", x: 60, y: 84 },
  ],
  jamsil: [
    { name: "잠실동", x: 44, y: 30 },
    { name: "석촌호수", x: 30, y: 68 },
    { name: "신천동", x: 70, y: 18 },
    { name: "방이동", x: 82, y: 56 },
  ],
  jongno: [
    { name: "북촌", x: 52, y: 16 },
    { name: "광화문", x: 22, y: 58 },
    { name: "인사동", x: 46, y: 46 },
    { name: "익선동", x: 72, y: 38 },
  ],
  hapjeong: [
    { name: "합정동", x: 46, y: 34 },
    { name: "망원동", x: 20, y: 20 },
    { name: "상수동", x: 72, y: 56 },
    { name: "당인동", x: 56, y: 80 },
  ],
};

function project(cafes: Cafe[]) {
  const lats = cafes.map((c) => c.lat);
  const lngs = cafes.map((c) => c.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.004);
  const lngSpan = Math.max(maxLng - minLng, 0.005);
  minLat -= latSpan * 0.1;
  maxLat += latSpan * 0.1;
  minLng -= lngSpan * 0.1;
  maxLng += lngSpan * 0.1;
  return (lat: number, lng: number) => ({
    // 마커가 컨트롤·모바일 Bottom Sheet에 가려지지 않게 안쪽 영역에 배치
    x: 12 + ((lng - minLng) / (maxLng - minLng)) * 76,
    y: 14 + ((maxLat - lat) / (maxLat - minLat)) * 50,
  });
}

export default function MapView({
  cafes,
  selectedId,
  hoveredId,
  onSelect,
  hour,
  area,
  children,
}: {
  cafes: Cafe[];
  selectedId: string | null;
  hoveredId?: string | null;
  onSelect: (id: string | null) => void;
  hour: number;
  area: AreaKey | null;
  children?: React.ReactNode;
}) {
  const [zoom, setZoom] = useState(1);

  const proj = useMemo(() => project(cafes.length ? cafes : [
    { lat: DEMO_LOCATION.lat, lng: DEMO_LOCATION.lng } as Cafe,
  ]), [cafes]);

  const topScoreId = useMemo(() => {
    let best: Cafe | null = null;
    let bestScore = -1;
    for (const c of cafes) {
      const s = workScore(c.metrics);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }
    return best?.id ?? null;
  }, [cafes]);

  const labels = AREA_LABELS[area ?? "all"];
  const me = proj(DEMO_LOCATION.lat, DEMO_LOCATION.lng);
  const showMe = area === null || area === "seongsu";
  const station = area ? AREA_MAP[area] : null;

  return (
    <div
      className="relative h-full w-full select-none overflow-hidden bg-[#F2ECDF]"
      onClick={() => onSelect(null)}
      role="application"
      aria-label="카페 지도"
    >
      {/* 줌 적용 레이어 */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{ transform: `scale(${zoom})`, transformOrigin: "50% 50%" }}
      >
        {/* ---- 데모 맵 배경 ---- */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1000 700"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <rect width="1000" height="700" fill="#F2ECDF" />
          {/* 블록 음영 */}
          <g fill="#ECE4D2" opacity="0.7">
            <rect x="80" y="60" width="180" height="120" rx="14" />
            <rect x="330" y="40" width="150" height="150" rx="14" />
            <rect x="560" y="90" width="200" height="110" rx="14" />
            <rect x="140" y="420" width="170" height="130" rx="14" />
            <rect x="640" y="380" width="180" height="150" rx="14" />
            <rect x="420" y="480" width="150" height="120" rx="14" />
            <rect x="820" y="150" width="130" height="160" rx="14" />
          </g>
          {/* 공원 */}
          <path
            d="M60 560 C 120 500, 220 520, 260 580 C 290 630, 200 680, 120 670 C 60 660, 30 610, 60 560 Z"
            fill="#DCE6CE"
          />
          <path
            d="M760 60 C 830 30, 920 60, 930 130 C 938 190, 860 220, 800 195 C 740 170, 715 100, 760 60 Z"
            fill="#DCE6CE"
          />
          <ellipse cx="500" cy="330" rx="70" ry="46" fill="#E3EAD6" opacity="0.8" />
          {/* 강 */}
          <path
            d="M-40 640 C 150 560, 260 620, 380 540 C 480 470, 470 380, 560 300 C 640 230, 780 250, 900 170 C 960 130, 1010 120, 1060 90"
            fill="none"
            stroke="#C9DCE4"
            strokeWidth="46"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* 주요 도로 */}
          <g stroke="#FFFFFF" fill="none" strokeLinecap="round">
            <path d="M-20 200 C 200 180, 420 230, 640 210 C 820 195, 940 220, 1020 210" strokeWidth="16" />
            <path d="M240 -20 C 260 160, 230 360, 300 520 C 340 620, 380 680, 400 720" strokeWidth="14" />
            <path d="M700 -20 C 680 140, 720 320, 680 480 C 650 590, 640 660, 650 720" strokeWidth="14" />
            <path d="M-20 460 C 180 440, 400 480, 620 450 C 800 425, 940 450, 1020 440" strokeWidth="12" />
            <path d="M480 -20 C 500 120, 470 260, 500 400 C 520 500, 500 640, 510 720" strokeWidth="9" opacity="0.85" />
            <path d="M-20 330 C 160 320, 300 350, 460 330" strokeWidth="7" opacity="0.8" />
            <path d="M600 330 C 740 310, 880 340, 1020 320" strokeWidth="7" opacity="0.8" />
            <path d="M120 -20 C 130 100, 110 240, 140 380" strokeWidth="6" opacity="0.7" />
            <path d="M860 300 C 850 400, 880 520, 860 640" strokeWidth="6" opacity="0.7" />
          </g>
          {/* 지하철 라인 */}
          <path
            d="M-20 560 C 200 520, 380 400, 520 360 C 680 315, 840 330, 1020 260"
            fill="none"
            stroke="#9DB8A6"
            strokeWidth="5"
            strokeDasharray="2 14"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>

        {/* 동네 라벨 */}
        {labels.map((l) => (
          <span
            key={l.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[12px] font-medium tracking-wide text-[#B3A78E]"
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
            aria-hidden
          >
            {l.name}
          </span>
        ))}

        {/* 역 마커 */}
        {station && (
          <div
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: "50%", top: "52%" }}
            aria-hidden
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-teal-500 bg-white text-[9px] font-bold text-teal-600">
              {station.name.charAt(0)}
            </span>
            <span className="rounded bg-white/80 px-1 text-[10.5px] font-semibold text-teal-600 backdrop-blur-sm">
              {station.station}
            </span>
          </div>
        )}

        {/* 현재 위치 */}
        {showMe && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${me.x}%`, top: `${me.y}%` }}
            aria-label="현재 위치"
          >
            <span className="absolute inset-0 rounded-full bg-sky-400/50 animate-pulse-ring" />
            <span className="relative block h-4 w-4 rounded-full border-[3px] border-white bg-sky-500 shadow-marker" />
          </div>
        )}

        {/* 카페 마커 */}
        {cafes.map((cafe, idx) => {
          const pos = proj(cafe.lat, cafe.lng);
          const score = workScore(cafe.metrics);
          const point = hourlyAt(cafe, hour);
          const crowdLv = levelOf(point.crowd);
          const selected = cafe.id === selectedId;
          const hovered = cafe.id === hoveredId;
          const recommended = cafe.id === topScoreId;
          const veryQuiet = cafe.metrics.noiseScore >= 86;

          const pinColor = selected
            ? "bg-coffee-800 text-cream-50"
            : veryQuiet
              ? "bg-forest-600 text-white"
              : crowdLv === "busy"
                ? "bg-coffee-300 text-white"
                : "bg-coffee-600 text-cream-100";

          return (
            <button
              key={cafe.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(selected ? null : cafe.id);
              }}
              className="marker-enter absolute -translate-x-1/2 -translate-y-full"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                zIndex: selected ? 30 : hovered ? 25 : 10,
                animationDelay: `${Math.min(idx * 40, 400)}ms`,
              }}
              aria-label={`${cafe.name}, 작업점수 ${score}점`}
              aria-pressed={selected}
            >
              <span
                className={`relative flex flex-col items-center transition-transform duration-200 ${
                  selected ? "scale-125" : hovered ? "scale-110" : "hover:scale-110"
                }`}
              >
                {recommended && !selected && (
                  <span className="absolute -top-5 whitespace-nowrap rounded-full bg-forest-600 px-1.5 py-[1px] text-[8.5px] font-bold text-white shadow-marker">
                    추천
                  </span>
                )}
                <span
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full rounded-br-[4px] shadow-marker transition-colors duration-200 ${pinColor}`}
                  style={{ transform: "rotate(45deg)" }}
                >
                  <Coffee size={14} strokeWidth={2.2} style={{ transform: "rotate(-45deg)" }} />
                  <span
                    className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-cream-200 bg-white px-0.5 text-[9px] font-bold text-coffee-800"
                    style={{ transform: "rotate(-45deg)" }}
                  >
                    {score}
                  </span>
                </span>
                <span
                  className={`h-2.5 w-[2px] ${selected ? "bg-coffee-800" : "bg-coffee-600/70"}`}
                />
              </span>
            </button>
          );
        })}
      </div>

      {/* 줌 컨트롤 */}
      <div
        className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-cream-200 bg-white shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.25, 1.75))}
          className="flex h-9 w-9 items-center justify-center text-coffee-600 transition-colors hover:bg-cream-100"
          aria-label="확대"
        >
          <Plus size={16} />
        </button>
        <div className="mx-2 h-px bg-cream-200" />
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
          className="flex h-9 w-9 items-center justify-center text-coffee-600 transition-colors hover:bg-cream-100"
          aria-label="축소"
        >
          <Minus size={16} />
        </button>
        <div className="mx-2 h-px bg-cream-200" />
        <button
          onClick={() => {
            setZoom(1);
            onSelect(null);
          }}
          className="flex h-9 w-9 items-center justify-center text-coffee-600 transition-colors hover:bg-cream-100"
          aria-label="지도 초기화"
        >
          <LocateFixed size={16} />
        </button>
      </div>

      {/* 데모 안내 */}
      <div className="pointer-events-none absolute bottom-2 right-3 z-20 flex items-center gap-1 text-[10px] text-coffee-300">
        <Navigation size={10} />
        Demo Map · CafeFocus
      </div>

      {children}
    </div>
  );
}
