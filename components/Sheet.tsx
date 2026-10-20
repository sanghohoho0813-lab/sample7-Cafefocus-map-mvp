"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * 모바일에서는 바텀시트, 데스크톱에서는 가운데 대화상자.
 * Esc·배경 클릭으로 닫히고, 닫히면 열었던 버튼으로 포커스를 돌려준다.
 * 모바일은 아래로 끌어내려도 닫힌다 (내용을 스크롤하는 중에는 내용만 움직인다).
 */
export default function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  // 부모가 인라인 함수를 넘겨도 열려 있는 동안 효과가 다시 돌지 않도록 고정
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    // 열려 있는 동안 화면 위에 떠 있는 공용 뒤로·앞으로 버튼을 숨긴다 (시트 버튼을 가리지 않게)
    document.documentElement.dataset.sheetOpen = "true";
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
      // 간단한 포커스 가두기
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevOverflow;
      delete document.documentElement.dataset.sheetOpen;
      prevFocus?.focus?.();
    };
  }, [open]);

  // ---- 아래로 끌어 닫기 (모바일) ----
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    let d: { y0: number; x0: number; t0: number; active: boolean | null; inBody: boolean } | null = null;
    let samples: { y: number; t: number }[] = [];
    const onStart = (e: TouchEvent) => {
      if (window.innerWidth >= 1024 || e.touches.length !== 1) return;
      const t = e.touches[0];
      d = { y0: t.clientY, x0: t.clientX, t0: e.timeStamp, active: null, inBody: !!bodyRef.current?.contains(e.target as Node) };
      samples = [{ y: t.clientY, t: e.timeStamp }];
    };
    const onMove = (e: TouchEvent) => {
      if (!d) return;
      const t = e.touches[0];
      const dy = t.clientY - d.y0;
      if (d.active === null) {
        if (Math.hypot(t.clientX - d.x0, dy) < 6) return;
        // 아래로 끌 때만, 그리고 내용이 맨 위일 때만 시트를 움직인다
        d.active = dy > 0 && Math.abs(dy) > Math.abs(t.clientX - d.x0) && (!d.inBody || (bodyRef.current?.scrollTop ?? 0) <= 0);
        if (d.active) setDragging(true);
      }
      if (!d.active) return;
      e.preventDefault();
      samples.push({ y: t.clientY, t: e.timeStamp });
      if (samples.length > 5) samples.shift();
      setDragY(Math.max(0, dy));
    };
    const onEnd = () => {
      if (!d) return;
      const drag = d;
      d = null;
      if (!drag.active) return;
      setDragging(false);
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dy = last.y - drag.y0;
      // 최근 몇 번의 움직임으로 잰 속도(px/ms) — 짧게 툭 튕겨도 닫히게
      const v = last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0;
      // 길게 끌었거나, 40px 이상을 빠르게(0.3px/ms 이상) 끌어내리면 닫는다
      if (dy > 110 || (dy > 40 && v > 0.3)) {
        setDragY(0);
        onCloseRef.current();
      } else {
        setDragY(0);
      }
    };
    panel.addEventListener("touchstart", onStart, { passive: true });
    panel.addEventListener("touchmove", onMove, { passive: false });
    panel.addEventListener("touchend", onEnd);
    panel.addEventListener("touchcancel", onEnd);
    return () => {
      panel.removeEventListener("touchstart", onStart);
      panel.removeEventListener("touchmove", onMove);
      panel.removeEventListener("touchend", onEnd);
      panel.removeEventListener("touchcancel", onEnd);
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center lg:items-center">
      <div
        className="absolute inset-0 bg-coffee-900/45 backdrop-blur-[2px] animate-fade-in"
        style={dragY ? { opacity: Math.max(0.35, 1 - dragY / 400) } : undefined}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-sheet outline-none animate-sheet-up lg:rounded-3xl lg:animate-fade-up ${
          dragging ? "" : "transition-[translate] duration-200 ease-out"
        }`}
        // 등장 애니메이션(transform)과 겹치지 않도록 끌기는 별도 translate 속성으로
        style={{ translate: `0 ${dragY}px` }}
      >
        {/* 모바일: 아래에서 올라온 시트임을 알리는 손잡이 (장식) */}
        <span className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-cream-300 lg:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-3 lg:pt-5">
          <div>
            <h2 id={titleId} className="text-section text-coffee-900">
              {title}
            </h2>
            {description && <p className="mt-1 text-meta text-coffee-400">{description}</p>}
          </div>
          <button onClick={onClose} className="icon-btn border-transparent" aria-label="닫기">
            <X size={18} />
          </button>
        </div>
        {children && (
          <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
            {children}
          </div>
        )}
        {footer && (
          <div className="flex gap-2 border-t border-cream-200 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
