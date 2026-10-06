"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useApp } from "@/lib/store";
import { getCafe } from "@/lib/data/cafes";

export default function FavoriteButton({
  cafeId,
  className = "",
  onImage = false,
}: {
  cafeId: string;
  className?: string;
  /** 사진 위에 올릴 때 반투명 배경 */
  onImage?: boolean;
}) {
  const { isFavorite, toggleFavorite, showToast, hydrated } = useApp();
  const [popping, setPopping] = useState(false);
  const fav = hydrated && isFavorite(cafeId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const name = getCafe(cafeId)?.name ?? "카페";
        const added = toggleFavorite(cafeId);
        setPopping(true);
        window.setTimeout(() => setPopping(false), 350);
        showToast(
          added ? `저장했어요 · ${name}` : `저장을 해제했어요 · ${name}`,
          // 해제는 실수로 누르기 쉬워 바로 되돌릴 수 있게
          added ? { label: "저장 목록", href: "/favorites" } : { label: "되돌리기", onClick: () => toggleFavorite(cafeId) }
        );
      }}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coffee-600 ${
        onImage
          ? "bg-white/90 text-coffee-600 shadow-card hover:bg-white"
          : "border border-cream-300 bg-white text-coffee-500 hover:border-coffee-300"
      } ${fav ? "text-rose-500" : ""} ${className}`}
      aria-label={fav ? "저장 해제" : "저장하기"}
      aria-pressed={fav}
    >
      <Heart
        size={18}
        strokeWidth={2.1}
        fill={fav ? "currentColor" : "none"}
        className={popping ? "animate-heart-pop" : ""}
      />
    </button>
  );
}
