"use client";

import { useEffect, useRef, useState } from "react";

export type SheetState = "collapsed" | "half" | "expanded";

const ORDER: SheetState[] = ["collapsed", "half", "expanded"];

/** 펼침 단계별 높이 — 지도 영역 대비 비율이라 기기 높이·상단 조작부 높이가 달라도 비율이 유지된다 */
const RATIO: Record<Exclude<SheetState, "collapsed">, number> = { half: 0.55, expanded: 0.92 };

/**
 * 모바일 지도 위 목록 시트.
 * 손가락을 따라 높이가 바뀌고, 놓으면 가까운 단계(접힘 · 절반 · 펼침)로 붙는다. 빠르게 튕기면 그 방향 다음 단계로.
 * - 목록을 스크롤하는 중이거나, 가로로 넘기는 카드를 밀 때는 시트를 움직이지 않는다
 * - 핸들 탭: 접힘 → 절반 → 펼침 → 다시 접힘 (탭만으로도 지도로 돌아올 수 있게)
 */
export default function MobileBottomSheet({
  state,
  onStateChange,
  header,
  children,
  collapsedHeight = 150,
}: {
  state: SheetState;
  onStateChange: (s: SheetState) => void;
  header?: React.ReactNode;
  children: React.ReactNode;
  /** 접힘 상태 높이(px) */
  collapsedHeight?: number;
}) {
  const sheetRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [dragPx, setDragPx] = useState<number | null>(null);
  const suppressClick = useRef(false);
  // 최신 값을 네이티브 리스너에서 읽기 위한 참조
  const live = useRef({ state, collapsedHeight, onStateChange });
  live.current = { state, collapsedHeight, onStateChange };

  const height = state === "collapsed" ? `${collapsedHeight}px` : `${RATIO[state] * 100}%`;

  const step = (dir: 1 | -1) => {
    const idx = ORDER.indexOf(state);
    const next = ORDER[Math.min(Math.max(idx + dir, 0), ORDER.length - 1)];
    if (next !== state) onStateChange(next);
  };

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    type Drag = {
      y0: number;
      x0: number;
      h0: number;
      axis: "x" | "y" | null;
      inBody: boolean;
      active: boolean;
      samples: { y: number; t: number }[];
    };
    let d: Drag | null = null;

    const parentH = () => sheet.parentElement?.clientHeight ?? window.innerHeight;
    const snapPx = () => {
      const ph = parentH();
      return { collapsed: live.current.collapsedHeight, half: RATIO.half * ph, expanded: RATIO.expanded * ph };
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const inBody = !!bodyRef.current?.contains(e.target as Node);
      d = { y0: t.clientY, x0: t.clientX, h0: sheet.getBoundingClientRect().height, axis: null, inBody, active: false, samples: [{ y: t.clientY, t: e.timeStamp }] };
    };

    const onMove = (e: TouchEvent) => {
      if (!d) return;
      const t = e.touches[0];
      const dy = t.clientY - d.y0;
      const dx = t.clientX - d.x0;
      if (!d.axis) {
        if (Math.hypot(dx, dy) < 6) return;
        d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (d.axis === "x") {
          d = null; // 가로 카드 넘기기
          return;
        }
        const body = bodyRef.current;
        const { state: st } = live.current;
        // 목록을 스크롤하는 중: 펼친 상태에서 위로 밀거나, 이미 내려 둔 목록을 아래로 당길 때
        if (d.inBody && body && ((st === "expanded" && dy < 0) || body.scrollTop > 0)) {
          d = null;
          return;
        }
        d.active = true;
      }
      if (!d.active) return;
      e.preventDefault();
      const s = snapPx();
      const h = Math.min(Math.max(d.h0 - dy, s.collapsed - 24), s.expanded + 12);
      d.samples.push({ y: t.clientY, t: e.timeStamp });
      if (d.samples.length > 5) d.samples.shift();
      setDragPx(h);
    };

    const onEnd = () => {
      if (!d) return;
      const drag = d;
      d = null;
      if (!drag.active) return;
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 50);
      const h = sheet.getBoundingClientRect().height;
      const s = snapPx();
      const first = drag.samples[0];
      const last = drag.samples[drag.samples.length - 1];
      const v = last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0; // px/ms, 아래로 +
      const points: [SheetState, number][] = [
        ["collapsed", s.collapsed],
        ["half", s.half],
        ["expanded", s.expanded],
      ];
      let next: SheetState;
      if (Math.abs(v) > 0.45) {
        // 빠르게 튕김: 지금 높이에서 그 방향의 다음 단계
        next =
          v < 0
            ? (points.find(([, p]) => p > h + 8)?.[0] ?? "expanded")
            : ([...points].reverse().find(([, p]) => p < h - 8)?.[0] ?? "collapsed");
      } else {
        next = points.reduce((a, b) => (Math.abs(b[1] - h) < Math.abs(a[1] - h) ? b : a))[0];
      }
      setDragPx(null);
      if (next !== live.current.state) live.current.onStateChange(next);
    };

    sheet.addEventListener("touchstart", onStart, { passive: true });
    sheet.addEventListener("touchmove", onMove, { passive: false });
    sheet.addEventListener("touchend", onEnd);
    sheet.addEventListener("touchcancel", onEnd);
    return () => {
      sheet.removeEventListener("touchstart", onStart);
      sheet.removeEventListener("touchmove", onMove);
      sheet.removeEventListener("touchend", onEnd);
      sheet.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  return (
    <section
      ref={sheetRef}
      className={`absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-3xl border-t border-cream-300/70 bg-white shadow-sheet lg:hidden ${
        dragPx === null ? "transition-[height] duration-300 ease-[cubic-bezier(0.2,0.9,0.25,1)]" : ""
      }`}
      style={{ height: dragPx === null ? height : `${dragPx}px` }}
      aria-label="카페 목록"
    >
      <button
        type="button"
        onClick={() => {
          if (suppressClick.current) return;
          if (state === "expanded") onStateChange("collapsed");
          else step(1);
        }}
        className="flex h-7 w-full shrink-0 cursor-grab touch-none items-center justify-center"
        aria-label={state === "expanded" ? "목록 접고 지도 보기" : "목록 더 보기"}
        data-sheet-handle
      >
        <span className={`h-1 rounded-full transition-all duration-200 ${dragPx !== null ? "w-12 bg-coffee-300" : "w-10 bg-cream-400"}`} />
      </button>
      {header && <div className="shrink-0 px-4 pb-2">{header}</div>}
      <div
        ref={bodyRef}
        data-sheet-body
        className={`min-h-0 flex-1 px-4 ${
          // 아래쪽은 공용 뒤로·앞으로 버튼 자리 — 카드가 그 밑에 깔리지 않게 비워 둔다
          state === "collapsed" && dragPx === null ? "overflow-hidden pb-14" : "overflow-y-auto overscroll-contain pb-20"
        }`}
      >
        {children}
      </div>
    </section>
  );
}
