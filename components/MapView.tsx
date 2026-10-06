"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, LocateFixed, Navigation, CalendarCheck2, Info } from "lucide-react";
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
  maxX = 85,
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
    x: Math.min(Math.max(p.x, 8), maxX),
    y: Math.min(Math.max(p.y, 16), 64),
  }));
}

/** 마커(점수 알약 + 꼬리)가 실제로 차지하는 크기, px */
const MARKER_W = 46;
const MARKER_H = 34;

/** 확대 단계 — 확대하면 마커 크기는 그대로, 간격만 벌어진다 (실제 지도처럼) */
const ZOOMS = [1, 1.5, 2, 2.5];

/** 기본 좌표(%)를 현재 확대·이동 상태의 화면 위치로 — 측정 전(SSR)에도 맞도록 CSS calc 사용 */
function placeStyle(x: number, y: number, zoom: number, pan: { x: number; y: number }) {
  return {
    left: `calc(50% + ${((x - 50) * zoom).toFixed(3)}% + ${pan.x}px)`,
    top: `calc(50% + ${((y - 50) * zoom).toFixed(3)}% + ${pan.y}px)`,
  };
}

export default function MapView({
  cafes,
  scores,
  openIds,
  plannedIds,
  selectedId,
  hoveredId,
  onSelect,
  area,
  purposeLabel,
  onLegendClick,
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
  /** 범례에 쓰는 현재 목적 이름 */
  purposeLabel: string;
  /** 범례를 누르면 계산 기준을 보여준다 */
  onLegendClick?: () => void;
  children?: React.ReactNode;
}) {
  const [zi, setZi] = useState(0);
  const zoom = ZOOMS[zi];
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const drag = useRef<{ id: number; sx: number; sy: number; px: number; py: number; moved: boolean } | null>(null);
  const swallowClick = useRef(false);
  const wheelAcc = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** 지도 밖으로 너무 멀리 끌려가지 않게 이동 범위를 제한 */
  const clampPan = useCallback(
    (x: number, y: number, z: number) => {
      const w = size.w || 720;
      const h = size.h || 620;
      const lx = ((z - 1) * w) / 2 + w * 0.15;
      const ly = ((z - 1) * h) / 2 + h * 0.15;
      return { x: Math.min(Math.max(x, -lx), lx), y: Math.min(Math.max(y, -ly), ly) };
    },
    [size.w, size.h]
  );

  /** 화면의 한 점(기본: 가운데)을 고정한 채 확대 단계를 바꾼다 */
  const zoomTo = useCallback(
    (nextIdx: number, anchor?: { x: number; y: number }) => {
      const idx = Math.min(Math.max(nextIdx, 0), ZOOMS.length - 1);
      if (idx === zi) return;
      const z1 = ZOOMS[zi];
      const z2 = ZOOMS[idx];
      const ax = anchor?.x ?? 0; // 가운데 기준 오프셋(px)
      const ay = anchor?.y ?? 0;
      setPan((p) => (idx === 0 ? { x: 0, y: 0 } : clampPan(ax - (ax - p.x) * (z2 / z1), ay - (ay - p.y) * (z2 / z1), z2)));
      setZi(idx);
    },
    [zi, clampPan]
  );

  const reset = () => {
    setZi(0);
    setPan({ x: 0, y: 0 });
  };

  const lastArea = useRef(area);

  const proj = useMemo(
    () => project(cafes.length ? cafes : [{ lat: DEMO_LOCATION.lat, lng: DEMO_LOCATION.lng } as Cafe]),
    [cafes]
  );

  // 마커 실제 크기를 "확대된" 지도 대비 %로 환산해 간격을 정한다.
  // 확대할수록 필요한 보정이 줄어 마커가 실제 위치에 가까워진다.
  const positions = useMemo(() => {
    const w = (size.w || 720) * zoom;
    const h = (size.h || 620) * zoom;
    const minX = Math.min((MARKER_W / w) * 100, 22);
    const minY = Math.min((MARKER_H / h) * 100, 16);
    // 순위(목적·시간)와 무관한 고정 순서로 분리해야 조건을 바꿔도 마커가 제자리에 있다
    const stable = [...cafes].sort((a, b) => a.id.localeCompare(b.id));
    // 오른쪽 줌 버튼(약 64px)에 마커가 가리지 않게 — 좁은 화면일수록 % 여유가 커야 한다
    const baseW = size.w || 720;
    const maxX = Math.min(85, 100 - ((64 + MARKER_W / 2) / baseW) * 100);
    const sep = separateMarkers(stable.map((c) => proj(c.lat, c.lng)), minX, minY, maxX);
    const byId = new Map(stable.map((c, i) => [c.id, sep[i]]));
    return cafes.map((c) => byId.get(c.id)!);
  }, [cafes, proj, size.w, size.h, zoom]);

  // 검색 등으로 고른 카페가 화면 밖이면 보이는 곳으로 지도를 옮긴다
  useEffect(() => {
    // 지역을 함께 바꾼 선택(검색)은 위에서 처음 상태로 돌아가 모두 보이므로 옮기지 않는다
    if (!selectedId || !size.w || lastArea.current !== area) return;
    const idx = cafes.findIndex((c) => c.id === selectedId);
    if (idx < 0) return;
    const pos = positions[idx];
    const sx = size.w / 2 + ((pos.x - 50) / 100) * size.w * zoom + pan.x;
    const sy = size.h / 2 + ((pos.y - 50) / 100) * size.h * zoom + pan.y;
    const inView = sx > 48 && sx < size.w - 64 && sy > 56 && sy < size.h * 0.62;
    if (inView) return;
    setPan(clampPan(pan.x + (size.w / 2 - sx), pan.y + (size.h * 0.38 - sy), zoom));
    // 선택이 바뀔 때만 확인한다 (드래그 중 다시 끌어오지 않도록)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // 지역이 바뀌면 투영이 새로 계산되므로 확대·이동도 처음으로 (선택 효과보다 뒤에 둔다)
  useEffect(() => {
    if (lastArea.current === area) return;
    lastArea.current = area;
    setZi(0);
    setPan({ x: 0, y: 0 });
  }, [area]);

  const labels = AREA_LABELS[area ?? "all"];
  const me = proj(DEMO_LOCATION.lat, DEMO_LOCATION.lng);
  const showMe = area === null || area === "seongsu";
  const station = area ? AREA_MAP[area] : null;
  const fromUi = (t: EventTarget) => (t as HTMLElement).closest?.("[data-map-ui]") != null;

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full touch-none select-none overflow-hidden bg-[#F3EEE2] ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      role="region"
      aria-label="카페 지도 — 끌어서 이동, 휠로 확대"
      onPointerDown={(e) => {
        swallowClick.current = false;
        if (e.button !== 0 || fromUi(e.target)) return;
        drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.sx;
        const dy = e.clientY - d.sy;
        if (!d.moved) {
          // 살짝 떨린 탭은 클릭으로 처리
          if (Math.hypot(dx, dy) < 6) return;
          d.moved = true;
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        setPan(clampPan(d.px + dx, d.py + dy, zoom));
      }}
      onPointerUp={() => {
        if (drag.current?.moved) swallowClick.current = true;
        drag.current = null;
        setDragging(false);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
      }}
      onClickCapture={(e) => {
        // 끌기를 마친 직후의 클릭은 마커 선택·해제로 처리하지 않는다
        if (swallowClick.current) {
          swallowClick.current = false;
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onClick={(e) => {
        if (!fromUi(e.target)) onSelect(null);
      }}
      onWheel={(e) => {
        if (fromUi(e.target)) return;
        wheelAcc.current += e.deltaY;
        if (Math.abs(wheelAcc.current) < 80) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const anchor = { x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2 };
        zoomTo(zi + (wheelAcc.current < 0 ? 1 : -1), anchor);
        wheelAcc.current = 0;
      }}
    >
      <div
        className={`absolute inset-0 ${dragging ? "" : "transition-transform duration-300 ease-out"}`}
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "50% 50%" }}
      >
        <MapCanvas />
      </div>

      {/* 라벨·마커는 확대해도 크기가 그대로이고 위치만 따라간다 */}
      <div className={`absolute inset-0 ${dragging ? "" : "[&>*]:transition-[left,top] [&>*]:duration-300 [&>*]:ease-out"}`}>
        {labels.map((l) => (
          <span
            key={l.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-meta font-bold tracking-wide"
            style={{
              ...placeStyle(l.x, l.y, zoom, pan),
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
            style={placeStyle(50, 52, zoom, pan)}
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
            style={placeStyle(me.x, me.y, zoom, pan)}
            role="img"
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
          const named = selected || hovered;

          // 색은 의미가 있을 때만: 매우 적합(초록) · 영업 외(흐림) · 선택(진함)
          const tone = named
            ? "border-coffee-900 bg-coffee-900 text-white"
            : !open
              ? "border-cream-300 bg-cream-100 text-coffee-400"
              : score >= 85
                ? "border-forest-600 bg-forest-600 text-white"
                : "border-coffee-200 bg-white text-coffee-800";

          return (
            <button
              key={cafe.id}
              type="button"
              data-cafe-marker={cafe.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(selected ? null : cafe.id);
              }}
              className="group absolute -translate-x-1/2 -translate-y-full rounded-full pb-1.5 hover:!z-[28] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coffee-700"
              style={{
                ...placeStyle(pos.x, pos.y, zoom, pan),
                zIndex: selected ? 30 : hovered ? 25 : planned ? 15 : open ? 10 : 5,
              }}
              aria-label={`${cafe.name}, 적합도 ${score}점${open ? "" : ", 영업 외"}${planned ? ", 작업 예정" : ""}`}
              aria-pressed={selected}
            >
              <span
                className="marker-enter block"
                style={{ animationDelay: `${Math.min(idx * 20, 300)}ms` }}
              >
                <span
                  className={`relative flex h-7 items-center gap-1 rounded-full border px-2.5 text-[13px] font-bold shadow-marker transition-[background-color,color,transform] duration-150 ${tone} ${
                    selected ? "scale-110" : "group-hover:scale-105"
                  }`}
                >
                  {planned && <CalendarCheck2 size={13} strokeWidth={2.4} className="shrink-0" aria-hidden />}
                  <span className={`max-w-[150px] truncate font-semibold ${named ? "" : "hidden"}`}>{cafe.name}</span>
                  <span className="num">{score}</span>
                  <span
                    className={`absolute left-1/2 top-full -ml-1 -mt-1 h-2 w-2 rotate-45 border-b border-r ${tone}`}
                    aria-hidden
                  />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* 범례 — 숫자가 무엇인지 처음 보는 사람도 알 수 있게, 누르면 계산 기준 */}
      <button
        type="button"
        data-map-ui
        onClick={onLegendClick}
        className="absolute left-3 top-3 z-20 flex h-8 items-center gap-2 rounded-full bg-white/95 px-3 text-caption font-medium text-coffee-600 shadow-card transition-colors hover:bg-white hover:text-coffee-800"
        aria-label={`지도 숫자는 ${purposeLabel} 적합도예요. 계산 기준 보기`}
      >
        <span>
          숫자 = <b className="font-semibold text-coffee-800">{purposeLabel} 적합도</b>
        </span>
        <span className="h-3 w-px bg-cream-300" aria-hidden />
        <span className="flex items-center gap-1" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-forest-600" />
          85+
        </span>
        <Info size={14} className="text-coffee-400" aria-hidden />
      </button>

      {/* 줌 컨트롤 */}
      <div
        data-map-ui
        className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 cursor-default flex-col overflow-hidden rounded-xl border border-cream-300 bg-white shadow-card"
      >
        <button
          type="button"
          onClick={() => zoomTo(zi + 1)}
          disabled={zi === ZOOMS.length - 1}
          className="flex h-10 w-10 items-center justify-center text-coffee-600 transition-colors hover:bg-cream-100 disabled:text-coffee-200 disabled:hover:bg-transparent"
          aria-label="지도 확대"
        >
          <Plus size={18} />
        </button>
        <div className="mx-2 h-px bg-cream-200" />
        <button
          type="button"
          onClick={() => zoomTo(zi - 1)}
          disabled={zi === 0}
          className="flex h-10 w-10 items-center justify-center text-coffee-600 transition-colors hover:bg-cream-100 disabled:text-coffee-200 disabled:hover:bg-transparent"
          aria-label="지도 축소"
        >
          <Minus size={18} />
        </button>
        <div className="mx-2 h-px bg-cream-200" />
        <button
          type="button"
          onClick={() => {
            reset();
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
          <span className="text-[11px] font-semibold leading-none text-coffee-500">{zoom >= 2 ? "250m" : "500m"}</span>
          <div className="mt-0.5 flex h-[6px] w-14 items-stretch border border-coffee-400">
            <span className="flex-1 bg-coffee-500" />
            <span className="flex-1 bg-white" />
            <span className="flex-1 bg-coffee-500" />
            <span className="flex-1 bg-white" />
          </div>
        </div>
      </div>

      {children && (
        <div data-map-ui className="cursor-default">
          {children}
        </div>
      )}
    </div>
  );
}
