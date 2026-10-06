"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * 모바일에서는 바텀시트, 데스크톱에서는 가운데 대화상자.
 * Esc·배경 클릭으로 닫히고, 닫히면 열었던 버튼으로 포커스를 돌려준다.
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
  const titleId = useId();
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

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center lg:items-center">
      <div className="absolute inset-0 bg-coffee-900/40 animate-fade-in" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-sheet outline-none animate-sheet-up lg:rounded-3xl lg:animate-fade-up"
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
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
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>}
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
