"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Coffee, Plus, Minus, LocateFixed, Navigation, CalendarCheck2 } from "lucide-react";
import type { AreaKey, Cafe } from "@/lib/types";
import { AREA_MAP, DEMO_LOCATION } from "@/lib/data/cafes";
import MapCanvas from "@/components/MapCanvas";

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

/**
 * 마커 겹침 분리.
 * 전체 지역을 함께 보면 같은 동네 카페들이 한 점에 뭉쳐 서로를 가려버린다.
 * 실제 좌표에서 최소한만 밀어내 모든 마커를 누를 수 있게 한다 (표시 전용 보정).
 */
function separateMarkers(
  points: { x: number; y: number }[],
  minX: number,
  minY: number,
  iterations = 160
) {
  const pts = points.map((p) => ({ ...p }));
  for (let it = 0; it < iterations; it++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        // x/y 축 최소 간격이 다르므로 정규화 후 거리 비교
        const nx = (pts[j].x - pts[i].x) / minX;
        const ny = (pts[j].y - pts[i].y) / minY;
        const d = Math.hypot(nx, ny);
        if (d >= 1) continue;
        // 완전히 겹칠 때는 인덱스로 방향을 정해 결과를 결정적으로 유지
        const angle = ((i * 37 + j * 11) % 360) * (Math.PI / 180);
        const ux = d < 1e-6 ? Math.cos(angle) : nx / d;
        const uy = d < 1e-6 ? Math.sin(angle) : ny / d;
        const push = (1 - d) / 2;
        pts[i].x -= ux * push * minX;
        pts[i].y -= uy * push * minY;
        pts[j].x += ux * push * minX;
        pts[j].y += uy * push * minY;
        moved = true;
      }
    }
    if (!moved) break;
  }
  // 상단 배너·줌 컨트롤·Bottom Sheet에 가리지 않는 영역으로 클램프
  return pts.map((p) => ({
    x: Math.min(Math.max(p.x, 8), 85),
    y: Math.min(Math.max(p.y, 16), 64),
  }));
}

/** 마커가 실제로 차지하는 크기(핀 + 오른쪽 점수 배지 + 아래 꼬리), px */
const MARKER_W = 56;
const MARKER_H = 48;

export default function MapView({
  cafes,
  scores,
  openIds,
  plannedIds,
  selectedId,
  hoveredId,
  onSelect,
  area,
  children,
}: {
  cafes: Cafe[];
  /** 목적·시간 기준 적합도 */
  scores: Record<string, number>;
  /** 기준 시간에 영업 중인 카페 */
  openIds: Set<string>;
  /** 예정된 작업 계획이 있는 카페 */
  plannedIds: Set<string>;
  selectedId: string | null;
  hoveredId?: string | null;
  onSelect: (id: string | null) => void;
  area: AreaKey | null;
  children?: React.ReactNode;
}) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const proj = useMemo(
    () => project(cafes.length ? cafes : [{ lat: DEMO_LOCATION.lat, lng: DEMO_LOCATION.lng } as Cafe]),
    [cafes]
  );

  // 마커 실제 크기(핀 + 점수 배지)를 컨테이너 대비 %로 환산해 간격을 정한다.
  // 폭이 좁은 모바일에서 같은 %가 훨씬 작은 픽셀이 되어 겹치는 문제를 막는다.
  const positions = useMemo(() => {
    const w = size.w || 720;
    const h = size.h || 620;
    const minX = Math.min((MARKER_W / w) * 100, 22);
    const minY = Math.min((MARKER_H / h) * 100, 16);
    // 순위(목적·시간)와 무관한 고정 순서로 분리해야 조건을 바꿔도 마커가 제자리에 있다
    const stable = [...cafes].sort((a, b) => a.id.localeCompare(b.id));
    const sep = separateMarkers(stable.map((c) => proj(c.lat, c.lng)), minX, minY);
    const byId = new Map(stable.map((c, i) => [c.id, sep[i]]));
    return cafes.map((c) => byId.get(c.id)!);
  }, [cafes, proj, size.w, size.h]);

  const labels = AREA_LABELS[area ?? "all"];
  const me = proj(DEMO_LOCATION.lat, DEMO_LOCATION.lng);
  const showMe = area === null || area === "seongsu";
  const station = area ? AREA_MAP[area] : null;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full select-none overflow-hidden bg-[#F3EEE2]"
      onClick={() => onSelect(null)}
      role="region"
      aria-label="카페 지도"
    >
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{ transform: `scale(${zoom})`, transformOrigin: "50% 50%" }}
      >
        <MapCanvas />

        {labels.map((l) => (
          <span
            key={l.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-meta font-bold tracking-wide"
            style={{
              left: `${l.x}%`,
              top: `${l.y}%`,
              color: "#8D8064",
              textShadow:
                "0 1px 0 rgba(255,255,255,0.95), 0 -1px 0 rgba(255,255,255,0.95), 1px 0 0 rgba(255,255,255,0.95), -1px 0 0 rgba(255,255,255,0.95)",
            }}
            aria-hidden
          >
            {l.name}
          </span>
        ))}

        {station && (
          <div
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: "50%", top: "52%" }}
            aria-hidden
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-teal-600 bg-white text-[12px] font-bold text-teal-700 shadow-marker">
              {station.name.charAt(0)}
            </span>
            <span className="rounded bg-white/90 px-1.5 py-0.5 text-caption font-bold text-teal-700 shadow-sm">
              {station.station}
            </span>
          </div>
        )}

        {showMe && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${me.x}%`, top: `${me.y}%` }}
            aria-label="현재 위치 (데모)"
          >
            <span className="absolute inset-0 rounded-full bg-sky-400/50 animate-pulse-ring" />
            <span className="relative block h-4 w-4 rounded-full border-[3px] border-white bg-sky-500 shadow-marker" />
          </div>
        )}

        {cafes.map((cafe, idx) => {
          const pos = positions[idx];
          const score = scores[cafe.id] ?? 0;
          const open = openIds.has(cafe.id);
          const planned = plannedIds.has(cafe.id);
          const selected = cafe.id === selectedId;
          const hovered = cafe.id === hoveredId;

          // 색은 의미가 있을 때만: 적합도 높음(초록) · 영업 외(흐림) · 선택(진함)
          const pinColor = selected
            ? "bg-coffee-900 text-cream-50"
            : !open
              ? "bg-coffee-200 text-white"
              : score >= 85
                ? "bg-forest-600 text-white"
                : "bg-coffee-600 text-cream-100";

          return (
            <button
              key={cafe.id}
              data-cafe-marker={cafe.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(selected ? null : cafe.id);
              }}
              className="marker-enter absolute -translate-x-1/2 -translate-y-full rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coffee-700"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                zIndex: selected ? 30 : hovered ? 25 : planned ? 15 : 10,
                animationDelay: `${Math.min(idx * 25, 300)}ms`,
              }}
              aria-label={`${cafe.name}, 적합도 ${score}점${open ? "" : ", 영업 외"}${planned ? ", 작업 예정" : ""}`}
              aria-pressed={selected}
            >
              <span
                className={`relative flex flex-col items-center transition-transform duration-200 ${
                  selected ? "scale-125" : hovered ? "scale-110" : "hover:scale-110"
                }`}
              >
                <span
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full rounded-br-[4px] shadow-marker transition-colors duration-200 ${pinColor}`}
                  style={{ transform: "rotate(45deg)" }}
                >
                  <Coffee size={16} strokeWidth={2.2} style={{ transform: "rotate(-45deg)" }} />
                  <span
                    className="num absolute -right-2 -top-2 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border border-cream-300 bg-white px-0.5 text-[11.5px] font-bold text-coffee-800"
                    style={{ transform: "rotate(-45deg)" }}
                  >
                    {score}
                  </span>
                  {planned && (
                    <span
                      className="absolute -left-2 -top-2 flex h-[19px] w-[19px] items-center justify-center rounded-full bg-coffee-900 text-cream-50 ring-2 ring-white"
                      style={{ transform: "rotate(-45deg)" }}
                    >
                      <CalendarCheck2 size={11} strokeWidth={2.4} />
                    </span>
                  )}
                </span>
                <span className={`h-2.5 w-[2px] ${selected ? "bg-coffee-900" : "bg-coffee-600/70"}`} />
              </span>
            </button>
          );
        })}
      </div>

      {/* 줌 컨트롤 */}
      <div
        className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-cream-300 bg-white shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.25, 1.75))}
          className="flex h-10 w-10 items-center justify-center text-coffee-600 transition-colors hover:bg-cream-100"
          aria-label="지도 확대"
        >
          <Plus size={18} />
        </button>
        <div className="mx-2 h-px bg-cream-200" />
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
          className="flex h-10 w-10 items-center justify-center text-coffee-600 transition-colors hover:bg-cream-100"
          aria-label="지도 축소"
        >
          <Minus size={18} />
        </button>
        <div className="mx-2 h-px bg-cream-200" />
        <button
          onClick={() => {
            setZoom(1);
            onSelect(null);
          }}
          className="flex h-10 w-10 items-center justify-center text-coffee-600 transition-colors hover:bg-cream-100"
          aria-label="지도 처음 상태로"
        >
          <LocateFixed size={18} />
        </button>
      </div>

      {/* 방위 */}
      <div
        className="pointer-events-none absolute right-3 top-3 z-20 flex h-9 w-9 flex-col items-center justify-center rounded-full border border-cream-300 bg-white/95"
        aria-hidden
      >
        <span className="text-[10px] font-bold leading-none text-coffee-700">N</span>
        <Navigation size={11} className="mt-0.5 fill-coffee-500 text-coffee-500" />
      </div>

      {/* 축척 · 데모 표기 */}
      <div className="pointer-events-none absolute bottom-2 right-3 z-20 flex items-end gap-2" aria-hidden>
        <span className="text-caption text-coffee-400">Demo Map</span>
        <div className="flex flex-col items-center rounded bg-white/85 px-2 py-1">
          <span className="text-[11px] font-semibold leading-none text-coffee-500">500m</span>
          <div className="mt-0.5 flex h-[6px] w-14 items-stretch border border-coffee-400">
            <span className="flex-1 bg-coffee-500" />
            <span className="flex-1 bg-white" />
            <span className="flex-1 bg-coffee-500" />
            <span className="flex-1 bg-white" />
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
