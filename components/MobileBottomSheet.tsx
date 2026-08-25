"use client";

import { useRef } from "react";

export type SheetState = "collapsed" | "half" | "expanded";

const ORDER: SheetState[] = ["collapsed", "half", "expanded"];

/**
 * 모바일 Bottom Sheet.
 * 핸들 탭 또는 위/아래 스와이프로 collapsed → half → expanded 전환.
 */
export default function MobileBottomSheet({
  state,
  onStateChange,
  header,
  children,
  collapsedHeight = "132px",
}: {
  state: SheetState;
  onStateChange: (s: SheetState) => void;
  header?: React.ReactNode;
  children: React.ReactNode;
  collapsedHeight?: string;
}) {
  const touchY = useRef<number | null>(null);
  const HEIGHTS: Record<SheetState, string> = {
    collapsed: collapsedHeight,
    half: "46vh",
    expanded: "78vh",
  };

  const step = (dir: 1 | -1) => {
    const idx = ORDER.indexOf(state);
    const next = ORDER[Math.min(Math.max(idx + dir, 0), ORDER.length - 1)];
    if (next !== state) onStateChange(next);
  };

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-3xl border-t border-cream-200 bg-white shadow-sheet transition-[height] duration-300 ease-out lg:hidden"
      style={{ height: HEIGHTS[state] }}
    >
      {/* Drag handle */}
      <div
        className="shrink-0 cursor-grab touch-none px-4 pb-1 pt-2.5"
        onClick={() => step(state === "expanded" ? -1 : 1)}
        onTouchStart={(e) => {
          touchY.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          if (touchY.current === null) return;
          const dy = e.changedTouches[0].clientY - touchY.current;
          touchY.current = null;
          if (dy < -30) step(1);
          else if (dy > 30) step(-1);
        }}
        role="button"
        aria-label="시트 크기 조절"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-cream-300" />
        {header && <div className="mt-2">{header}</div>}
      </div>
      <div
        className={`min-h-0 flex-1 px-4 pb-4 ${
          state === "collapsed" ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
