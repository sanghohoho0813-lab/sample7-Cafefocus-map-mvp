"use client";

import { Share } from "lucide-react";
import { useApp } from "@/lib/store";

/**
 * 카페 링크 공유. 휴대폰은 기기 공유 창, 그 밖에는 링크 복사 + 알림.
 * 주소가 곧 상태라(카페·목적·시간) 받은 사람도 같은 화면을 연다.
 */
export default function ShareButton({
  title,
  path,
  onImage = false,
  className = "",
}: {
  title: string;
  /** 공유할 경로 (origin 제외) */
  path: string;
  /** 사진 위에 올리는 반투명 버튼 */
  onImage?: boolean;
  className?: string;
}) {
  const { showToast } = useApp();

  const share = async () => {
    const url = `${window.location.origin}${path}`;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `${title} · CafeFocus`, url });
      } catch {
        // 사용자가 공유 창을 닫은 경우 — 아무것도 하지 않는다
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast(`링크를 복사했어요 · ${title}`);
    } catch {
      showToast("링크를 복사하지 못했어요. 주소창의 링크를 공유해 주세요.");
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
        onImage
          ? "bg-white/90 text-coffee-700 shadow-card hover:bg-white focus-visible:outline-white"
          : "text-coffee-500 hover:bg-cream-100 hover:text-coffee-800 focus-visible:outline-coffee-600"
      } ${className}`}
      aria-label="링크 공유"
      title="링크 공유"
    >
      <Share size={17} />
    </button>
  );
}
