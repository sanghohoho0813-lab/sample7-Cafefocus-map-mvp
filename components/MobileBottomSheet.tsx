"use client";

import { useRef } from "react";

export type SheetState = "collapsed" | "half" | "expanded";

const ORDER: SheetState[] = ["collapsed", "half", "expanded"];

/**
 * 모바일 지도 위 목록 시트.
 * 핸들 탭·스와이프로 접힘 → 절반 → 펼침. 높이는 지도 영역 대비 비율이라
 * 기기 높이와 상단 조작부 높이가 달라도 비율이 유지된다.
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
  const touchY = useRef<number | null>(null);
  const height = state === "collapsed" ? `${collapsedHeight}px` : state === "half" ? "55%" : "92%";

  const step = (dir: 1 | -1) => {
    const idx = ORDER.indexOf(state);
    const next = ORDER[Math.min(Math.max(idx + dir, 0), ORDER.length - 1)];
    if (next !== state) onStateChange(next);
  };

  return (
    <section
      className="absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-3xl border-t border-cream-300/70 bg-white shadow-sheet transition-[height] duration-200 ease-out lg:hidden"
      style={{ height }}
      aria-label="카페 목록"
      onTouchStart={(e) => {
        touchY.current = e.touches[0].clientY;
      }}
      onTouchEnd={(e) => {
        if (touchY.current === null) return;
        const dy = e.changedTouches[0].clientY - touchY.current;
        touchY.current = null;
        // 목록을 스크롤하는 중에는 시트 높이를 바꾸지 않는다
        const list = e.currentTarget.querySelector("[data-sheet-body]");
        if (list && list.scrollTop > 0 && dy > 0) return;
        if (dy < -40) step(1);
        else if (dy > 40) step(-1);
      }}
    >
      <button
        type="button"
        onClick={() => step(state === "expanded" ? -1 : 1)}
        className="flex h-6 w-full shrink-0 items-center justify-center"
        aria-label={state === "expanded" ? "목록 줄이기" : "목록 더 보기"}
        data-sheet-handle
      >
        <span className="h-1 w-10 rounded-full bg-cream-400" />
      </button>
      {header && <div className="shrink-0 px-4 pb-2">{header}</div>}
      <div
        data-sheet-body
        className={`min-h-0 flex-1 px-4 pb-4 ${state === "collapsed" ? "overflow-hidden" : "overflow-y-auto overscroll-contain"}`}
      >
        {children}
      </div>
    </section>
  );
}
